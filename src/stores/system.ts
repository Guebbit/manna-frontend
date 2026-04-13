import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { IHealthResponse, IOpenAiModelObject } from '@/api/types';
import { healthCheck, listModels } from '@/api/manna';

/**
 * Pinia store managing backend health status and available model list.
 */
export const useSystemStore = defineStore('system', () => {
    const health = ref<IHealthResponse | undefined>(undefined);
    const healthLoading = ref(false);
    const healthError = ref<string | undefined>(undefined);

    const models = ref<IOpenAiModelObject[]>([]);
    const modelsLoading = ref(false);

    /**
     * Fetches the backend health status and updates reactive state.
     * Sets `healthError` on failure.
     */
    async function fetchHealth(): Promise<void> {
        healthLoading.value = true;
        healthError.value = undefined;
        try {
            health.value = await healthCheck();
        } catch (error: unknown) {
            healthError.value = error instanceof Error ? error.message : 'Health check failed';
            health.value = undefined;
        } finally {
            healthLoading.value = false;
        }
    }

    /**
     * Fetches the list of available models from the backend.
     * Silently resets to an empty array on failure.
     */
    async function fetchModels(): Promise<void> {
        modelsLoading.value = true;
        try {
            const response = await listModels();
            models.value = response.data;
        } catch {
            models.value = [];
        } finally {
            modelsLoading.value = false;
        }
    }

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
