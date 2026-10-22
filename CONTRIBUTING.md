# Contributing

Thanks for taking a look. This is a small reference repository; focused changes are easiest to review.

## Setup

Node.js 24 and pnpm 11.

```bash
pnpm install
pnpm lint && pnpm typecheck && pnpm test
pnpm exec playwright install chromium && pnpm e2e   # browser tests
```

## Rules of the road

- Branch from `main`, open a pull request, and keep one logical change per PR. Merges use a merge commit.
- Conventional commit messages: `feat:`, `fix:`, `docs:`, `test:`, `ci:`, `chore:`.
- Keep strict TypeScript and the coverage thresholds in `vite.config.ts` green; if you lower one, say why in the PR.
- Domain rules belong in `src/lib/` as pure functions with tests; keep React components thin.
- Changing the assessment shape means updating `model.ts`, `validate.ts`, `io.ts` (both directions), the example and the tests together, and bumping `SCHEMA_VERSION` if old exports would no longer load.
- **Do not copy text from ISO/IEC 42005 or any other copyrighted standard** into the code, the docs or an issue. Describe things in your own words and link to the official page.
- Never commit secrets, personal data, or real organisations' assessments. Examples must be fictional.
