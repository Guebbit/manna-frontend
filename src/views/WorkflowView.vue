<template>
    <div>
        <h1 class="text-h4 mb-6">Workflow Orchestration</h1>

        <v-row>
            <v-col cols="12" md="7">
                <v-card>
                    <v-card-title>Build a Workflow</v-card-title>
                    <v-card-text>
                        <!-- Step list -->
                        <div
                            v-for="(step, index) in steps"
                            :key="index"
                            class="d-flex align-center ga-2 mb-2"
                        >
                            <v-text-field
                                v-model="steps[index]"
                                :label="`Step ${index + 1}`"
                                variant="outlined"
                                density="compact"
                                hide-details
                                class="flex-grow-1"
                            />
                            <v-btn
                                icon
                                size="small"
                                variant="text"
                                color="error"
                                :disabled="steps.length <= 1"
                                @click="removeStep(index)"
                            >
                                <v-icon>mdi-minus-circle</v-icon>
                            </v-btn>
                        </div>

                        <v-btn
                            variant="tonal"
                            size="small"
                            class="mb-4"
                            :disabled="steps.length >= 50"
                            @click="addStep"
                        >
                            <v-icon start>mdi-plus</v-icon>
                            Add Step
                        </v-btn>

                        <v-row class="mt-2">
                            <v-col cols="12" sm="4">
                                <v-select
                                    v-model="selectedProfile"
                                    :items="profileOptions"
                                    label="Model profile"
                                    variant="outlined"
                                    density="compact"
                                />
                            </v-col>
                            <v-col cols="12" sm="4">
                                <v-select
                                    v-model="selectedCarry"
                                    :items="carryOptions"
                                    label="Context carry"
                                    variant="outlined"
                                    density="compact"
                                />
                            </v-col>
                            <v-col cols="12" sm="4">
                                <v-text-field
                                    v-model.number="maxStepsPerStep"
                                    label="Max steps/step"
                                    type="number"
                                    variant="outlined"
                                    density="compact"
                                    min="1"
                                    max="100"
                                    placeholder="Auto"
                                    clearable
                                />
                            </v-col>
                        </v-row>

                        <v-switch
                            v-model="allowWrite"
                            label="Allow write"
                            color="warning"
                            density="compact"
                            hide-details
                        />
                    </v-card-text>
                    <v-card-actions>
                        <v-btn
                            color="primary"
                            :loading="workflowStore.loading && !workflowStore.streaming"
                            :disabled="!hasValidSteps || workflowStore.streaming"
                            @click="submitJson"
                        >
                            <v-icon start>mdi-list-status</v-icon>
                            Run Workflow
                        </v-btn>
                        <v-btn
                            color="secondary"
                            :loading="workflowStore.streaming"
                            :disabled="
                                !hasValidSteps ||
                                (workflowStore.loading && !workflowStore.streaming)
                            "
                            @click="submitStream"
                        >
                            <v-icon start>mdi-antenna</v-icon>
                            Run Workflow (Stream)
                        </v-btn>
                    </v-card-actions>
                </v-card>

                <!-- Stream Event Feed -->
                <v-card v-if="workflowStore.streaming || streamFinished" class="mt-4">
                    <v-card-title class="d-flex align-center">
                        <v-icon start>mdi-antenna</v-icon>
                        Live Events
                        <v-progress-circular
                            v-if="workflowStore.streaming"
                            indeterminate
                            size="16"
                            class="ml-2"
                        />
                    </v-card-title>
                    <v-card-text>
                        <v-timeline density="compact" side="end">
                            <v-timeline-item
                                v-for="(event, index) in workflowStore.streamEvents"
                                :key="index"
                                :dot-color="eventColor(event.type)"
                                size="small"
                            >
                                <div class="d-flex align-center ga-2">
                                    <v-chip :color="eventColor(event.type)" size="x-small" label>
                                        {{ event.type }}
                                    </v-chip>
                                    <span class="text-body-2">{{ eventSummary(event) }}</span>
                                </div>
                            </v-timeline-item>
                        </v-timeline>
                    </v-card-text>
                </v-card>

                <!-- JSON Result -->
                <v-card v-if="latestResult" class="mt-4">
                    <v-card-title class="d-flex align-center">
                        Result
                        <v-spacer />
                        <v-chip
                            size="small"
                            :color="latestResult.allSucceeded ? 'success' : 'error'"
                            class="mr-2"
                        >
                            {{ latestResult.allSucceeded ? 'All succeeded' : 'Some failed' }}
                        </v-chip>
                        <v-chip size="small" color="secondary">
                            {{ formatDuration(latestResult.totalDurationMs) }}
                        </v-chip>
                    </v-card-title>
                    <v-card-text>
                        <v-expansion-panels>
                            <v-expansion-panel
                                v-for="step in latestResult.response.steps"
                                :key="step.index"
                            >
                                <v-expansion-panel-title>
                                    <div class="d-flex align-center ga-2">
                                        <v-icon
                                            :color="step.success ? 'success' : 'error'"
                                            size="small"
                                        >
                                            {{
                                                step.success
                                                    ? 'mdi-check-circle'
                                                    : 'mdi-close-circle'
                                            }}
                                        </v-icon>
                                        <span class="text-caption text-grey mr-1">
                                            #{{ step.index + 1 }}
                                        </span>
                                        <span class="text-truncate">{{ step.task }}</span>
                                        <v-chip size="x-small" variant="outlined" class="ml-auto">
                                            {{ formatDuration(step.durationMs) }}
                                        </v-chip>
                                    </div>
                                </v-expansion-panel-title>
                                <v-expansion-panel-text>
                                    <p v-if="step.error" class="text-error">{{ step.error }}</p>
                                    <MarkdownRenderer v-else :content="step.result" />
                                </v-expansion-panel-text>
                            </v-expansion-panel>
                        </v-expansion-panels>
                    </v-card-text>
                </v-card>
            </v-col>

            <!-- History Sidebar -->
            <v-col cols="12" md="5">
                <v-card>
                    <v-card-title>Workflow History</v-card-title>
                    <v-card-text
                        v-if="workflowStore.workflowHistory.length === 0"
                        class="text-grey"
                    >
                        No workflows yet. Submit your first workflow!
                    </v-card-text>
                    <v-list v-else density="compact">
                        <v-list-item
                            v-for="entry in workflowStore.workflowHistory"
                            :key="entry.id"
                            :active="latestResult?.id === entry.id"
                            rounded="xl"
                            @click="latestResult = entry"
                        >
                            <v-list-item-title class="text-truncate">
                                {{ entry.steps[0] ?? '(empty workflow)' }}
                                <span v-if="entry.steps.length > 1" class="text-grey">
                                    + {{ entry.steps.length - 1 }} more
                                </span>
                            </v-list-item-title>
                            <v-list-item-subtitle class="text-caption">
                                {{ formatTime(entry.timestamp) }}
                                <v-chip v-if="entry.profile" size="x-small" class="ml-1">
                                    {{ entry.profile }}
                                </v-chip>
                                <v-chip
                                    size="x-small"
                                    class="ml-1"
                                    :color="entry.allSucceeded ? 'success' : 'error'"
                                >
                                    {{ entry.steps.length }} step{{
                                        entry.steps.length === 1 ? '' : 's'
                                    }}
                                </v-chip>
                            </v-list-item-subtitle>
                        </v-list-item>
                    </v-list>
                </v-card>
            </v-col>
        </v-row>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useWorkflowStore, type IWorkflowHistoryEntry } from '@/stores/workflow';
