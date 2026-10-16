#!/bin/bash
# Tests for the docker-build-guard wrapper. Runs anywhere: a stub replaces /usr/bin/docker
# and records the argv it receives.
set -u
here="$(cd "$(dirname "$0")" && pwd)"
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
cat >"$tmp/real" <<'EOF'
#!/bin/bash
printf '%s\n' "$@" >"$STUB_OUT"
exit 7
EOF
chmod +x "$tmp/real"
export DOCKER_BUILD_GUARD_REAL="$tmp/real" DOCKER_BUILD_GUARD_LOG="$tmp/log" STUB_OUT="$tmp/argv"
pass=0; fail=0

run() { rm -f "$STUB_OUT"; "$here/docker" "$@" >/dev/null 2>"$tmp/err"; echo $?; }

refused() {  # args... : must exit 1, must not reach docker, must log
  local rc; rc="$(run "$@")"
  if [[ "$rc" == 1 && ! -e "$STUB_OUT" ]] && grep -q 'docker-build-guard: refused' "$tmp/err"; then
    pass=$((pass + 1))
  else
    fail=$((fail + 1)); echo "FAIL refused: docker $* (rc=$rc)"
  fi
}

passes() {  # expected-argv-joined-by-| args... : must reach docker with exactly that argv, exit code preserved
  local want="$1"; shift
  local rc got; rc="$(run "$@")"; got="$(paste -sd'|' "$STUB_OUT" 2>/dev/null)"
  if [[ "$rc" == 7 && "$got" == "$want" ]]; then pass=$((pass + 1)); else
    fail=$((fail + 1)); echo "FAIL passes: docker $*"; echo "   want: $want"; echo "   got:  $got (rc=$rc)"; fi
}

# --- refused
refused build .
refused build -t x:1 -f Dockerfile .
refused --context default build .
refused -H unix:///var/run/docker.sock build .
refused image build .
refused builder build .
refused buildx build .
refused buildx b .
refused buildx bake
refused buildx history ls
refused compose build
refused compose -f a.yml -p proj build app
refused compose --profile tools build
refused compose watch
refused compose up -d --build
refused compose -f a.yml up --build app
refused compose create --build
refused compose run --build --rm app
refused --log-level debug compose --project-directory /x up --build

# --- passed through unchanged
passes "ps|-q" ps -q
passes "inspect|--format|{{.Name}} {{.Image}}|c1" inspect --format '{{.Name}} {{.Image}}' c1
passes "images" images
passes "pull|ghcr.io/ryosukemondo/x:abc" pull ghcr.io/ryosukemondo/x:abc
passes "push|ghcr.io/ryosukemondo/x:abc" push ghcr.io/ryosukemondo/x:abc
passes "tag|a|b" tag a b
passes "run|--rm|alpine|echo|build" run --rm alpine echo build
passes "exec|c|sh|-c|npm run build" exec c sh -c 'npm run build'
passes "image|prune|-f" image prune -f
passes "image|ls" image ls
passes "buildx|du" buildx du
passes "buildx|version" buildx version
passes "builder|prune|-f" builder prune -f
passes "compose|ps" compose ps
passes "compose|logs|--tail|5|app" compose logs --tail 5 app
passes "compose|pull" compose pull
passes "compose|version" compose version
passes "compose|--profile|tools|run|--rm|migrate" compose --profile tools run --rm migrate
passes "compose|exec|app|sh|-c|echo --build" compose exec app sh -c 'echo --build'
passes "compose|run|--rm|app|--|--build" compose run --rm app -- --build
passes "" ""
passes "--version" --version

# --- compose up/create get --no-build
passes "compose|up|--no-build|-d" compose up -d
passes "compose|-f|a.yml|-p|p|up|--no-build|-d|--force-recreate|app" compose -f a.yml -p p up -d --force-recreate app
passes "compose|up|-d|--no-build|app" compose up -d --no-build app
passes "compose|create|--no-build" compose create
passes "--context|default|compose|--env-file|.env|up|--no-build|-d" --context default compose --env-file .env up -d

# --- override
rm -f "$STUB_OUT"; VPS_ALLOW_BUILD=1 "$here/docker" build . >/dev/null 2>&1
if [[ "$(paste -sd'|' "$STUB_OUT")" == "build|." ]] && grep -q 'verdict=override' "$tmp/log"; then pass=$((pass + 1)); else fail=$((fail + 1)); echo "FAIL override"; fi
# --- refusals are logged
if grep -q 'verdict=refused' "$tmp/log"; then pass=$((pass + 1)); else fail=$((fail + 1)); echo "FAIL refusal log"; fi
# --- an unwritable log never breaks docker
rm -f "$STUB_OUT"; DOCKER_BUILD_GUARD_LOG=/nonexistent/dir/log "$here/docker" ps >/dev/null 2>&1
if [[ -e "$STUB_OUT" ]]; then pass=$((pass + 1)); else fail=$((fail + 1)); echo "FAIL unwritable log"; fi

echo "docker-build-guard tests: $pass passed, $fail failed"
(( fail == 0 ))
