/**
 * Re-export the notifications store from @guebbit/vue-toolkit.
 */
export { useNotificationsStore } from '@guebbit/vue-toolkit';

/**
 * Extract the IToastType parameter type from useNotificationsStore.addMessage.
 * This avoids depending on the non-exported IToastType enum directly.
 */
type NotificationsStoreReturn = ReturnType<
    ReturnType<typeof import('@guebbit/vue-toolkit').useNotificationsStore>['addMessage']
> extends void
    ? Parameters<ReturnType<typeof import('@guebbit/vue-toolkit').useNotificationsStore>['addMessage']>
    : never;

type ToastTypeParameter = NonNullable<NotificationsStoreReturn[1]>;

/**
 * Toast type constants matching @guebbit/vue-toolkit IToastType enum values.
 * Used because the package does not export the IToastType enum directly.
 */
export const TOAST_TYPE = {
    PRIMARY: 'primary' as ToastTypeParameter,
    SECONDARY: 'secondary' as ToastTypeParameter,
    DANGER: 'error' as ToastTypeParameter,
    WARNING: 'warning' as ToastTypeParameter,
    SUCCESS: 'success' as ToastTypeParameter
} as const;
