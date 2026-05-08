# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (exposed on --host for external access)
npm run build    # Production build (output to dist/)
npm run preview  # Preview the production build locally
```

No linter or test suite is configured.

Node 22 is required (see `.nvmrc`). Use `nvm use` to activate it.

## Architecture

Vue 3 SPA built with Vite, using `<script setup>` composition API throughout.

**State:** Single Pinia store at `src/stores/user.js` — holds `user` (username) and `token`, both persisted to localStorage via `@vueuse/core` `useStorage()`. Auth header sent as `x-auth-token`.

**Routing:** `src/router.js` — five routes (`/`, `/login`, `/profile`, `/edit/user`, `/edit/goal`). Home redirects to `/login` or `/profile` based on store token presence.

**UI:** Vuetify 3 (Material Design) for all components. MDI icons via `@mdi/font`.

**Charts:** Chart.js 3 via `vue-chart-3` wrapper, used on the Profile dashboard for the weight history line chart.

**API calls:** All made directly in view components with axios. Two backend services:
- `https://auth-api-go.shultzlab.com` — login only
- `https://weight-tracker-api.shultzlab.com` — all weight/stats/goal data

API base URLs are hardcoded (no `.env` config). See `local-docs/goal-docs.md` for Goals endpoint reference.

**Key view: `src/views/Profile.vue`** — the main dashboard. Fetches weight entries, stats (BMR/TDEE/BMI), and goals on mount. Handles time range filtering, add-weight dialog, goal display, and TDEE options dialog. Most feature work happens here.

**Weight units:** stored in kg on the backend, converted to lbs for display (factor: `2.20462`).

## Deployment

Docker multi-stage build (Node LTS Alpine → `nginxinc/nginx-unprivileged:1.29`), served on port 8080. `nginx.conf` uses `try_files $uri /index.html` for SPA routing. `buildAndSaveImage.sh` builds and pushes to GCP Artifact Registry; `helmDeploy.sh` deploys via Helm to Kubernetes.