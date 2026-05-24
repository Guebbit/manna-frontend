/**
 * @module stores/agent
 *
 * Pinia store for autonomous agent task submission and history.
 *
 * Two submission modes are available:
 * - {@link useAgentStore.submitTask}       — Waits for the complete JSON result before
 *   resolving.  Use when you only care about the final answer.
 * - {@link useAgentStore.submitTaskStream} — Connects to the SSE endpoint and populates
 *   `streamEvents` reactively as the agent reasons and uses tools.  Use when you want to
 *   show live progress to the user.
 *
 * The `streamEvents` array grows in real time during an active stream and is reset to `[]`
 * at the start of each new submission.
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { useCoreStore, useStructureRestApi } from '@guebbit/vue-toolkit';
import type { RunRequestProfileEnum as ModelProfile, ToolCitation } from '@api';
import type { AgentStreamEvent } from '@/api/sseEvents';
import { coreApi } from '@/utils/api';
import { runTaskStream } from '@/utils/sse';
import { useNotificationsStore, TOAST_TYPE } from './notification';
import { handleApiError } from '@/utils/errorHandling';

/** A historical record of a submitted agent task and its outcome. */
export interface ITaskHistoryEntry {
    id: string;
    task: string;
    result: string;
    profile: ModelProfile | undefined;
    allowWrite: boolean;
    timestamp: string;
    /** Optional workspace root passed with the request. */
    workspaceRoot?: string;
    /** Tool citations returned by the backend (non-streaming mode only). */
    citations?: ToolCitation[];
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
    const streaming = ref(false);
    const streamEvents = ref<AgentStreamEvent[]>([]);

    /**
     * Submits an agent task to the backend and records the result in history.
     *
     * @param task          - The natural-language task description.
     * @param profile       - Optional model profile for inference routing.
     * @param allowWrite    - Whether the agent may modify files (default `false`).
     * @param workspaceRoot - Optional mounted workspace path forwarded to the backend.
     * @returns The created history entry, or `undefined` on failure.
     */
    const submitTask = (
        task: string,
        profile?: ModelProfile,
        allowWrite = false,
        workspaceRoot?: string
    ): Promise<ITaskHistoryEntry | undefined> => {
        return fetchAny(() =>
            coreApi
                .postRun({ runRequest: { task, profile, allowWrite, workspaceRoot } })
                .then(({ data }) => {
                    const result = data.data?.result ?? '';
                    const citations = data.data?.citations;
                    const entry: ITaskHistoryEntry = {
                        id: uuidv4(),
                        task,
                        result,
                        profile,
                        allowWrite,
                        timestamp: new Date().toISOString(),
                        workspaceRoot,
                        citations
                    };
                    taskHistory.value.unshift(entry);
                    return entry;
                })
        ).catch((error: unknown) => {
            handleApiError(error, 'Agent task failed');
            // eslint-disable-next-line unicorn/no-useless-undefined
            return undefined;
        });
    };

    /**
     * Submits an agent task via SSE streaming, populates `streamEvents` reactively,
     * and records the final result in history when the `done` event arrives.
     *
     * Note: citations are not available in streaming mode — the SSE `done` event does
     * not carry them. Use `submitTask` (non-streaming) if you need citations.
     *
     * @param task          - The natural-language task description.
     * @param profile       - Optional model profile for inference routing.
     * @param allowWrite    - Whether the agent may modify files (default `false`).
     * @param workspaceRoot - Optional mounted workspace path forwarded to the backend.
     * @returns The created history entry on success, or `undefined` on failure.
     */
    const submitTaskStream = async (
        task: string,
        profile?: ModelProfile,
        allowWrite = false,
        workspaceRoot?: string
    ): Promise<ITaskHistoryEntry | undefined> => {
        const notificationStore = useNotificationsStore();
        streaming.value = true;
        streamEvents.value = [];

        try {
            for await (const event of runTaskStream({ task, profile, allowWrite, workspaceRoot })) {
                streamEvents.value.push(event);

                if (event.type === 'done') {
                    const entry: ITaskHistoryEntry = {
                        id: uuidv4(),
                        task,
                        result: event.data.result,
                        profile,
                        allowWrite,
                        timestamp: new Date().toISOString(),
                        workspaceRoot
                    };
                    taskHistory.value.unshift(entry);
                    return entry;
                }

                if (event.type === 'error') {
                    notificationStore.addMessage(event.data.error, TOAST_TYPE.DANGER, 8000);
                    return undefined;
                }

                if (event.type === 'hard_stop') {
                    notificationStore.addMessage(
                        `Hard stop (${event.data.code}): ${event.data.reason}`,
                        TOAST_TYPE.DANGER,
                        8000
                    );
                    return undefined;
                }
            }
        } catch (error: unknown) {
            handleApiError(error, 'Agent stream failed');
            return undefined;
        } finally {
            streaming.value = false;
        }

        return undefined;
    };

    return {
        taskHistory,
        loading,
        streaming,
        streamEvents,
        submitTask,
        submitTaskStream
    };
});
