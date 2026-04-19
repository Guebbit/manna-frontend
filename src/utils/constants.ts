/**
 * @module utils/constants
 *
 * Shared constant values used across multiple views and components.
 */
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

/** Raw profile options — `title` is an i18n key, resolved at render time via `useProfileOptions()`. */
export const PROFILE_OPTIONS = [
    { title: 'profiles.auto', value: 'auto' },
    { title: 'profiles.fast', value: 'fast' },
    { title: 'profiles.reasoning', value: 'reasoning' },
    { title: 'profiles.code', value: 'code' },
    { title: 'profiles.default', value: 'default' }
] as const;

/** Returns translated profile options for use in v-select. Must be called inside a component setup. */
export function useProfileOptions() {
    const { t } = useI18n();
    return computed(() => PROFILE_OPTIONS.map((opt) => ({ ...opt, title: t(opt.title) })));
}
