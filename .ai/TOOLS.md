# Tools inventory

This is the canonical map of tools used (or intentionally installed) in this repo.

## Runtime + framework

| Tool       | Purpose                  | Where used                | Official docs                        | Conventions                        |
| ---------- | ------------------------ | ------------------------- | ------------------------------------ | ---------------------------------- |
| Vue 3      | UI framework             | `src/`                    | https://vuejs.org/                   | [STYLE.md](./STYLE.md)             |
| TypeScript | Typing and strict checks | `src/`, `tests/`          | https://www.typescriptlang.org/docs/ | [STYLE.md](./STYLE.md)             |
| Vite       | Dev server and bundling  | `vite.config.ts`, scripts | https://vite.dev/guide/              | [README.md](../README.md#-scripts) |

## UI + state + routing + i18n

| Tool       | Purpose                | Where used                          | Official docs                 | Conventions                    |
| ---------- | ---------------------- | ----------------------------------- | ----------------------------- | ------------------------------ |
| Vuetify    | Material UI components | `src/main.ts`, views/components     | https://vuetifyjs.com/        | [STYLE.md](./STYLE.md)         |
| Pinia      | Store layer            | `src/stores/`                       | https://pinia.vuejs.org/      | [STRUCTURE.md](./STRUCTURE.md) |
| Vue Router | Route definitions      | `src/router/index.ts`               | https://router.vuejs.org/     | [STRUCTURE.md](./STRUCTURE.md) |
| vue-i18n   | Localization           | `src/utils/i18n.ts`, `src/locales/` | https://vue-i18n.intlify.dev/ | [STRUCTURE.md](./STRUCTURE.md) |

## Data/API

| Tool                       | Purpose                           | Where used                                 | Official docs                                                       | Conventions        |
| -------------------------- | --------------------------------- | ------------------------------------------ | ------------------------------------------------------------------- | ------------------ |
| fetch API                  | HTTP in handwritten client        | `src/api/manna.ts`                         | https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API          | [API.md](./API.md) |
| SSE / Streams API          | Streaming timeline events         | `src/api/manna.ts`, `src/api/sseEvents.ts` | https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events | [API.md](./API.md) |
| openapi-typescript-codegen | Generate typed API client/models  | `npm run genapi`, `api/`                   | https://github.com/ferdikoomen/openapi-typescript-codegen           | [API.md](./API.md) |
| axios                      | Transport for generated client    | `api/` generated output                    | https://axios-http.com/                                             | [API.md](./API.md) |
| openapi-zod-client         | Optional OpenAPI→Zod generation   | `package.json`                             | https://github.com/astahmer/openapi-zod-client                      | [API.md](./API.md) |
| zod                        | Runtime schema validation toolkit | `package.json`                             | https://zod.dev/                                                    | [API.md](./API.md) |

## Content + graph features

| Tool             | Purpose                         | Where used                                   | Official docs                                | Conventions                    |
| ---------------- | ------------------------------- | -------------------------------------------- | -------------------------------------------- | ------------------------------ |
| marked           | Markdown to HTML                | `src/components/shared/MarkdownRenderer.vue` | https://marked.js.org/                       | [STRUCTURE.md](./STRUCTURE.md) |
| marked-highlight | Syntax-highlighting integration | `src/components/shared/MarkdownRenderer.vue` | https://github.com/markedjs/marked-highlight | [STRUCTURE.md](./STRUCTURE.md) |
| highlight.js     | Code block highlighting         | `src/components/shared/MarkdownRenderer.vue` | https://highlightjs.org/                     | [STRUCTURE.md](./STRUCTURE.md) |
| litegraph.js     | Graph editor runtime            | `src/litegraph/`, `GraphBuilderView.vue`     | https://github.com/jagenjo/litegraph.js      | [STRUCTURE.md](./STRUCTURE.md) |

## Testing + quality

| Tool           | Purpose                        | Where used                        | Official docs                           | Conventions                |
| -------------- | ------------------------------ | --------------------------------- | --------------------------------------- | -------------------------- |
| Vitest         | Unit tests                     | `tests/unit/`, `vitest.config.ts` | https://vitest.dev/guide/               | [TESTING.md](./TESTING.md) |
| Cypress        | E2E tests                      | `tests/e2e/`, `cypress.config.ts` | https://docs.cypress.io/                | [TESTING.md](./TESTING.md) |
| Vue Test Utils | Vue component test helpers     | unit tests                        | https://test-utils.vuejs.org/           | [TESTING.md](./TESTING.md) |
| jsdom          | Browser-like DOM in unit tests | test runtime                      | https://github.com/jsdom/jsdom          | [TESTING.md](./TESTING.md) |
| ESLint         | Static linting                 | `eslint.config.ts`                | https://eslint.org/docs/latest/         | [STYLE.md](./STYLE.md)     |
| Prettier       | Formatting                     | `.prettierrc`                     | https://prettier.io/docs/en/            | [STYLE.md](./STYLE.md)     |
| Spectral       | OpenAPI linting                | `spectral.yaml`, `lint:openapi`   | https://meta.stoplight.io/docs/spectral | [API.md](./API.md)         |

## Local API exploration tools

| Tool     | Purpose              | Where used                                | Official docs                                      |
| -------- | -------------------- | ----------------------------------------- | -------------------------------------------------- |
| Bruno    | API collections      | `.dev/Ecommerce Demo API - Bruno.yml`     | https://www.usebruno.com/docs/get-started/overview |
| Insomnia | API collections      | `.dev/Ecommerce Demo API - Insomnia.json` | https://docs.insomnia.rest/                        |
| Mockoon  | Mock API definitions | `.dev/Ecommerce Demo API - Mockoon.json`  | https://mockoon.com/docs/latest/                   |
