# AI_README — Coding Standards & Guidelines

> **This document MUST be read and followed on ALL requests.**
> It defines the engineering principles, conventions, and quality gates for the Manna Frontend codebase.

---

## 1. SOLID Principles

Every contribution must respect the five SOLID principles:

| Principle                 | Guideline                                                                                                                                                                                                |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Single Responsibility** | Each file, class, function, and Vue component must do exactly **one thing**. Stores handle state, API modules handle HTTP, components handle presentation. Never mix concerns.                           |
| **Open/Closed**           | Design for extension, not modification. Use TypeScript interfaces (prefixed `I`) and composition over inheritance so new features plug in without rewriting existing code.                               |
| **Liskov Substitution**   | Any implementation of an interface must be safely swappable. Never narrow a return type or broaden a precondition in a subtype.                                                                          |
| **Interface Segregation** | Keep interfaces small and focused. Prefer many specific interfaces over one large "god" interface. Split request/response types per endpoint (see `src/api/types.ts`).                                   |
| **Dependency Inversion**  | Depend on abstractions, not concretions. Stores consume API functions via imports from `@/api/manna`, never by constructing HTTP calls directly. Pass dependencies as function arguments where possible. |

---

## 2. Uncle Bob — Clean Code Rules

### 2.1 Naming

- **Intention-revealing names** — a reader should never need to look at the body to understand what a function does.
- **No abbreviations** — ESLint's `unicorn/prevent-abbreviations` is enforced. Write `parameters` not `params`, `response` not `res`.
- **Boolean variables/props** start with `is`, `has`, `should`, `can` (e.g. `isStreaming`, `hasError`).
- **Constants** use `UPPER_CASE`. Variables and functions use `camelCase`. Types, interfaces, classes, and enums use `PascalCase`.
- **Interfaces** are prefixed with `I` (e.g. `IHealthResponse`). **Enums** are prefixed with `E`.

### 2.2 Functions

- **Small** — a function should fit on one screen (~20–30 lines). If it does not, extract a helper.
- **Do one thing** — if you can describe a function with "it does X _and_ Y", split it.
- **Few arguments** — aim for 0–2 arguments. When 3+ are needed, group them in a typed object (interface).
- **No side effects** — a function named `getX` must not mutate state. Side-effecting functions should be clearly named (`saveX`, `pushNotification`, `deleteConversation`).
- **Command/Query Separation** — functions either _return_ data or _change_ state, not both.

### 2.3 Comments

> "A comment is a failure to express yourself in code." — but when you _do_ comment, make it count.

#### Required comments

| Where                               | Format                                                                        | Example                                |
| ----------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------- |
| **Every exported function**         | JSDoc `/** */` block describing _what_ it does, each `@param`, and `@returns` | See §2.4 below                         |
| **Every exported interface / type** | Short `/** */` one-liner above the declaration                                | `/** Server health-check payload. */`  |
| **Non-obvious logic**               | Inline `//` explaining _why_, never _what_                                    | `// Retry header may be absent on 5xx` |
| **Section dividers** (API, stores)  | `/* ─── Section ─── */` banner                                                | Already used in `src/api/manna.ts`     |

#### Forbidden comments

- Commented-out code — delete it; Git remembers.
- Noise comments that restate the code (`// increment i` above `i++`).
- TODO/FIXME without an issue number.

### 2.4 JSDoc Template

```ts
/**
 * Sends a user message and streams the assistant reply into the active conversation.
 *
 * @param content    - The user's plain-text message.
 * @param allowWrite - When `true`, grants the backend write-access to the filesystem.
 * @returns Resolves when the full assistant reply has been received.
 */
async function sendMessage(content: string, allowWrite = false): Promise<void> { … }
```

### 2.5 Error Handling

- **Never swallow errors silently.** Catch blocks must at least log or notify.
- Use the project's `ApiError` class for HTTP failures.
- Use the `useNotificationStore` to surface errors to the user.

### 2.6 File Organisation

- **One concept per file.** A store file exports exactly one store. An API file groups related endpoints.
- **Barrel exports** only in `types/index.ts` — do not create barrel files elsewhere.
- Keep files under ~200 lines. Beyond that, split.

---

## 3. Project-Specific Conventions

### 3.1 Technology Stack

| Layer     | Tool                                                 |
| --------- | ---------------------------------------------------- |
| Framework | Vue 3 (Composition API + `<script setup lang="ts">`) |
| State     | Pinia (setup-style `defineStore`)                    |
| UI        | Vuetify 3 + Material Design Icons (`@mdi/font`)      |
| HTTP      | Native `fetch` via `src/api/manna.ts`                |
| Router    | Vue Router 4 (lazy-loaded views)                     |
| Testing   | Vitest (unit) · Cypress (E2E)                        |
| Linting   | ESLint (flat config) · Prettier · Spectral (OpenAPI) |
| Build     | Vite                                                 |

### 3.2 Directory Layout

```
src/
├── api/          # HTTP functions & response types (one file per domain)
├── components/   # Reusable Vue components (layout/ + shared/)
├── layouts/      # Page-level layout shells
├── router/       # Route definitions
├── stores/       # Pinia stores (one store per file)
├── types/        # Shared TypeScript types & re-exports
├── views/        # Route-level page components
├── config.ts     # Runtime configuration helpers
└── main.ts       # App bootstrap
```

### 3.3 Naming Conventions (enforced by ESLint)

| Artefact         | Convention       | Example           |
| ---------------- | ---------------- | ----------------- |
| Vue components   | `PascalCase.vue` | `HealthBadge.vue` |
| TypeScript files | `camelCase.ts`   | `notification.ts` |
| Test files       | `*.spec.ts`      | `chat.spec.ts`    |
| Interfaces       | `I` + PascalCase | `IConversation`   |
| Enums            | `E` + PascalCase | `EStatus`         |
| Constants        | `UPPER_CASE`     | `JSON_HEADERS`    |
| Functions        | `camelCase`      | `fetchHealth`     |

### 3.4 Formatting (Prettier)

- 4-space indentation
- Single quotes
- Semicolons
- 100-char print width
- No trailing commas

### 3.5 Git & Quality Gates

Before merging, all code must pass:

```bash
npm run complete:check   # build + unit tests + lint + prettier check
```

---

## 4. Quick Reference — Do / Don't

| ✅ Do                                        | ❌ Don't                           |
| -------------------------------------------- | ---------------------------------- |
| Write JSDoc on every exported symbol         | Leave functions undocumented       |
| Keep functions ≤ 30 lines                    | Write "god" functions              |
| Use typed interfaces for 3+ params           | Pass many positional args          |
| Name booleans `isX` / `hasX`                 | Name booleans `flag`, `check`      |
| Handle errors via `ApiError` + notifications | Use bare `try/catch` that swallows |
| One responsibility per file                  | Mix API calls, state, and UI logic |
| Run `npm run complete:check` before pushing  | Push without checking              |

---

_This file is versioned alongside the source code. Keep it up-to-date as conventions evolve._
