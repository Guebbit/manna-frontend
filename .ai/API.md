# API layer

Generated types (`api/`)

- Source: `openapi.yaml` (copied from `Guebbit/manna`) → `npm run genapi`
- Generator: OpenAPI Generator CLI via `openapi-typescript-codegen` binary (`openapi --client axios`)
- Types have NO `I` prefix (e.g. `RunRequest`, `WorkflowResponse`)
- Import via aliases: `import type { RunRequest } from '@api'`
- Never edit files under `api/` manually — re-run `genapi` instead

SSE event types (`src/api/sseEvents.ts`)

- Hand-written; cannot be generated from OpenAPI
- Covers: `AgentStreamEvent`, `SwarmStreamEvent`, `WorkflowStreamEvent`
- Import via: `import type { AgentStreamEvent } from '@/api/sseEvents'`

HTTP client (`src/api/manna.ts`)

- App-facing wrappers use native `fetch`
- All request/response types imported from `@api` or `sseEvents.ts`
- Streaming endpoints are `AsyncGenerator` functions using shared `parseSseStream()`
- Errors thrown as `ApiError(message, status, retryAfterSeconds?)`
- Base URL always via `getMannaBaseUrl()` from `@/config` — never hardcoded

Generated Axios client (`src/utils/api.ts`)

- Built from the same `api/` OpenAPI output and wired through `src/utils/http.ts`
- Not currently used by Pinia stores for runtime flows; retained while transport unification is deferred

Stores → API boundary

- Stores import functions from `@/api/manna` only
- Stores never import from `api/models/` directly for runtime logic — only for typing
- `WorkflowRequest.steps` is `StepDefinition[]`; stores mapping `string[]` → `StepDefinition[]` internally

Deprecated / removed

- `/v1/models`, `/v1/chat/completions` — removed; do not re-add
- `src/api/types.ts` — deleted; do not recreate
