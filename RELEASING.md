# Releasing

Releases follow [SemVer](https://semver.org/) and are cut from `main`. A published GitHub Release is the only thing that produces versioned images. Publishing an image never deploys it; the homelab changes only when its `image.tag` is edited.

## Versions

Keep these in sync with the tag (`vX.Y.Z`):

- `package.json` `version` (also reported by `/health/live`)
- `deploy/helm/secret-santa/Chart.yaml` `version` and `appVersion`

The release workflow fails if they differ.

## Checklist

1. Start from an up-to-date `main` with a green `Verify and publish container` run.
2. Bump the version in a pull request (`main` accepts changes only through squash-merged PRs with a passing `verify` check):
   ```sh
   git switch -c release/vX.Y.Z
   npm version X.Y.Z --no-git-tag-version
   # edit version and appVersion in deploy/helm/secret-santa/Chart.yaml
   git commit -am "Release vX.Y.Z"
   git push -u origin release/vX.Y.Z
   gh pr create --fill && gh pr merge --squash --auto
   ```
3. Once merged, publish the release (`v*` tags cannot be moved or deleted afterwards):
   ```sh
   gh release create vX.Y.Z --target main --generate-notes
   ```
4. Wait for the `Release` workflow. It verifies the code and pushes `ghcr.io/nunosousa-dev/secret-santa:X.Y.Z`, `:X.Y` and `:sha-<commit>`.
5. If the release adds files under the migrations folder, state it in the release notes (label PRs `migration`).

## Deploying a release

Deployment is a separate, manual step. See [deploy/README.md](deploy/README.md).

1. Create and verify a backup first; the database holds family data that cannot be recreated.
2. Set `image.tag: X.Y.Z` in the homelab values.
3. Migrations run on startup. Rolling back only the image is safe when the previous version accepts the current schema; otherwise restore the matching backup.
