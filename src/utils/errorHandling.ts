/**
 * @module utils/errorHandling
 *
 * Shared error-handling helpers for Pinia stores.
 *
 * Every store that calls the Manna API needs identical logic to detect
 * rate-limit errors, extract human-readable messages, and display toast
 * notifications.  This module centralises that pattern so stores can
 * delegate to a single function instead of duplicating the catch block.
 */

import { ApiError } from '@/api/manna';
import { useNotificationsStore, TOAST_TYPE } from '@/stores/notification';

/**
 * Handles an API error by showing an appropriate toast notification.
 *
 * - If the error is an {@link ApiError} with a `retryAfterSeconds` field,
 *   a rate-limit message is shown.
 * - Otherwise, the error's message (or a provided fallback) is displayed.
 *
 * @param error       - The caught error value.
 * @param fallback    - Fallback message when the error is not an `Error` instance.
 * @param timeout     - Toast auto-dismiss timeout in milliseconds (default `8000`).
 */
export function handleApiError(
    error: unknown,
    fallback = 'Operation failed',
    timeout = 8000
): void {
    const notificationStore = useNotificationsStore();
    if (error instanceof ApiError && error.retryAfterSeconds) {
        notificationStore.addMessage(
            `Rate limited. Retry in ${String(error.retryAfterSeconds)}s`,
            TOAST_TYPE.DANGER,
            timeout
        );
    } else {
        notificationStore.addMessage(
            error instanceof Error ? error.message : fallback,
            TOAST_TYPE.DANGER,
            timeout
        );
    }
}
