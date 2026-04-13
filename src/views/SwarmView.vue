<template>
    <div>
        <h1 class="text-h4 mb-6">Swarm Orchestration</h1>

        <v-row>
            <v-col cols="12" md="7">
                <v-card>
                    <v-card-title>Submit a Swarm Task</v-card-title>
                    <v-card-text>
                        <v-textarea
                            v-model="taskInput"
                            label="Task description"
                            placeholder="Describe a complex task to decompose across multiple agents…"
                            variant="outlined"
                            rows="4"
                            auto-grow
                        />

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
                                <v-text-field
                                    v-model.number="maxSubtasks"
                                    label="Max subtasks"
                                    type="number"
                                    variant="outlined"
                                    density="compact"
                                    min="1"
                                    max="20"
                                    placeholder="Auto"
                                    clearable
                                />
                            </v-col>
                            <v-col cols="12" sm="4" class="d-flex align-center">
                                <v-switch
                                    v-model="allowWrite"
                                    label="Allow write"
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
                            :loading="swarmStore.loading && !swarmStore.streaming"
                            :disabled="!taskInput.trim() || swarmStore.streaming"
                            @click="submitJson"
                        >
                            <v-icon start>mdi-sitemap</v-icon>
                            Run Swarm
                        </v-btn>
                        <v-btn
                            color="secondary"
                            :loading="swarmStore.streaming"
                            :disabled="!taskInput.trim() || (swarmStore.loading && !swarmStore.streaming)"
                            @click="submitStream"
                        >
                            <v-icon start>mdi-antenna</v-icon>
                            Run Swarm (Stream)
                        </v-btn>
                    </v-card-actions>
                </v-card>

                <!-- Stream Event Feed -->
                <v-card v-if="swarmStore.streaming || streamFinished" class="mt-4">
                    <v-card-title class="d-flex align-center">
                        <v-icon start>mdi-antenna</v-icon>
                        Live Events
                        <v-progress-circular
                            v-if="swarmStore.streaming"
                            indeterminate
                            size="16"
                            class="ml-2"
                        />
                    </v-card-title>
                    <v-card-text>
                        <v-timeline density="compact" side="end">
                            <v-timeline-item
                                v-for="(event, index) in swarmStore.streamEvents"
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
                        <v-chip size="small" color="primary" class="mr-2">
                            {{ latestResult.subtaskCount }} subtask{{ latestResult.subtaskCount === 1 ? '' : 's' }}
                        </v-chip>
                        <v-chip size="small" color="secondary">
                            {{ formatDuration(latestResult.totalDurationMs) }}
                        </v-chip>
                        <CopyButton :text="latestResult.result" class="ml-2" />
                    </v-card-title>
                    <v-card-text>
                        <MarkdownRenderer :content="latestResult.result" />
                    </v-card-text>
                </v-card>

                <!-- Subtask Breakdown -->
                <v-card
                    v-if="latestResult && latestResult.response.subtaskResults.length > 0"
                    class="mt-4"
                >
                    <v-card-title>Subtask Breakdown</v-card-title>
                    <v-card-text>
                        <v-expansion-panels>
                            <v-expansion-panel
                                v-for="sub in latestResult.response.subtaskResults"
                                :key="sub.id"
                            >
                                <v-expansion-panel-title>
                                    <div class="d-flex align-center ga-2">
                                        <v-icon
                                            :color="sub.success ? 'success' : 'error'"
                                            size="small"
                                        >
                                            {{ sub.success ? 'mdi-check-circle' : 'mdi-close-circle' }}
                                        </v-icon>
                                        <span class="text-truncate">{{ sub.description }}</span>
                                        <v-chip size="x-small" class="ml-auto">
                                            {{ sub.profile }}
                                        </v-chip>
                                        <v-chip size="x-small" variant="outlined">
                                            {{ formatDuration(sub.durationMs) }}
                                        </v-chip>
                                    </div>
                                </v-expansion-panel-title>
                                <v-expansion-panel-text>
                                    <p v-if="sub.error" class="text-error">{{ sub.error }}</p>
                                    <MarkdownRenderer v-else :content="sub.answer" />
                                </v-expansion-panel-text>
                            </v-expansion-panel>
                        </v-expansion-panels>
                    </v-card-text>
                </v-card>
            </v-col>

            <!-- History Sidebar -->
            <v-col cols="12" md="5">
                <v-card>
                    <v-card-title>Swarm History</v-card-title>
                    <v-card-text v-if="swarmStore.swarmHistory.length === 0" class="text-grey">
                        No swarm tasks yet. Submit your first task!
                    </v-card-text>
                    <v-list v-else density="compact">
                        <v-list-item
                            v-for="entry in swarmStore.swarmHistory"
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
                                <v-chip size="x-small" class="ml-1" color="primary">
                                    {{ entry.subtaskCount }} tasks
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
import { useSwarmStore, type ISwarmHistoryEntry } from '@/stores/swarm';
import type { ModelProfile, SwarmStreamEvent } from '@/api/types';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer.vue';
import CopyButton from '@/components/shared/CopyButton.vue';

const swarmStore = useSwarmStore();

const taskInput = ref('');
const selectedProfile = ref<ModelProfile | 'auto'>('auto');
const allowWrite = ref(false);
const maxSubtasks = ref<number | undefined>(undefined);
const latestResult = ref<ISwarmHistoryEntry | undefined>(undefined);
const streamFinished = ref(false);

const profileOptions = [
    { title: 'Auto (router decides)', value: 'auto' },
    { title: 'Fast', value: 'fast' },
    { title: 'Reasoning', value: 'reasoning' },
    { title: 'Code', value: 'code' },
    { title: 'Default', value: 'default' }
];

watch(
    () => swarmStore.swarmHistory.length,
    () => {
        if (!latestResult.value && swarmStore.swarmHistory.length > 0) {
            latestResult.value = swarmStore.swarmHistory[0];
        }
    }
);

async function submitJson(): Promise<void> {
    const task = taskInput.value.trim();
    if (!task) return;

    streamFinished.value = false;
    const profile = selectedProfile.value === 'auto' ? undefined : selectedProfile.value;
    const result = await swarmStore.submitSwarm(
        task,
        profile,
        allowWrite.value,
        maxSubtasks.value
    );
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
    const result = await swarmStore.submitSwarmStream(
        task,
        profile,
        allowWrite.value,
        maxSubtasks.value
    );
    streamFinished.value = true;
    if (result) {
        latestResult.value = result;
        taskInput.value = '';
    }
}

function eventColor(type: SwarmStreamEvent['type']): string {
    const colors: Record<SwarmStreamEvent['type'], string> = {
        decomposed: 'blue',
        subtask_start: 'cyan',
        subtask_done: 'green',
        subtask_error: 'red',
        step: 'purple',
        tool: 'orange',
        route: 'teal',
        done: 'success',
        error: 'error'
    };
    return colors[type] ?? 'grey';
}

function eventSummary(event: SwarmStreamEvent): string {
    switch (event.type) {
        case 'decomposed': {
            return `Decomposed into ${event.data.subtaskCount} subtasks`;
        }
        case 'subtask_start': {
            return `Subtask ${event.data.subtaskId} started (${event.data.profile})`;
        }
        case 'subtask_done': {
            return `Subtask ${event.data.subtaskId} done in ${formatDuration(event.data.durationMs)}`;
        }
        case 'subtask_error': {
            return `Subtask ${event.data.subtaskId} failed: ${event.data.error}`;
        }
        case 'step': {
            return `Step ${event.data.step}: ${event.data.action}`;
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
            return `Completed in ${formatDuration(event.data.totalDurationMs)}`;
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
