# Deploying the demo to GitHub Pages

The workflow [`.github/workflows/pages.yml`](../.github/workflows/pages.yml) builds the static site and publishes it. It is **ready but inert while the repository is private**: the `build` job is skipped (`!github.event.repository.private`) and GitHub Pages is not enabled, so nothing is published and nothing fails.

To turn it on (owner action, after reviewing the publication summary):

1. Make the repository public.
2. Settings > Pages > Build and deployment > Source: **GitHub Actions**.
3. Run the workflow from the Actions tab (or push to `main`). The site appears at `https://dc-tech-inc.github.io/ai-governance-toolkit/`.

The build sets `BASE_PATH=/ai-governance-toolkit/` so assets resolve under the project-site path. Locally the base is `/`.

The published site is the same static files you get from `pnpm build`. It stores nothing on a server; drafts stay in the visitor's browser.
