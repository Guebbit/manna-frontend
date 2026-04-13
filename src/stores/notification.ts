/**
 * Re-export the notifications store from @guebbit/vue-toolkit.
 */
export { useNotificationsStore } from '@guebbit/vue-toolkit';

/**
 * Extract the IToastType parameter type from useNotificationsStore.addMessage.
 * This avoids depending on the non-exported IToastType enum directly.
 */
type AddMessageParameters = Parameters<
    ReturnType<typeof import('@guebbit/vue-toolkit').useNotificationsStore>['addMessage']
>;
type ToastTypeParameter = NonNullable<AddMessageParameters[1]>;

/**
 * Toast type constants matching @guebbit/vue-toolkit IToastType enum values.
 * Naming follows the upstream IToastType enum member names for consistency.
 */
export const TOAST_TYPE = {
    PRIMARY: 'primary' as ToastTypeParameter,
    SECONDARY: 'secondary' as ToastTypeParameter,
    DANGER: 'error' as ToastTypeParameter,
    WARNING: 'warning' as ToastTypeParameter,
    SUCCESS: 'success' as ToastTypeParameter
} as const;
