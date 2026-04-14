/**
 * @module stores/notification
 *
 * Re-exports the `useNotificationsStore` from `@guebbit/vue-toolkit` with a
 * locally typed `addMessage` signature so that all call-sites can use the
 * project-specific `EToastType` / `TOAST_TYPE` enum without type-cast noise.
 *
 * Import from this module (not from the toolkit directly) whenever you need
 * to show a notification toast in a store or component.
 */
import { useNotificationsStore as _useNotificationsStore } from '@guebbit/vue-toolkit';

/**
 * Toast severity levels used when adding notification messages.
 * These string values match the underlying `IToastType` enum from
 * `@guebbit/vue-toolkit` so they are compatible at runtime.
 */
export enum EToastType {
    PRIMARY = 'primary',
    SECONDARY = 'secondary',
    /** Maps to the string `'error'` to match the Vuetify colour name and the `IToastType.DANGER` value. */
    DANGER = 'error',
    WARNING = 'warning',
    SUCCESS = 'success',
}

/**
 * `TOAST_TYPE` is a UPPER_CASE constant alias for the `EToastType` enum.
 * Existing call-sites can use `TOAST_TYPE.DANGER` etc.
 */
export const TOAST_TYPE = EToastType;

/**
 * The notification store shape exposed by `useNotificationsStore`, with the
 * `addMessage` parameter typed to accept our local `EToastType` enum.
 */
export type INotificationsStore = Omit<
    ReturnType<typeof _useNotificationsStore>,
    'addMessage'
> & {
    /**
     * Adds a new toast notification.
     *
     * @param message - Human-readable notification text.
     * @param type    - Toast severity.
     * @param timeout - Auto-dismiss timeout in milliseconds.
     */
    addMessage(message: string, type?: EToastType, timeout?: number): void;
};

/**
 * Returns the shared Pinia notification store, typed to accept our local
 * `EToastType` enum so that all call-sites can use familiar names like
 * `TOAST_TYPE.DANGER` without type-cast noise.
 */
export function useNotificationsStore(): INotificationsStore {
    return _useNotificationsStore() as unknown as INotificationsStore;
}
