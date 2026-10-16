#!/bin/bash
# Install (or update) the docker-build-guard on a VPS: /usr/local/bin/docker in front of /usr/bin/docker.
#   ./install.sh [ssh-host]        default host: xserver_vps12_rmondo
#   ./install.sh [ssh-host] --remove
# Runs the test suite locally and on the host before swapping the file in atomically,
# then checks that ordinary docker calls still work and a build is refused.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
host="${1:-xserver_vps12_rmondo}"
mode="${2:-install}"

if [[ "$mode" == "--remove" ]]; then
  ssh "$host" 'sudo rm -f /usr/local/bin/docker && hash -r && command -v docker'
  exit 0
fi

"$here/test.sh"
stage="/tmp/docker-build-guard.$$"
ssh "$host" "mkdir -p $stage"
scp -q "$here/docker" "$here/test.sh" "$host:$stage/"
ssh "$host" "bash -s" <<REMOTE
set -euo pipefail
cd $stage
chmod +x docker test.sh
./test.sh                                   # same tests, on the host's bash
before=\$(/usr/bin/docker ps -q | wc -l)
sudo touch /var/log/docker-build-guard.log
sudo chmod 0666 /var/log/docker-build-guard.log
sudo install -m 0755 docker /usr/local/bin/docker.guard-new
sudo mv -f /usr/local/bin/docker.guard-new /usr/local/bin/docker
hash -r
test "\$(command -v docker)" = /usr/local/bin/docker
after=\$(docker ps -q | wc -l)
test "\$before" = "\$after"
docker compose version >/dev/null
if docker build -q - </dev/null 2>/dev/null; then echo "guard did not refuse a build" >&2; exit 1; fi
echo "installed: \$(command -v docker); running containers \$after (unchanged)"
rm -rf $stage
REMOTE