import type { ModelProfile, WorkflowStreamEvent, WorkflowCarryMode } from '@/api/types';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer.vue';

const workflowStore = useWorkflowStore();

const steps = ref<string[]>(['']);
const selectedProfile = ref<ModelProfile | 'auto'>('auto');
const selectedCarry = ref<WorkflowCarryMode>('summary');
const allowWrite = ref(false);
const maxStepsPerStep = ref<number | undefined>(undefined);
const latestResult = ref<IWorkflowHistoryEntry | undefined>(undefined);
const streamFinished = ref(false);

const hasValidSteps = computed(() => steps.value.some((s) => s.trim().length > 0));

const profileOptions = [
    { title: 'Auto (router decides)', value: 'auto' },
    { title: 'Fast', value: 'fast' },
    { title: 'Reasoning', value: 'reasoning' },
    { title: 'Code', value: 'code' },
    { title: 'Default', value: 'default' }
];

const carryOptions = [
    { title: 'Summary (default) — condensed prior output', value: 'summary' },
    { title: 'Full — complete prior output', value: 'full' },
    { title: 'None — no context carry', value: 'none' }
];

watch(
    () => workflowStore.workflowHistory.length,
    () => {
        if (!latestResult.value && workflowStore.workflowHistory.length > 0) {
            latestResult.value = workflowStore.workflowHistory[0];
        }
    }
);

