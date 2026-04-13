import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useCoreStore, useStructureRestApi } from '@guebbit/vue-toolkit';
import type { IHealthResponse, IOpenAiModelObject } from '@/api/types';
import { healthCheck, listModels } from '@/api/manna';

/**
 * Pinia store managing backend health status and available model list.
 */
export const useSystemStore = defineStore('system', () => {
    const { getLoading, setLoading } = useCoreStore();
    const { fetchAny } = useStructureRestApi({
        getLoading,
        setLoading,
        loadingKey: 'system'
    });

    const health = ref<IHealthResponse | undefined>(undefined);
    const healthLoading = computed(() => getLoading('system-health'));
    const healthError = ref<string | undefined>(undefined);

    const models = ref<IOpenAiModelObject[]>([]);
    const modelsLoading = computed(() => getLoading('system-models'));

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
     * Fetches the list of available models from the backend.
     * Silently resets to an empty array on failure.
     */
    const fetchModels = () =>
        fetchAny(
            () =>
                listModels().then((response) => {
                    models.value = response.data;
                }),
            {
                lastUpdateKey: 'models',
                loadingKey: '-models'
            }
        ).catch(() => {
            models.value = [];
        });

    return {
        health,
        healthLoading,
        healthError,
        models,
        modelsLoading,
        fetchHealth,
        fetchModels
    };
});
