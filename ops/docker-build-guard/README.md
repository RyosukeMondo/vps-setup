# docker-build-guard

The production VPS (`xserver_vps12_rmondo`: 6 cores, 11 GB, ~100 containers) must not build
Docker images. Builds there pushed swap to ~95% and slowed every service. Every project builds
on a workstation, pushes to private GHCR (`ghcr.io/ryosukemondo/<name>:<sha>`) and the VPS only
pulls (pattern: `zukkey/scripts/lib/ghcr.sh`, simplest copy: `publish-sites/deploy/deploy.sh`).

`docker` here is installed as `/usr/local/bin/docker`, which comes before `/usr/bin/docker` in
every shell's PATH on the VPS (interactive and `ssh host cmd`). It refuses:

| command | why |
|---|---|
| `docker build`, `image build`, `builder build`, `buildx build/b/bake` | builds |
| `docker compose build`, `compose watch`, `--build` on `compose up/create/run` | builds |
| `docker buildx history` | dockerd restarted during it on 2026-10-16 and all containers stayed down |

and adds `--no-build` to `docker compose up` / `create`, so a service whose image is missing
fails with an error instead of building. Everything else is `exec`'d unchanged (argv, stdio,
exit code). Refusals and overrides are logged to `/var/log/docker-build-guard.log`.

Override for a deliberate one-off: `VPS_ALLOW_BUILD=1 docker ...` (logged).

## Use

```sh
./test.sh                         # 49 cases, runs anywhere (a stub replaces /usr/bin/docker)
./install.sh [ssh-host]           # tests locally and on the host, atomic swap, live checks
./install.sh [ssh-host] --remove  # back to plain /usr/bin/docker
```

## Known gaps

- Anything calling `/usr/bin/docker` by absolute path, the Engine API directly (SDKs) or the
  buildx plugin binary bypasses it. The systemd units on the VPS that use `/usr/bin/docker`
  only run `compose up`/`info` on existing images.
- `docker compose run` has no `--no-build`; it can still build a service that has a `build:`
  section and no image. Production compose files therefore carry no `build:` sections.
