<template>
    <div>
        <h1 class="text-h4 mb-6">Agent Task</h1>

        <v-row>
            <v-col cols="12" md="7">
                <v-card>
                    <v-card-title>Submit a Task</v-card-title>
                    <v-card-text>
                        <v-textarea
                            v-model="taskInput"
                            label="Task description"
                            placeholder="Describe what you want the agent to do…"
                            variant="outlined"
                            rows="4"
                            auto-grow
                        />

                        <v-row class="mt-2">
                            <v-col cols="12" sm="6">
                                <v-select
                                    v-model="selectedProfile"
                                    :items="profileOptions"
                                    label="Model profile"
                                    variant="outlined"
                                    density="compact"
                                />
                            </v-col>
                            <v-col cols="12" sm="6" class="d-flex align-center">
                                <v-switch
                                    v-model="allowWrite"
                                    label="Allow write operations"
                                    color="warning"
                                    density="compact"
                                    hide-details
                                />
                            </v-col>
                        </v-row>
                    </v-card-text>
                    <v-card-actions>
                        <v-btn
                            color="primary"
                            :loading="agentStore.loading && !agentStore.streaming"
                            :disabled="!taskInput.trim() || agentStore.streaming"
                            @click="submit"
                        >
                            <v-icon start>mdi-play</v-icon>
                            Run Task
                        </v-btn>
                        <v-btn
                            color="secondary"
                            :loading="agentStore.streaming"
                            :disabled="!taskInput.trim() || (agentStore.loading && !agentStore.streaming)"
                            @click="submitStream"
                        >
                            <v-icon start>mdi-antenna</v-icon>
                            Stream
                        </v-btn>
                    </v-card-actions>
                </v-card>

                <!-- Stream Event Feed -->
                <v-card v-if="agentStore.streaming || streamFinished" class="mt-4">
                    <v-card-title class="d-flex align-center">
                        <v-icon start>mdi-antenna</v-icon>
                        Live Events
                        <v-progress-circular
                            v-if="agentStore.streaming"
                            indeterminate
                            size="16"
                            class="ml-2"
                        />
                    </v-card-title>
                    <v-card-text>
                        <v-timeline density="compact" side="end">
                            <v-timeline-item
                                v-for="(event, index) in agentStore.streamEvents"
                                :key="index"
                                :dot-color="agentEventColor(event.type)"
                                size="small"
                            >
                                <div class="d-flex align-center ga-2">
                                    <v-chip
                                        :color="agentEventColor(event.type)"
                                        size="x-small"
                                        label
                                    >
                                        {{ event.type }}
                                    </v-chip>
                                    <span class="text-body-2">{{ agentEventSummary(event) }}</span>
                                </div>
                            </v-timeline-item>
                        </v-timeline>
                    </v-card-text>
                </v-card>

                <!-- Result -->
                <v-card v-if="latestResult" class="mt-4">
                    <v-card-title class="d-flex align-center">
                        Result
                        <v-spacer />
                        <CopyButton :text="latestResult.result" />
                    </v-card-title>
                    <v-card-text>
                        <MarkdownRenderer :content="latestResult.result" />
                    </v-card-text>
                </v-card>
            </v-col>

            <!-- Task History -->
            <v-col cols="12" md="5">
                <v-card>
                    <v-card-title>Task History</v-card-title>
                    <v-card-text v-if="agentStore.taskHistory.length === 0" class="text-grey">
                        No tasks yet. Submit your first task!
                    </v-card-text>
                    <v-list v-else density="compact">
                        <v-list-item
                            v-for="entry in agentStore.taskHistory"
                            :key="entry.id"
                            :active="latestResult?.id === entry.id"
                            rounded="xl"
                            @click="latestResult = entry"
                        >
                            <v-list-item-title class="text-truncate">
                                {{ entry.task }}
                            </v-list-item-title>
                            <v-list-item-subtitle class="text-caption">
                                {{ formatTime(entry.timestamp) }}
                                <v-chip v-if="entry.profile" size="x-small" class="ml-1">
                                    {{ entry.profile }}
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
import { ref, watch } from 'vue';
import { useAgentStore, type ITaskHistoryEntry } from '@/stores/agent';
import type { ModelProfile, AgentStreamEvent } from '@/api/types';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer.vue';
import CopyButton from '@/components/shared/CopyButton.vue';

const agentStore = useAgentStore();

const taskInput = ref('');
const selectedProfile = ref<ModelProfile | 'auto'>('auto');
const allowWrite = ref(false);
const latestResult = ref<ITaskHistoryEntry | undefined>(undefined);
const streamFinished = ref(false);

const profileOptions = [
    { title: 'Auto (router decides)', value: 'auto' },
    { title: 'Fast', value: 'fast' },
    { title: 'Reasoning', value: 'reasoning' },
    { title: 'Code', value: 'code' },
    { title: 'Default', value: 'default' }
];

// Auto-select latest result when history changes
watch(
    () => agentStore.taskHistory.length,
    () => {
        if (!latestResult.value && agentStore.taskHistory.length > 0) {
            latestResult.value = agentStore.taskHistory[0];
        }
    }
);

async function submit(): Promise<void> {
    const task = taskInput.value.trim();
    if (!task) return;

    streamFinished.value = false;
    const profile = selectedProfile.value === 'auto' ? undefined : selectedProfile.value;
    const result = await agentStore.submitTask(task, profile, allowWrite.value);
    if (result) {
        latestResult.value = result;
        taskInput.value = '';
    }
}

async function submitStream(): Promise<void> {
    const task = taskInput.value.trim();
    if (!task) return;

    streamFinished.value = false;
    const profile = selectedProfile.value === 'auto' ? undefined : selectedProfile.value;
    const result = await agentStore.submitTaskStream(task, profile, allowWrite.value);
    streamFinished.value = true;
    if (result) {
        latestResult.value = result;
        taskInput.value = '';
    }
}

function agentEventColor(type: AgentStreamEvent['type']): string {
    const colors: Record<AgentStreamEvent['type'], string> = {
        step: 'purple',
        tool: 'orange',
        route: 'teal',
        done: 'success',
        error: 'error',
        max_steps: 'warning'
    };
    return colors[type] ?? 'grey';
}

function agentEventSummary(event: AgentStreamEvent): string {
    switch (event.type) {
        case 'step': {
            return `Step ${String(event.data.step)}: ${event.data.action} — ${event.data.thought}`;
        }
        case 'tool': {
            return event.data.error
                ? `Tool ${event.data.tool} error: ${event.data.error}`
                : `Tool ${event.data.tool} executed`;
        }
        case 'route': {
            return `Routed to ${event.data.profile} (${event.data.model})`;
        }
        case 'done': {
            return 'Agent completed';
        }
        case 'error': {
            return `Error: ${event.data.error}`;
        }
        case 'max_steps': {
            return `Max steps reached: ${event.data.summary}`;
        }
        default: {
            return '';
        }
    }
}

function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString();
}
</script>
