/**
 * @module utils/constants
 *
 * Shared constant values used across multiple views and components.
 * Centralised here so that adding a new profile or option only requires
 * a single edit instead of updating every consumer.
 */

/**
 * Dropdown options for the model profile selector.
 *
 * The `'auto'` sentinel maps to `undefined` in API calls, letting the
 * backend model router choose the best profile per step.
 */
export const PROFILE_OPTIONS = [
    { title: 'Auto (router decides)', value: 'auto' },
    { title: 'Fast', value: 'fast' },
    { title: 'Reasoning', value: 'reasoning' },
    { title: 'Code', value: 'code' },
    { title: 'Default', value: 'default' }
] as const;
