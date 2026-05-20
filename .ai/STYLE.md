# Style contract

SOLID (all five principles apply)

Naming

- Interfaces: `IPascalCase` | Enums: `EPascalCase` | Types/classes: `PascalCase`
- Functions/variables: `camelCase` | Constants: `UPPER_CASE`
- Booleans: `isX` / `hasX` / `shouldX` / `canX`
- Vue components: `PascalCase.vue` | TS files: `camelCase.ts` | Tests: `*.spec.ts`

JSDoc (required on every exported symbol)

- Functions: `/** … @param … @returns … */`
- Interfaces/types: `/** One-line purpose. */`
- Module files: `/** @module name — purpose */`
- Non-obvious internals: inline `//` explaining WHY, not WHAT

Comments

- Forbidden: commented-out code, noise comments, TODO/FIXME without issue number

Formatting (Prettier enforced)

- 4-space indent, single quotes, semicolons, 100-char width, no trailing commas

Functions

- ≤30 lines; do one thing; ≤2 args (group extras into typed object); no side effects in getters

Files

- ≤200 lines; one concept per file; barrel exports only in `types/index.ts`

Error handling

- Never swallow silently — always log or notify
- HTTP failures → `AxiosError` conventions (through generated client)
- User-facing errors → `useNotificationStore`
