# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (exposed on --host for external access)
npm run build    # Production build (output to dist/)
npm run preview  # Preview the production build locally
```

No test suite is configured.

ESLint is configured with `eslint.config.js`

Node 24 is required (see `.nvmrc`). Use `nvm use` to activate it.

## Architecture

Vue 3 SPA built with Vite, using `<script setup>` composition API throughout.

**State:** Single Pinia store at `src/stores/user.js` — holds `user` (username) and `token`, both persisted to localStorage via `@vueuse/core` `useStorage()`. Auth header sent as `x-auth-token`.

**Routing:** `src/router.js` — five routes (`/`, `/login`, `/profile`, `/edit/user`, `/edit/goal`). Root redirects to `/profile`. A `beforeEach` guard redirects unauthenticated users to `/login` for all routes except `/` and `/login`.

**UI:** Vuetify 3 (Material Design) for all components. MDI icons via `@mdi/font`.

**Charts:** Chart.js 3 via `vue-chart-3` wrapper, used on the Profile dashboard for the weight history line chart.

**API calls:** Views use a shared axios instance at `src/utils/api.js`, baseURL'd to the weight tracker API. It automatically attaches the `x-auth-token` header and handles 401/403 by resetting auth state and redirecting to `/login`. Login.vue uses bare axios directly (it posts to the auth API, which has no token yet). Two backend services:
- `https://auth-api-go.shultzlab.com` — login only (base URL in `src/config.js`)
- `https://weight-tracker-api.shultzlab.com` — all weight/stats/goal data (base URL in `src/config.js`)

See `local-docs/goal-docs.md` for Goals endpoint reference.

**Key view: `src/views/Profile.vue`** — the main dashboard. Fetches weight entries, stats (BMR/TDEE/BMI), and goals on mount. Handles time range filtering, add-weight dialog, goal display, and TDEE options dialog. Most feature work happens here.

**Weight units:** stored in kg on the backend, converted to lbs for display via `src/utils/units.js` (`convertKgsToLbs` / `convertLbsToKgs`).

## Deployment

Docker multi-stage build (Node LTS Alpine → `nginxinc/nginx-unprivileged:1.29`), served on port 8080. `nginx.conf` uses `try_files $uri /index.html` for SPA routing. `buildAndSaveImage.sh` builds and pushes to GCP Artifact Registry; `helmDeploy.sh` deploys via Helm to Kubernetes.