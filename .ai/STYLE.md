# Style contract

Use these rules for all new frontend code.

## Official references

- SOLID overview: https://en.wikipedia.org/wiki/SOLID
- ESLint docs: https://eslint.org/docs/latest/
- Prettier docs: https://prettier.io/docs/en/
- JSDoc docs: https://jsdoc.app/

## Naming

- Interfaces: `IPascalCase`
- Enums: `EPascalCase`
- Types/classes: `PascalCase`
- Functions/variables: `camelCase`
- Constants: `UPPER_CASE`
- Booleans: `isX` / `hasX` / `shouldX` / `canX`
- Vue components: `PascalCase.vue`
- TS files: `camelCase.ts`
- Tests: `*.spec.ts`

```ts
interface IUserProfile {
    id: string;
    isActive: boolean;
}

const MAX_RETRIES = 3;
function fetchUserProfile(): Promise<IUserProfile> {
    // ...
    return Promise.resolve({ id: '1', isActive: true });
}
```

## JSDoc (required on every exported symbol)

- Functions: `/** … @param … @returns … */`
- Interfaces/types: one-line purpose
- Module files: `/** @module name — purpose */`
- Non-obvious internals: explain **why**, not **what**

```ts
/** @module api/client — typed HTTP wrappers for backend endpoints */

/** Returns the active profile by id.
 * @param profileId - The profile identifier.
 * @returns The resolved profile record.
 */
export function getProfile(profileId: string): Promise<IUserProfile> {
    // ...
    return Promise.resolve({ id: profileId, isActive: true });
}
```

## Comments

- Forbidden: commented-out code
- Forbidden: noise comments
- Forbidden: TODO/FIXME without issue number

## Formatting (Prettier enforced)

- 4-space indent
- single quotes
- semicolons
- 100-char width
- no trailing commas

## Functions

- ≤30 lines
- one responsibility
- ≤2 args (group extras into typed object)
- no side effects in getters

## Files

- ≤200 lines
- one concept per file
- barrel exports only in `types/index.ts`

## Error handling

- Never swallow silently — always log or notify.
- HTTP failures should use `ApiError`.
- User-facing errors should be routed through notification store.

```ts
try {
    await runTask(request);
} catch (error) {
    notificationStore.pushError(error instanceof Error ? error.message : 'Unknown error');
}
```
