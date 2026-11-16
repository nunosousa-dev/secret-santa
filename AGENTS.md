<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Language conventions

- Write documentation, identifiers, comments, command-line output and developer diagnostics in English.
- Keep family-facing UI, accessibility text, metadata, validation messages and fictional profile content in European Portuguese (`pt-PT`).
- Use English names for new routes and deployment resources. Preserve compatibility with previously shared URLs and permanent public profile IDs.

## Commit conventions

- Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages and pull request titles: `type(scope)!: subject`, with types `feat`, `fix`, `perf`, `refactor`, `docs`, `style`, `test`, `build`, `ci`, `chore` or `revert`.
- Write the subject in the imperative, starting lowercase, without a trailing period. Mark breaking changes with `!` and a `BREAKING CHANGE:` footer.
- `main` accepts only squash-merged pull requests, so the PR title becomes the commit on `main`; the `conventional-title` check enforces it.
- Map types to SemVer when releasing: `feat` → minor, `fix`/`perf` → patch, breaking change → major.
