import { defineStore } from 'pinia';
import { ref } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import type { ModelProfile } from '@/api/types';
import { runTask, ApiError } from '@/api/manna';
import { useNotificationStore } from './notification';

export interface ITaskHistoryEntry {
    id: string;
    task: string;
    result: string;
    profile: ModelProfile | undefined;
    allowWrite: boolean;
    timestamp: string;
}

export const useAgentStore = defineStore('agent', () => {
    const taskHistory = ref<ITaskHistoryEntry[]>([]);
    const loading = ref(false);

    async function submitTask(
        task: string,
        profile?: ModelProfile,
        allowWrite = false
    ): Promise<ITaskHistoryEntry | undefined> {
        const notificationStore = useNotificationStore();
        loading.value = true;
        try {
            const response = await runTask({ task, profile, allowWrite });
            const entry: ITaskHistoryEntry = {
                id: uuidv4(),
                task,
                result: response.result,
                profile,
                allowWrite,
                timestamp: new Date().toISOString()
            };
            taskHistory.value.unshift(entry);
            return entry;
        } catch (error: unknown) {
            if (error instanceof ApiError && error.retryAfterSeconds) {
                notificationStore.error(
                    `Rate limited. Retry in ${String(error.retryAfterSeconds)}s`
                );
            } else {
                notificationStore.error(
                    error instanceof Error ? error.message : 'Agent task failed'
                );
            }
            return undefined;
        } finally {
            loading.value = false;
        }
    }

    return {
        taskHistory,
        loading,
        submitTask
    };
});
