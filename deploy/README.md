# Homelab deployment

These files match the infrastructure in the sibling `homelab` repository, where the chart lives at `kubernetes/apps/secret-santa/`. It was first deployed local-only through [homelab PR #10](https://github.com/nunosousa-dev/homelab/pull/10).

## Hostnames

One application and one database serve two hostnames at the same time:

| Hostname | Who | Path | Organiser area |
| --- | --- | --- | --- |
| `https://amigo-secreto.nunosousa.dev` (`publicHostname`) | Family, anywhere | Cloudflare → tunnel → Traefik listener `web` | `/admin` and `/api/admin` redirect (302) to the local hostname |
| `https://amigo-secreto.local.nunosousa.dev` (`hostname`) | LAN/VPN | Local DNS → Traefik listener `websecure`, local wildcard certificate | Available |

The public hostname is the canonical `APP_URL`: private editing links and printed QR codes always use it, including when the organiser generates them from the local hostname. The Deployment adds the local hostname to `ADDITIONAL_ORIGINS`, so forms on both hostnames can save. Sessions are per hostname: signing in on one does not sign in on the other.

Local DNS already resolves `*.local.nunosousa.dev` to the Gateway at `10.0.0.30`, and certificate `all-local-nunosousa-dev` covers it. Set `publicHostname: ""` for a local-only deployment; `APP_URL` then falls back to the local hostname and no public route is rendered.

Once family cards are printed, keep `publicHostname` unchanged: the QR codes encode it.

## Prepared configuration

- Talos/Proxmox `amd64` nodes labelled `homelab/node-type: vm`.
- Argo CD with local charts at `kubernetes/apps/<app>` and Applications at `kubernetes/apps/<app>.yaml`.
- Traefik Gateway `homelab`, namespace `traefik`: listener `websecure` for the local hostname, `web` for the public one.
- Public HTTPS terminates at Cloudflare; the tunnel forwards HTTP to `http://traefik.traefik.svc.cluster.local:80`.
- SQLite and avatar BLOBs live on an RWO `truenas-iscsi-retain` PVC, with one replica and Recreate rollouts.
- Optional backups use an RWX `truenas-nfs-retain` PVC. The active database stays on iSCSI.
- Runtime UID/GID 1001, no elevated privileges, read-only root filesystem and temporary `/tmp` storage.

Developer-facing resources use `secret-santa`: chart, release, Application, namespace and admin Secret names. These manifests have not been deployed, so no existing cluster resources need renaming.

HTTPRoutes spell out every field the Gateway API CRD defaults (`matches`, ref `group`/`kind`, backend `weight`); otherwise Argo CD reports them as permanently out of sync.

## Build and verify

From the application root, with Docker Desktop running:

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run smoke:auth
docker build --platform linux/amd64 -t secret-santa:local .
npm run smoke:container
```

The container test creates and removes only its own containers, volumes and temporary credentials. It verifies architecture, UID, read-only root, member creation/editing, avatars, cards, persistence, online backup and complete recovery onto a fresh volume. It does not use `.env.local` or real family data.

With Helm installed, validate both configurations:

```sh
helm lint deploy/helm/secret-santa --strict --set image.tag=test
helm lint deploy/helm/secret-santa --strict --set image.tag=test --set backup.enabled=true
helm lint deploy/helm/secret-santa --strict --set image.tag=test --set publicHostname=
helm template secret-santa deploy/helm/secret-santa --namespace secret-santa --set image.tag=test --set backup.enabled=true
```

`test` is a rendering placeholder. The chart requires an explicit image tag before installation.

## Publish the image

Source lives in [nunosousa-dev/secret-santa](https://github.com/nunosousa-dev/secret-santa), with SSH origin `git@github.com:nunosousa-dev/secret-santa.git`. `.github/workflows/image.yaml` verifies the code and publishes `ghcr.io/nunosousa-dev/secret-santa:sha-<full-commit-sha>` on pushes to `main` and manual runs. Pull requests build without publishing. Check the workflow result before configuring the homelab tag.

Set the verified commit tag in `image.tag`. The image must be public, or the namespace must contain a GHCR registry Secret referenced by `imagePullSecrets`.

## Prepare the admin Secret

The Deployment expects Secret `secret-santa-admin` in namespace `secret-santa`, with key `ADMIN_PASSWORD_HASH`. Keep plaintext passwords and unencrypted Kubernetes Secrets out of Git. `npm run admin:setup` prepares the hash in `.env.local`; running it again changes the local credential.

The following example reads the hash into memory and pipes the Secret directly to `kubeseal`. Run it from the application root after installing `kubeseal` and selecting the correct Kubernetes context. Only the encrypted result is saved; nothing is applied to the cluster:

```sh
node --env-file=.env.local --input-type=module - <<'NODE' | kubeseal --controller-name sealed-secrets-controller --controller-namespace kube-system --format yaml > /tmp/secret-santa-admin-sealed.yaml
const hash = process.env.ADMIN_PASSWORD_HASH;
if (!hash) throw new Error("Configure ADMIN_PASSWORD_HASH first.");
process.stdout.write(JSON.stringify({
  apiVersion: "v1",
  kind: "Secret",
  metadata: { name: "secret-santa-admin", namespace: "secret-santa" },
  type: "Opaque",
  data: { ADMIN_PASSWORD_HASH: Buffer.from(hash).toString("base64") }
}));
NODE
```

Confirm the command succeeded and the file contains a `SealedSecret` with `encryptedData.ADMIN_PASSWORD_HASH` before copying it into the chart templates. Encryption is bound to that Secret name and namespace. Readiness returns 503 if the hash is missing or invalid. Changing the hash and restarting the application invalidates previous admin sessions.

## Integrate with the homelab repository

Prepare a reviewable change in the homelab:

1. Copy `deploy/helm/secret-santa/` to `kubernetes/apps/secret-santa/`, keeping the homelab's `README.md` and `templates/admin-sealedsecret.yaml`.
2. Set the published image tag in `values.yaml` (the homelab copy also enables backups).
3. Copy `deploy/argocd/application.yaml` to `kubernetes/apps/secret-santa.yaml`.
4. Keep the `amigo-secreto.nunosousa.dev` entry in `kubernetes/bootstrap/cloudflared/templates/config.yaml`, above the final `http_status:404` catch-all, with service `http://traefik.traefik.svc.cluster.local:80`.
5. Review rendered manifests, then merge to `main`. The bootstrap ApplicationSet does not discover this user Application: re-apply `kubernetes/apps/secret-santa.yaml` with `kubectl` whenever it changes, and restart cloudflared after its configuration changes.

The homelab chart README lists the exact activation commands and checks.

The Application uses automated synchronisation. Publishing these files to the branch watched by Argo CD can start deployment. PVCs have Helm retention and `Prune=false` to prevent automatic deletion.

## Backups and recovery

Enable `backup.enabled: true` after verifying NFS write access for UID/GID 1001. The CronJob runs daily at 03:00 in `Europe/Lisbon`, with `concurrencyPolicy: Forbid`. It runs on the application's node to share the RWO volume; if the app is unscheduled, the backup may remain pending. Monitor job success and free space. There is no automatic snapshot deletion or off-site copy.

The image includes `node scripts/backup.mjs`. It uses SQLite's online backup API against the active database mounted read-only and writes a consistent snapshot to `/backups`. This includes committed WAL data and avatars, without running migrations. Use this mechanism rather than copying a live database file.

To restore:

1. Suspend automated sync/reconciliation during maintenance so Argo CD cannot recreate the app replica.
2. Suspend the CronJob and stop the application; preserve the previous volume for recovery.
3. Copy the chosen snapshot to a writable iSCSI volume at `/data/family.sqlite`, owned by UID/GID 1001. Keep old WAL/SHM files separate. Run from the writable copy rather than the NFS backup volume.
4. Start an image compatible with the restored schema, pointing at that volume.
5. Confirm readiness, login, profiles and avatars; resume backups and reconciliation.

Snapshots include editing-token hashes and sessions. Protect access to them. Recovery can reintroduce access that existed when the snapshot was taken; rotate links/credentials when needed.

## Upgrades and first use

Create and verify a backup before upgrading. Review migrations and update the immutable image tag in the homelab. Migrations run on startup; Recreate prevents overlapping app replicas and causes brief downtime. Rolling back only the image is safe when the previous version accepts the current schema; otherwise restore the matching snapshot as well.

After the first deployment, verify HTTPS over a mobile network, login/editing, avatar upload, persistence after pod replacement and backup/recovery on real storage. Recovery has already been checked with Docker volumes; cluster CSI/NFS acceptance remains pending.

Create real profiles in `/admin` on the local hostname, clear the demonstration flag in family settings and share private editing links manually. Print a sample from `/admin/cards`, fold it twice and scan it on a phone before printing the final cards. The container never seeds fictional data automatically.
