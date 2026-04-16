import { defineStore } from 'pinia';
import { ref } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { useCoreStore, useStructureRestApi } from '@guebbit/vue-toolkit';
import type {
    WorkflowRequestCarryEnum as WorkflowCarryMode,
    WorkflowRequestProfileEnum as ModelProfile,
    WorkflowResponse,
    StepDefinition
} from '../../api/models';
import type { WorkflowStreamEvent } from '@/api/sseEvents';
import { runWorkflow, runWorkflowStream } from '@/api/manna';
import { useNotificationsStore, TOAST_TYPE } from './notification';
import { handleApiError } from '@/utils/errorHandling';

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
    response: WorkflowResponse;
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
        const stepDefinitions: StepDefinition[] = steps.map((task) => ({ task }));

        return fetchAny(() =>
            runWorkflow({
                steps: stepDefinitions,
                carry,
                profile,
                allowWrite,
                maxStepsPerStep
            }).then((response) => {
                const normalizedResponse: WorkflowResponse = {
                    steps: response.steps ?? [],
                    allSucceeded: response.allSucceeded ?? false,
                    totalDurationMs: response.totalDurationMs ?? 0,
                    meta: response.meta
                };
                const entry: IWorkflowHistoryEntry = {
                    id: uuidv4(),
                    steps,
                    carry,
                    profile,
                    allowWrite,
                    maxStepsPerStep,
                    allSucceeded: normalizedResponse.allSucceeded ?? false,
                    totalDurationMs: normalizedResponse.totalDurationMs ?? 0,
                    timestamp: new Date().toISOString(),
                    response: normalizedResponse
                };
                workflowHistory.value.unshift(entry);
                return entry;
            })
        ).catch((error: unknown) => {
            handleApiError(error, 'Workflow task failed');
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
        const stepDefinitions: StepDefinition[] = steps.map((task) => ({ task }));

        streaming.value = true;
        streamEvents.value = [];

        try {
            for await (const event of runWorkflowStream({
                steps: stepDefinitions,
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
                        allSucceeded: event.data.allSucceeded ?? false,
                        totalDurationMs: event.data.totalDurationMs ?? 0,
                        timestamp: new Date().toISOString(),
                        response: {
                            steps: event.data.steps ?? [],
                            allSucceeded: event.data.allSucceeded ?? false,
                            totalDurationMs: event.data.totalDurationMs ?? 0,
                            meta: event.data.meta
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
            handleApiError(error, 'Workflow stream failed');
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
