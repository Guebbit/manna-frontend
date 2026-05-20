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

Runtime HTTP client (`src/utils/api.ts` + `src/utils/http.ts`)

- All non-SSE HTTP requests must use generated Axios clients (`coreApi`, `chatApi`, etc.)
- Stores consume generated response envelopes (`response.data?.…`) directly
- Base URL always via `getMannaBaseUrl()` from `@/config` — never hardcoded

SSE runtime helper (`src/utils/sse.ts`)

- Streaming endpoints use minimal `fetch`-based helpers because generated axios methods do not stream SSE event-by-event in the browser
- `fetch` must not be used for non-streaming calls

Stores → API boundary

- Stores import generated clients from `@/utils/api` for non-streaming calls
- Stores import `runTaskStream`/`runSwarmStream`/`runWorkflowStream` from `@/utils/sse` for streaming calls
- `WorkflowRequest.steps` is `StepDefinition[]`; stores mapping `string[]` → `StepDefinition[]` internally

Deprecated / removed

- `/v1/models`, `/v1/chat/completions` — removed; do not re-add
- `src/api/manna.ts` and custom `ApiError` handling — removed; do not recreate
