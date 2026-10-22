# 4. Static site only: no server, no accounts, no Docker image

Status: accepted

## Context

An assessment can describe sensitive systems and the people they affect. A hosted service would need accounts, storage, a privacy policy and a threat model, none of which this reference needs in order to make its point.

## Decision

The app is a Vite build of static files. State lives in memory, in the browser's `localStorage` (autosave) and in files the user exports. Nothing is sent anywhere; there are no analytics, no fonts or scripts from other origins, and no environment variables. The demo is published, when allowed, as GitHub Pages ([deploy notes](../deploy.md)). There is therefore no Dockerfile and no `.env.example`: `dist/` runs on any static host.

## Consequences

- Nothing to secure server-side, and nothing to leak from this project.
- No sharing, no history and no multi-user editing. Use git on the exported JSON.
- `localStorage` is per browser and can be cleared by the user or the browser; autosave is a convenience, not a backup. Export is the way to keep work.
