import { defineStore } from 'pinia';
import { ref } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { useCoreStore, useStructureRestApi } from '@guebbit/vue-toolkit';
import type { ModelProfile } from '@/api/types';
import { runTask, ApiError } from '@/api/manna';
import { useNotificationsStore, TOAST_TYPE } from './notification';

/** A historical record of a submitted agent task and its outcome. */
export interface ITaskHistoryEntry {
    id: string;
    task: string;
    result: string;
    profile: ModelProfile | undefined;
    allowWrite: boolean;
    timestamp: string;
}

/**
 * Pinia store managing autonomous agent task submissions and history.
 */
export const useAgentStore = defineStore('agent', () => {
    const { getLoading, setLoading } = useCoreStore();
    const { loading, fetchAny } = useStructureRestApi({
        getLoading,
        setLoading
    });

    const taskHistory = ref<ITaskHistoryEntry[]>([]);

    /**
     * Submits an agent task to the backend and records the result in history.
     *
     * @param task       - The natural-language task description.
     * @param profile    - Optional model profile for inference routing.
     * @param allowWrite - Whether the agent may modify files (default `false`).
     * @returns The created history entry, or `undefined` on failure.
     */
    const submitTask = (
        task: string,
        profile?: ModelProfile,
        allowWrite = false
    ): Promise<ITaskHistoryEntry | undefined> => {
        const notificationStore = useNotificationsStore();
        return fetchAny(
            () =>
                runTask({ task, profile, allowWrite }).then((response) => {
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
                })
        ).catch((error: unknown) => {
            if (error instanceof ApiError && error.retryAfterSeconds) {
                notificationStore.addMessage(
                    `Rate limited. Retry in ${String(error.retryAfterSeconds)}s`,
                    TOAST_TYPE.DANGER,
                    8000
                );
            } else {
                notificationStore.addMessage(
                    error instanceof Error ? error.message : 'Agent task failed',
                    TOAST_TYPE.DANGER,
                    8000
                );
            }
            // eslint-disable-next-line unicorn/no-useless-undefined
            return undefined;
        });
    };

    return {
        taskHistory,
        loading,
        submitTask
    };
});
