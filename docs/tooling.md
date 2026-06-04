# Tooling and libraries

This page explains the main tools that are **actively part of the repo's current workflow or code paths**.

If you only want one rule: start from the [README](../README.md), then use this page as a reference.

## Core app stack

| Tool | Why it is here | Where it shows up | Official docs |
| --- | --- | --- | --- |
| Vue 3 | App framework and component model | `src/main.ts`, `src/views/`, `src/components/` | https://vuejs.org/ |
| TypeScript | Static typing across the app | `tsconfig*.json`, `src/**/*.ts`, `<script setup lang="ts">` | https://www.typescriptlang.org/docs/ |
| Vite | Dev server and build tool | `vite.config.ts`, `npm run dev`, `npm run build` | https://vite.dev/guide/ |
| Pinia | State management | `src/stores/` | https://pinia.vuejs.org/ |
| Vue Router | Route management | `src/router/index.ts` | https://router.vuejs.org/ |
| Vuetify 3 | UI components and theming | `src/main.ts`, view/layout components | https://vuetifyjs.com/ |
| Material Design Icons | Icon font used by the UI | `src/main.ts`, navigation metadata | https://pictogrammers.com/library/mdi/ |
| vue-i18n | Localization and dynamic locale loading | `src/utils/i18n.ts`, `src/locales/` | https://vue-i18n.intlify.dev/ |

## API and contract tooling

| Tool | Why it is here | Where it shows up | Official docs |
| --- | --- | --- | --- |
| OpenAPI | Backend contract source | `openapi.yaml` | https://spec.openapis.org/oas/latest.html |
| openapi-typescript-codegen | Generates the typed client in `api/` | `npm run genapi`, `api/` | https://github.com/ferdikoomen/openapi-typescript-codegen |
| Axios | HTTP client used by generated code and runtime API access | `api/`, `src/utils/api.ts`, `src/utils/http.ts` | https://axios-http.com/docs/intro |
| Spectral | Lints the OpenAPI spec | `spectral.yaml`, `npm run lint:openapi` | https://meta.stoplight.io/docs/spectral |

## Streaming and content tooling

| Tool | Why it is here | Where it shows up | Official docs |
| --- | --- | --- | --- |
| Server-Sent Events (concept) | Live timelines for Agent and Workflow | `src/utils/sse.ts`, `src/api/sseEvents.ts`, streaming stores | https://developer.mozilla.org/docs/Web/API/Server-sent_events |
| marked | Markdown rendering | `src/components/shared/MarkdownRenderer.vue` | https://marked.js.org/ |
| marked-highlight | Bridges marked and code highlighting | `src/components/shared/MarkdownRenderer.vue` | https://github.com/markedjs/marked-highlight |
| highlight.js | Syntax highlighting for rendered Markdown | `src/components/shared/MarkdownRenderer.vue` | https://highlightjs.org/ |
| litegraph.js | Node-based visual graph editor | `src/litegraph/`, `GraphBuilderView.vue` | https://github.com/jagenjo/litegraph.js |
| uuid | Stable IDs for local history entries | agent/workflow stores | https://www.npmjs.com/package/uuid |

## Repo-specific support libraries

| Tool | Why it is here | Where it shows up | Official docs |
| --- | --- | --- | --- |
| `@guebbit/vue-toolkit` | Shared loading, REST helpers, and notifications | multiple stores, `AppLayout.vue` | https://www.npmjs.com/package/@guebbit/vue-toolkit |

## Quality and test tooling

| Tool | Why it is here | Where it shows up | Official docs |
| --- | --- | --- | --- |
| vue-tsc | Vue-aware type checking | `npm run type-check-only`, `npm run build` | https://github.com/vuejs/language-tools/tree/master/packages/tsc |
| ESLint | Linting rules and conventions | `eslint.config.ts`, `npm run lint` | https://eslint.org/docs/latest/ |
| eslint-plugin-vue | Vue-specific linting | `eslint.config.ts` | https://eslint.vuejs.org/ |
| typescript-eslint | TypeScript-aware linting | `eslint.config.ts` | https://typescript-eslint.io/ |
| eslint-plugin-unicorn | Consistency and code-quality rules | `eslint.config.ts` | https://github.com/sindresorhus/eslint-plugin-unicorn |
| Oxlint ESLint plugin | Extra lint rule coverage | `eslint.config.ts` | https://oxc.rs/docs/guide/usage/linter.html |
| Prettier | Formatting and formatting checks | `npm run prettier`, `npm run complete:check` | https://prettier.io/docs/ |
| Vitest | Unit testing | `vitest.config.ts`, `tests/unit/` | https://vitest.dev/guide/ |
| Cypress | End-to-end testing | `cypress.config.ts`, `cypress/` | https://docs.cypress.io/ |
| jsdom | Browser-like unit test environment | `vitest.config.ts` | https://github.com/jsdom/jsdom |

## Documentation tooling

| Tool | Why it is here | Where it shows up | Official docs |
| --- | --- | --- | --- |
| Mermaid | Diagrams in Markdown docs | `README.md`, `docs/*.md` | https://mermaid.js.org/ |
| VitePress | Installed documentation-site tooling for future expansion | `package.json` dependency | https://vitepress.dev/ |

## Commands you will actually use

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the frontend locally |
| `npm run build` | Production build + type-check pipeline |
| `npm run test:unit` | Run unit tests |
| `npm run lint` | Run ESLint |
| `npm run lint:openapi` | Lint `openapi.yaml` |
| `npm run complete:check` | Build + unit tests + lint + prettier check |
| `npm run genapi` | Regenerate `api/` from `openapi.yaml` |

## Important distinctions

### Generated vs handwritten API code

- **Generated:** `api/`
- **Generated runtime client entrypoint:** `src/utils/api.ts`
- **Handwritten streaming runtime helper:** `src/utils/sse.ts`
- **Handwritten streaming event types:** `src/api/sseEvents.ts`

### Human docs vs AI docs

- **Human docs:** `README.md` and `docs/*.md`
- **AI docs:** `.ai/*.md`

The `.ai/` directory exists to guide coding agents. It is intentionally separate from contributor-facing docs.
