# Structure + change map

Directory map

```text
src/
├─ api/          manna.ts (HTTP), sseEvents.ts (SSE unions)
├─ components/   layout/ + shared/ reusable Vue components
├─ layouts/      page-level shells
├─ router/       route definitions (lazy-loaded views)
├─ stores/       one Pinia store per file
├─ types/        shared TS types + re-exports (barrel: types/index.ts only)
├─ views/        route-level pages
├─ config.ts     getMannaBaseUrl() + runtime config helpers
└─ main.ts       app bootstrap
api/             openapi-generator output — DO NOT edit manually
openapi.yaml     copied from Guebbit/manna — source of truth for all API types
```

Common change patterns
| Goal | Primary files |
|---|---|
| Add API endpoint | `openapi.yaml` (backend), run `genapi`, update `src/api/manna.ts` |
| Add SSE event type | `src/api/sseEvents.ts` |
| Add store | `src/stores/<name>.ts` |
| Add view/route | `src/views/<Name>View.vue` + `src/router/index.ts` |
| Add reusable component | `src/components/shared/<Name>.vue` |
| Change backend URL | `VITE_MANNA_BASE_URL` in `.env` |
| Change request/response shape | Re-generate `api/` via `npm run genapi` |

Test layout

- Unit: `tests/unit/**/*.spec.ts` — Vitest, no real backend
- E2E: `tests/e2e/**/*.spec.ts` — Cypress, requires running frontend + backend
- Run all: `npm run complete:check`
