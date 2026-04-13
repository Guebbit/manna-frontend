import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { IHealthResponse, IOpenAiModelObject } from '@/api/types';
import { healthCheck, listModels } from '@/api/manna';

export const useSystemStore = defineStore('system', () => {
    const health = ref<IHealthResponse | undefined>(undefined);
    const healthLoading = ref(false);
    const healthError = ref<string | undefined>(undefined);

    const models = ref<IOpenAiModelObject[]>([]);
    const modelsLoading = ref(false);

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
