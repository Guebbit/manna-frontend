import { defineStore } from 'pinia';
import { ref } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { useCoreStore, useStructureRestApi } from '@guebbit/vue-toolkit';
import type {
    ModelProfile,
    IWorkflowResponse,
    WorkflowStreamEvent,
    WorkflowCarryMode
} from '@/api/types';
import { runWorkflow, runWorkflowStream, ApiError } from '@/api/manna';
import { useNotificationsStore, TOAST_TYPE } from './notification';

/** A historical record of a submitted workflow and its outcome. */
export interface IWorkflowHistoryEntry {
    id: string;
    steps: string[];
    carry: WorkflowCarryMode | undefined;
    profile: ModelProfile | undefined;
    allowWrite: boolean;
    maxStepsPerStep: number | undefined;
    allSucceeded: boolean;
    totalDurationMs: number;
    timestamp: string;
    response: IWorkflowResponse;
}

/**
 * Pinia store managing sequential workflow submissions and history.
 */
export const useWorkflowStore = defineStore('workflow', () => {
    const { getLoading, setLoading } = useCoreStore();
    const { loading, fetchAny } = useStructureRestApi({
        getLoading,
        setLoading
    });

    const workflowHistory = ref<IWorkflowHistoryEntry[]>([]);
    const streaming = ref(false);
    const streamEvents = ref<WorkflowStreamEvent[]>([]);

    /**
     * Submits a sequential workflow and waits for the full JSON result.
     *
     * @param steps           - Ordered list of step task strings.
     * @param carry           - How prior step outputs are carried into subsequent steps.
     * @param profile         - Optional model profile for inference routing.
     * @param allowWrite      - Whether agents may modify files (default `false`).
     * @param maxStepsPerStep - Optional per-step agent-loop iteration cap.
     * @returns The created history entry, or `undefined` on failure.
     */
    const submitWorkflow = (
        steps: string[],
        carry?: WorkflowCarryMode,
        profile?: ModelProfile,
        allowWrite = false,
        maxStepsPerStep?: number
    ): Promise<IWorkflowHistoryEntry | undefined> => {
        const notificationStore = useNotificationsStore();
        return fetchAny(
            () =>
                runWorkflow({ steps, carry, profile, allowWrite, maxStepsPerStep }).then(
                    (response) => {
                        const entry: IWorkflowHistoryEntry = {
                            id: uuidv4(),
                            steps,
                            carry,
                            profile,
                            allowWrite,
                            maxStepsPerStep,
                            allSucceeded: response.allSucceeded,
                            totalDurationMs: response.totalDurationMs,
                            timestamp: new Date().toISOString(),
                            response
                        };
                        workflowHistory.value.unshift(entry);
                        return entry;
                    }
                )
        ).catch((error: unknown) => {
            if (error instanceof ApiError && error.retryAfterSeconds) {
                notificationStore.addMessage(
                    `Rate limited. Retry in ${String(error.retryAfterSeconds)}s`,
                    TOAST_TYPE.DANGER,
                    8000
                );
            } else {
                notificationStore.addMessage(
                    error instanceof Error ? error.message : 'Workflow task failed',
                    TOAST_TYPE.DANGER,
                    8000
                );
            }
            // eslint-disable-next-line unicorn/no-useless-undefined
            return undefined;
        });
    };

    /**
     * Submits a sequential workflow via SSE streaming, populates `streamEvents` reactively.
     *
     * @param steps           - Ordered list of step task strings.
     * @param carry           - How prior step outputs are carried into subsequent steps.
     * @param profile         - Optional model profile for inference routing.
     * @param allowWrite      - Whether agents may modify files (default `false`).
     * @param maxStepsPerStep - Optional per-step agent-loop iteration cap.
     * @returns The created history entry on success, or `undefined` on failure.
     */
    const submitWorkflowStream = async (
        steps: string[],
        carry?: WorkflowCarryMode,
        profile?: ModelProfile,
        allowWrite = false,
        maxStepsPerStep?: number
    ): Promise<IWorkflowHistoryEntry | undefined> => {
        const notificationStore = useNotificationsStore();
        streaming.value = true;
        streamEvents.value = [];

        try {
            for await (const event of runWorkflowStream({
                steps,
                carry,
                profile,
                allowWrite,
                maxStepsPerStep
            })) {
                streamEvents.value.push(event);

                if (event.type === 'done') {
                    const entry: IWorkflowHistoryEntry = {
                        id: uuidv4(),
                        steps,
                        carry,
                        profile,
                        allowWrite,
                        maxStepsPerStep,
                        allSucceeded: event.data.allSucceeded,
                        totalDurationMs: event.data.totalDurationMs,
                        timestamp: new Date().toISOString(),
                        response: {
                            steps: event.data.steps,
                            allSucceeded: event.data.allSucceeded,
                            totalDurationMs: event.data.totalDurationMs
                        }
                    };
                    workflowHistory.value.unshift(entry);
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
                    error instanceof Error ? error.message : 'Workflow stream failed',
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
        workflowHistory,
        loading,
        streaming,
        streamEvents,
        submitWorkflow,
        submitWorkflowStream
    };
});
