/**
 * @module config
 *
 * Runtime configuration helpers for the Manna frontend.
 *
 * The backend URL is resolved in priority order:
 * 1. `localStorage` key `'manna-base-url'` — set by the Settings view.
 * 2. `VITE_MANNA_URL` environment variable — set at build time.
 * 3. Hardcoded fallback `http://localhost:3001`.
 *
 * Settings are persisted in `localStorage` so they survive page reloads.
 * No other state is persisted here — all runtime state lives in Pinia stores.
 */

/**
 * Retrieves the Manna backend base URL from localStorage, environment, or fallback default.
 *
 * @returns The configured backend URL string.
 */
export function getMannaBaseUrl(): string {
    return (
        localStorage.getItem('manna-base-url') ??
        import.meta.env.VITE_MANNA_URL ??
        'http://localhost:3001'
    );
}

/**
 * Persists a custom Manna backend base URL to localStorage.
 *
 * @param url - The new backend URL to store.
 */
export function setMannaBaseUrl(url: string): void {
    localStorage.setItem('manna-base-url', url);
}

/**
 * Retrieves the configured workspace root path (the mounted project directory).
 * This is the path inside the container where the user's code is mounted.
 * Example: `/workspace/my-project`
 *
 * @returns The configured workspace root, or empty string if not set.
 */
export function getWorkspaceRoot(): string {
    return localStorage.getItem('manna-workspace-root') ?? '';
}

/**
 * Persists the workspace root path to localStorage.
 *
 * @param path - Absolute path to the mounted workspace directory.
 */
export function setWorkspaceRoot(path: string): void {
    localStorage.setItem('manna-workspace-root', path);
}

/**
 * The Manna backend version this frontend is synced against.
 * Update this constant whenever the frontend is updated to match a new backend version.
 */
export const MANNA_BACKEND_VERSION = '0.15.0-alpha';
