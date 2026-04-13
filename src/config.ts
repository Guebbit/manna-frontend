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
 * The Manna backend version this frontend is synced against.
 * Update this constant whenever the frontend is updated to match a new backend version.
 */
export const MANNA_BACKEND_VERSION = '0.15.0-alpha';
