# Contributing to Sortify

These guidelines apply to all contributors, including coding agents.

Sortify tracks Spotify listening behavior to help users identify low-engagement songs and clean up their playlists. The current app uses React and Vite in `frontend/`, a Node.js/Express backend, and SQLite listening history. Read [README.md](README.md) for setup and architecture and [backend/README.md](backend/README.md) for API details. The historical hackathon plan in `AGENTS.md` contains superseded frontend-only guidance.

## Branch workflow

- Make changes on an individual development or feature branch, never directly on `main`.
- Use descriptive branch names, such as `feat/listening-history`, `fix/login-redirect`, or `docs/setup`. Coding agents should use the `codex/` prefix, such as `codex/docs-contributing`.
- Keep branches and pull requests focused on a single change. Avoid unrelated cleanup.
- Discuss significant architectural changes in an issue before implementing them.
- Open a pull request to merge into `main`. Use a draft PR for unfinished work.

## Worktree location

- Create every new Git worktree inside the primary repository's `worktrees/` directory, using `worktrees/<descriptive-name>/`.
- This applies to all contributors and coding agents. Do not create worktrees in external directories, including Codex's default `~/.codex/worktrees/` location. Use Git directly when a tool cannot choose a repository-local destination.
- Run worktree creation commands from the primary repository root, not from another worktree. Reuse a suitable existing worktree when possible and avoid nesting worktrees inside each other.
- The root `worktrees/` directory is ignored by Git. Never stage or commit its contents.

For example, from the primary repository root:

```sh
mkdir -p worktrees
git worktree add -b codex/dashboard-layout worktrees/dashboard-layout HEAD
```

Make changes and run checks from the new worktree's directory. Uncommitted changes in the primary checkout are not copied automatically. When finished and the work is safely preserved, remove the checkout with `git worktree remove worktrees/dashboard-layout` from the primary repository root.

## Conventional Commits

Use the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) format:

```text
<type>[optional scope][!]: <description>
```

Common types are `feat`, `fix`, `docs`, `refactor`, `test`, and `chore`. Write concise, descriptive summaries.

Examples:

```text
feat(history): add listening history filters
fix(auth): handle expired sessions
docs: add local setup instructions
```

Mark breaking changes with `!` after the type or scope, or with a `BREAKING CHANGE:` footer. Explain the impact and migration steps in the commit body or PR description.

## Pull requests and review

Include the following in each PR:

- What changed and why.
- Links to related issues, when applicable.
- How the change was tested, including any checks that could not be run.
- Screenshots for visible UI changes.
- Any breaking changes, new dependencies, or configuration requirements.

Before merging:

- Obtain at least one approval from a reviewer other than the author.
- Resolve review feedback and pass all applicable checks.
- Use a Conventional Commit PR title, since PRs should be squash-merged into `main`.
- Delete the source branch after merging when it is no longer needed.

Keep feedback respectful and constructive. Authors should respond to review comments and explain any tradeoffs.

## Quality and testing

- Follow existing code style and project conventions.
- Add or update tests for behavior changes and bug fixes when test infrastructure is available.
- Run applicable formatting, linting, build, and test checks before requesting review.
- Record the commands run and their results in the PR. If a check is unavailable or cannot be run, say so rather than claiming it passed.

Use Node.js 24 or newer. Install dependencies with `npm install` and follow [README.md](README.md#run-locally) to configure Spotify. Run the app with `npm run dev` and open `http://127.0.0.1:3000`. Serve it through the backend so authentication and API requests use the same origin.

Run the API tests before requesting review:

```sh
npm test
```

These tests mock Spotify and use temporary databases. Add or update coverage for changes to authentication, session security, account isolation, input validation, classification, and persistence.

For UI changes and changes affecting the complete listening flow, also run the browser checks:

```sh
npx playwright install chromium
npm run test:browser
```

If Google Chrome is already installed, use `PLAYWRIGHT_CHANNEL=chrome npm run test:browser` instead. The browser checks use mocked Spotify playback and a temporary database; they do not require a real Spotify login. Check desktop and mobile layouts for visible changes.

Run `npm run build` to compile the React dashboard. The test scripts build it automatically; `npm start` requires a build. `npm run dev` provides frontend hot reload on the backend origin; restart it after backend or environment changes. Use `SORTIFY_BROWSER_DEV=1 PLAYWRIGHT_CHANNEL=chrome npm run test:browser` to check development middleware and React Strict Mode as well as the built app. There are no separate formatting or lint scripts. Never run destructive tests against personal, shared, or demo listening history. Database changes should include compatibility or migration instructions and tests using temporary data.

## Playback tracking and Spotify testing

- The current classification threshold is 55%, with five-second active polling and one-minute idle polling. Keep backend classification, frontend notices, tests, and documentation consistent when changing these values.
- Classification uses the highest observed playback position relative to track duration. Treat results as estimates: polling can miss rapid skips, seeking affects the observed position, and same-track repeats are not yet separate listens.
- Keep the page open and visible during live playback tests. Observation pauses when the tab is hidden or closed.
- Prefer mocked tests for development. When a real Spotify check is necessary, use one Sortify tab, coordinate with other testers sharing the client ID, and record the account/device setup without exposing private information.
- Respect Spotify `429` responses and the `Retry-After` header. Avoid rapid refreshes or repeated manual API calls during a cooldown.
- Describe recently played history as a comparison signal, not proof of a skip or completion. Do not claim Sortify reproduces Spotify stream counts.

## Documentation and dependencies

- Update documentation when setup, usage, behavior, or configuration changes.
- Keep the root README and backend README consistent with the active Express/SQLite architecture. New listening history belongs in the account-scoped backend store; legacy browser history is not automatically imported.
- Explain why new dependencies are needed and include corresponding lockfile changes when applicable.
- Do not commit generated files or local development artifacts unless the project explicitly tracks them.
- Keep `.env`, `.data/`, SQLite databases and their journal files, encryption keys, and personal test exports out of Git. Use `.env.example` for configuration examples.

## Security

- Never commit credentials, tokens, private data, or local secret files.
- Use placeholders in configuration examples.
- Keep Spotify access and refresh tokens on the server. Preserve encrypted token storage, HttpOnly cookie sessions, CSRF and Origin checks, OAuth state/PKCE validation, and account isolation.
- Preserve the exact Spotify read-endpoint allowlist and minimum required scopes. Discuss changes to permissions, playback control, or playlist writes before implementing them.
- Validate API input on the server, use prepared database statements, and render Spotify-provided text as escaped React text, never raw HTML.
- Keep the default server bound to loopback. Public deployment requires HTTPS, Secure cookies, deployment-specific origin settings, and a review of the local security assumptions described in the README.
- If a secret is accidentally committed, notify the maintainers promptly and rotate or revoke it; deleting the file alone is not sufficient.
- Do not disclose sensitive vulnerability details in public issues or PRs. Coordinate privately with the maintainers.
