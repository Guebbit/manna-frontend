# Manna Frontend — AI index

MANDATORY: read this file first every session.

Identity

- Repo: `Guebbit/manna-frontend`
- Stack: Vue 3 (Composition API + `<script setup lang="ts">`), TypeScript strict, Vite, Pinia, Vuetify 3, Vue Router 4
- Backend: `Guebbit/manna` REST API — base URL from `VITE_MANNA_URL` (default `http://localhost:3001`, overridable in Settings via localStorage)

Key invariants

- API types come from generated `api/` (OpenAPI Generator output) — never hand-write request/response shapes
- SSE event shapes live ONLY in `src/api/sseEvents.ts`
- Non-streaming HTTP calls use generated Axios clients from `src/utils/api.ts`
- `fetch` is allowed only in `src/utils/sse.ts` for SSE POST streams
- Stores handle state, API modules handle HTTP, components handle presentation — never mix
- `npm run genapi` regenerates `api/` from `openapi.yaml`; commit the result
- Every exported symbol needs JSDoc; booleans named `isX`/`hasX`/`shouldX`

Update protocol

- Backend API changes → copy new `openapi.yaml` from `Guebbit/manna`, run `npm run genapi`, update `src/utils/sse.ts` + `src/api/sseEvents.ts` if stream payloads changed, update affected stores/views
- New store → one file per store, setup-style `defineStore`
- New view → lazy-loaded in `src/router/`
- Env var changes → update `.ai/ENV.md`
- Directory moves → update `.ai/STRUCTURE.md`
- Always run `npm run complete:check` before finishing

Load-on-demand map

- Directory map / change patterns / test layout → `.ai/STRUCTURE.md`
- Style / naming / JSDoc / formatting rules → `.ai/STYLE.md`
- API layer conventions (generated clients + SSE helper) → `.ai/API.md`
- Environment variables → `.ai/ENV.md`
