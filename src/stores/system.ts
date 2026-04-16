/**
 * @module stores/system
 *
 * Pinia store for backend health status, model metadata, routing profiles, and API reference.
 */
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useCoreStore, useStructureRestApi } from '@guebbit/vue-toolkit';
import type {
    GetHelp200Response,
    GetInfoModels200ResponseModelsInner,
    GetInfoModes200ResponseModesInner,
    HealthResponse
} from '../../api/models';
import { healthCheck, fetchInfoModes, fetchInfoModels, fetchHelp } from '@/api/manna';

/**
 * Pinia store managing backend health status, available model list,
 * routing modes, Ollama model metadata, and API help reference.
 */
export const useSystemStore = defineStore('system', () => {
    const { getLoading, setLoading } = useCoreStore();
    const { fetchAny } = useStructureRestApi({
        getLoading,
        setLoading,
        loadingKey: 'system'
    });

    const health = ref<HealthResponse | undefined>(undefined);
    const healthLoading = computed(() => getLoading('system-health'));
    const healthError = ref<string | undefined>(undefined);

    const models = ref<GetInfoModels200ResponseModelsInner[]>([]);
    const modelsLoading = computed(() => getLoading('system-models'));

    const modes = ref<GetInfoModes200ResponseModesInner[]>([]);
    const modesLoading = computed(() => getLoading('system-modes'));

    const infoModels = ref<GetInfoModels200ResponseModelsInner[]>([]);
    const infoModelsLoading = computed(() => getLoading('system-info-models'));
    const ollamaBaseUrl = ref('');

    const help = ref<GetHelp200Response | undefined>(undefined);
    const helpLoading = computed(() => getLoading('system-help'));

    /**
     * Fetches the backend health status and updates reactive state.
     * Sets `healthError` on failure.
     */
    const fetchHealth = () => {
        healthError.value = undefined;
        return fetchAny(
            () =>
                healthCheck().then((data) => {
                    health.value = data;
                }),
            {
                lastUpdateKey: 'health',
                loadingKey: '-health'
            }
        ).catch((error: unknown) => {
            healthError.value = error instanceof Error ? error.message : 'Health check failed';
            health.value = undefined;
        });
    };

    /**
     * Fetches available models from `/info/models` for dashboard display.
     * Silently resets to an empty array on failure.
     */
    const fetchModels = () =>
        fetchAny(
            () =>
                fetchInfoModels().then((response) => {
                    models.value = response.models ?? [];
                }),
            {
                lastUpdateKey: 'models',
                loadingKey: '-models'
            }
        ).catch(() => {
            models.value = [];
        });

    /**
     * Fetches the agent routing profiles from `/info/modes`.
     * Silently resets to an empty array on failure.
     */
    const fetchModes = () =>
        fetchAny(
            () =>
                fetchInfoModes().then((response) => {
                    modes.value = response.modes ?? [];
                }),
            {
                lastUpdateKey: 'modes',
                loadingKey: '-modes'
            }
        ).catch(() => {
            modes.value = [];
        });

    /**
     * Fetches the Ollama model list from `/info/models`.
     * Silently resets to an empty array on failure.
     */
    const fetchInfoModelsAction = () =>
        fetchAny(
            () =>
                fetchInfoModels().then((response) => {
                    infoModels.value = response.models ?? [];
                    ollamaBaseUrl.value = response.ollamaBaseUrl ?? '';
                }),
            {
                lastUpdateKey: 'info-models',
                loadingKey: '-info-models'
            }
        ).catch(() => {
            infoModels.value = [];
            ollamaBaseUrl.value = '';
        });

    /**
     * Fetches the API help reference from `/help`.
     * Silently ignores failures.
     */
    const fetchHelpAction = () =>
        fetchAny(
            () =>
                fetchHelp().then((response) => {
                    help.value = response;
                }),
            {
                lastUpdateKey: 'help',
                loadingKey: '-help'
            }
        ).catch(() => {
            help.value = undefined;
        });

    return {
        health,
        healthLoading,
        healthError,
        models,
        modelsLoading,
        modes,
        modesLoading,
        infoModels,
        infoModelsLoading,
        ollamaBaseUrl,
        help,
        helpLoading,
        fetchHealth,
        fetchModels,
        fetchModes,
        fetchInfoModels: fetchInfoModelsAction,
        fetchHelp: fetchHelpAction
    };
});
