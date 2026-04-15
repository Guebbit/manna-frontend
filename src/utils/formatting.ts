/**
 * @module utils/formatting
 *
 * Shared formatting helpers used across multiple views.
 * Centralised here to avoid duplicating identical utility functions
 * in every view component.
 */

/**
 * Formats an ISO 8601 timestamp as a locale-aware time string.
 *
 * @param iso - ISO 8601 date/time string.
 * @returns Locale-formatted time (e.g. "2:34:56 PM").
 */
export function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString();
}

/**
 * Formats a millisecond duration as a human-readable string.
 *
 * @param ms - Duration in milliseconds.
 * @returns `"<ms>ms"` when under one second, otherwise `"<s>s"` with one decimal.
 */
export function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Formats a byte count as a human-readable file size (B / KB / MB).
 *
 * @param bytes - Number of bytes.
 * @returns Formatted string with appropriate unit.
 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${String(bytes)} B`;
    if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

/**
 * Formats a byte count as a human-readable model/data size (MB / GB).
 * Returns `'—'` for `null` values.
 *
 * @param bytes - Number of bytes, or `null`.
 * @returns Formatted string with appropriate unit.
 */
export function formatModelSize(bytes: number | null): string {
    if (bytes === null) return '—';
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(1)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(0)} MB`;
}