function addStep(): void {
    if (steps.value.length < 50) {
        steps.value.push('');
    }
}

function removeStep(index: number): void {
    if (steps.value.length > 1) {
        steps.value.splice(index, 1);
    }
}

async function submitJson(): Promise<void> {
    const validSteps = steps.value.map((s) => s.trim()).filter((s) => s.length > 0);
    if (validSteps.length === 0) return;

    streamFinished.value = false;
    const profile = selectedProfile.value === 'auto' ? undefined : selectedProfile.value;
    const result = await workflowStore.submitWorkflow(
        validSteps,
        selectedCarry.value,
        profile,
        allowWrite.value,
        maxStepsPerStep.value
    );
    if (result) {
        latestResult.value = result;
        steps.value = [''];
    }
}

async function submitStream(): Promise<void> {
    const validSteps = steps.value.map((s) => s.trim()).filter((s) => s.length > 0);
    if (validSteps.length === 0) return;

    streamFinished.value = false;
    const profile = selectedProfile.value === 'auto' ? undefined : selectedProfile.value;
    const result = await workflowStore.submitWorkflowStream(
        validSteps,
        selectedCarry.value,
        profile,
        allowWrite.value,
        maxStepsPerStep.value
    );
    streamFinished.value = true;
    if (result) {
        latestResult.value = result;
        steps.value = [''];
    }
}

function eventColor(type: WorkflowStreamEvent['type']): string {
    const colors: Record<WorkflowStreamEvent['type'], string> = {
        workflow_start: 'blue',
        step_start: 'cyan',
        step: 'purple',
        tool: 'orange',
        route: 'teal',
        step_done: 'green',
        done: 'success',
        error: 'error'
    };
    return colors[type] ?? 'grey';
}

function eventSummary(event: WorkflowStreamEvent): string {
    switch (event.type) {
        case 'workflow_start': {
            return `Workflow started with ${event.data.stepCount} step${event.data.stepCount === 1 ? '' : 's'}`;
        }
        case 'step_start': {
            return `Step ${event.data.index + 1} started: ${event.data.task}`;
        }
        case 'step': {
            return `Step ${event.data.workflowIndex + 1}, iteration ${event.data.step}: ${event.data.action}`;
        }
        case 'tool': {
            return event.data.error
                ? `Tool ${event.data.tool} error: ${event.data.error}`
                : `Tool ${event.data.tool} executed`;
        }
        case 'route': {
            return `Routed to ${event.data.profile} (${event.data.model})`;
        }
        case 'step_done': {
            return event.data.success
                ? `Step ${event.data.index + 1} done in ${formatDuration(event.data.durationMs)}`
                : `Step ${event.data.index + 1} failed: ${event.data.error ?? 'unknown error'}`;
        }
        case 'done': {
            return `Workflow completed in ${formatDuration(event.data.totalDurationMs)}`;
        }
        case 'error': {
            return `Error: ${event.data.error}`;
        }
        default: {
            return '';
        }
    }
}

function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
}

function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString();
}
</script>
