# Changelog

All notable changes to the Manna Frontend are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/).

> **Backend version tracking**: Each frontend version entry records the Manna backend
> version it is synced against. This makes it easy to see which backend features are
> supported by each frontend release.

---

## [Unreleased] — synced with Manna backend `0.15.0-alpha`

### Added

- **SSE streaming for agent tasks** (`POST /run/stream`): new `runTaskStream()` API function, `AgentStreamEvent` types, streaming support in `useAgentStore`, and stream toggle in `AgentView.vue`.
- **Swarm orchestration** (`POST /run/swarm`, `POST /run/swarm/stream`): full types (`ISwarmRequest`, `ISwarmResponse`, `SwarmStreamEvent`), `runSwarm()` and `runSwarmStream()` API functions, `useSwarmStore`, new `SwarmView.vue` with streaming event feed.
- **Info endpoints** (`GET /info/modes`, `GET /info/models`, `GET /help`): types (`IInfoModesResponse`, `IInfoModelsResponse`, `IHelpResponse`), API functions (`fetchInfoModes()`, `fetchInfoModels()`, `fetchHelp()`), extended `useSystemStore`, new `SystemInfoView.vue`.
- **Workflow orchestration** (`POST /workflow`, `POST /workflow/stream`): full types (`IWorkflowRequest`, `IWorkflowResponse`, `WorkflowStreamEvent` and related interfaces), `runWorkflow()` and `runWorkflowStream()` API functions, `useWorkflowStore`, new `WorkflowView.vue` with dynamic step builder, carry mode selector, streaming event feed, and per-step result accordion.
- **`SwarmView.vue`** — new page for submitting and monitoring multi-agent swarm tasks.
- **`SystemInfoView.vue`** — new page displaying Manna instance metadata (routing profiles, Ollama models, API reference).
- **`WorkflowView.vue`** — new page for building and running sequential multi-step workflows.
- **`CHANGELOG.md`** — this file, tracking frontend changes and their corresponding backend versions.
- Router routes for `/swarm`, `/system`, and `/workflow`.
- Quick action buttons for Swarm, System Info, and Workflow on the Dashboard.
- Backend version display in the Settings "About" card.

### Changed

- **`openapi.yaml`** synced with Manna backend `v0.15.0-alpha` — adds `swarm`, `info` tags, `/run/stream`, swarm endpoints, info endpoints, fixes stale descriptions.
- **`src/api/types.ts`** expanded with all swarm, streaming, info, and workflow endpoint types.
- **`src/api/manna.ts`** expanded with 8 new API functions (including `runWorkflow()` and `runWorkflowStream()`).
- **`src/stores/agent.ts`** — added SSE streaming support (`submitTaskStream`, `streamEvents`).
- **`src/stores/system.ts`** — added modes, Ollama model info, and help state + fetch actions.
- **`src/views/AgentView.vue`** — added streaming toggle and live event feed.
- **`src/views/DashboardView.vue`** — added Swarm, System Info, and Workflow quick actions.
- **`src/views/SettingsView.vue`** — displays tracked backend version.

---

## [1.0.0] — synced with Manna backend `0.14.0-alpha`

### Added

- Initial frontend release with: Dashboard, Chat (streaming via OpenAI compat), Agent task submission, IDE tools (autocomplete, lint, page review), Upload & Analyze (image, audio, PDF), Graph Builder, Settings.
- Full type coverage for all endpoints up to Manna `0.14.0-alpha`.
