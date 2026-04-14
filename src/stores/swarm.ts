/**
 * @module stores/swarm
 *
 * Pinia store for multi-agent swarm task submission and history.
 *
 * The swarm pipeline follows three phases:
 * 1. **Decompose** — an orchestrator LLM breaks the task into independent subtasks.
 * 2. **Delegate**  — each subtask runs in its own agent loop (potentially in parallel).
 * 3. **Synthesise** — the orchestrator merges all answers into one coherent result.
 *
 * Two submission modes are available:
 * - {@link useSwarmStore.submitSwarm}       — Waits for the full JSON result including
 *   per-subtask breakdowns (`subtaskResults`).
 * - {@link useSwarmStore.submitSwarmStream} — Streams lifecycle events in real time.
 *   Note: streaming mode does not deliver individual subtask payloads — `subtaskResults`
 *   will be empty.  Use `submitSwarm()` when you need the per-subtask details.
 */
import { defineStore } from 'pinia';

/** A historical record of a submitted swarm task and its outcome. */
export interface ISwarmHistoryEntry {
    id: string;
    task: string;
    result: string;
    profile: ModelProfile | undefined;
    allowWrite: boolean;
    maxSubtasks: number | undefined;
    subtaskCount: number;
    totalDurationMs: number;
    timestamp: string;
    response: ISwarmResponse;
}

/**
 * Pinia store managing multi-agent swarm task submissions and history.
 */
export const useSwarmStore = defineStore('swarm', () => {
    const { getLoading, setLoading } = useCoreStore();
    const { loading, fetchAny } = useStructureRestApi({
        getLoading,
        setLoading
    });

    const swarmHistory = ref<ISwarmHistoryEntry[]>([]);
    const streaming = ref(false);
    const streamEvents = ref<SwarmStreamEvent[]>([]);

    /**
     * Submits a swarm task and waits for the full JSON result.
     *
     * @param task        - The complex task to decompose and solve.
     * @param profile     - Optional model profile for inference routing.
     * @param allowWrite  - Whether agents may modify files (default `false`).
     * @param maxSubtasks - Optional maximum number of subtasks to create.
     * @returns The created history entry, or `undefined` on failure.
     */
    const submitSwarm = (
        task: string,
        profile?: ModelProfile,
        allowWrite = false,
        maxSubtasks?: number
    ): Promise<ISwarmHistoryEntry | undefined> => {
        const notificationStore = useNotificationsStore();
        return fetchAny(
            () =>
                runSwarm({ task, profile, allowWrite, maxSubtasks }).then((response) => {
                    const entry: ISwarmHistoryEntry = {
                        id: uuidv4(),
                        task,
                        result: response.result,
                        profile,
                        allowWrite,
                        maxSubtasks,
                        subtaskCount: response.subtaskResults.length,
                        totalDurationMs: response.totalDurationMs,
                        timestamp: new Date().toISOString(),
                        response
                    };
                    swarmHistory.value.unshift(entry);
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
                    error instanceof Error ? error.message : 'Swarm task failed',
                    TOAST_TYPE.DANGER,
                    8000
                );
            }
            // eslint-disable-next-line unicorn/no-useless-undefined
            return undefined;
        });
    };

    /**
     * Submits a swarm task via SSE streaming, populates `streamEvents` reactively.
     *
     * Note: in streaming mode the history entry's `subtaskResults` array will be empty
     * because individual subtask answers are not included in the SSE `done` event.
     * Use `submitSwarm()` instead when you need full per-subtask details.
     *
     * @param task        - The complex task to decompose and solve.
     * @param profile     - Optional model profile for inference routing.
     * @param allowWrite  - Whether agents may modify files (default `false`).
     * @param maxSubtasks - Optional maximum number of subtasks to create.
     * @returns The created history entry on success, or `undefined` on failure.
     */
    const submitSwarmStream = async (
        task: string,
        profile?: ModelProfile,
        allowWrite = false,
        maxSubtasks?: number
    ): Promise<ISwarmHistoryEntry | undefined> => {
        const notificationStore = useNotificationsStore();
        streaming.value = true;
        streamEvents.value = [];

        try {
            for await (const event of runSwarmStream({ task, profile, allowWrite, maxSubtasks })) {
                streamEvents.value.push(event);

                if (event.type === 'done') {
                    const entry: ISwarmHistoryEntry = {
                        id: uuidv4(),
                        task,
                        result: event.data.result,
                        profile,
                        allowWrite,
                        maxSubtasks,
                        subtaskCount: event.data.subtaskCount,
                        totalDurationMs: event.data.totalDurationMs,
                        timestamp: new Date().toISOString(),
                        // Streaming mode does not deliver full subtask payloads;
                        // subtaskResults is empty and decomposition.reasoning is unavailable.
                        response: {
                            result: event.data.result,
                            subtaskResults: [],
                            decomposition: { reasoning: '', subtaskCount: event.data.subtaskCount },
                            totalDurationMs: event.data.totalDurationMs
                        }
                    };
                    swarmHistory.value.unshift(entry);
                    return entry;
                }

                if (event.type === 'error') {
                    notificationStore.addMessage(event.data.error, TOAST_TYPE.DANGER, 8000);
                    return undefined;
                }
            }
        } catch (error: unknown) {
            if (error instanceof ApiError && error.retryAfterSeconds) {
                notificationStore.addMessage(
                    `Rate limited. Retry in ${String(error.retryAfterSeconds)}s`,
                    TOAST_TYPE.DANGER,
                    8000
                );
            } else {
                notificationStore.addMessage(
                    error instanceof Error ? error.message : 'Swarm stream failed',
                    TOAST_TYPE.DANGER,
                    8000
                );
            }
            return undefined;
        } finally {
            streaming.value = false;
        }

        return undefined;
    };

    return {
        swarmHistory,
        loading,
        streaming,
        streamEvents,
        submitSwarm,
        submitSwarmStream
    };
});
