<template>
    <div>
        <h1 class="text-h4 mb-2">Agent Task</h1>
        <p class="text-body-2 text-grey mb-6">
            Give the agent a natural-language task. It will reason step-by-step, pick tools from
            its registry, and execute them autonomously (up to 5 iterations).
        </p>

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
                            hint="Be specific: e.g. 'Read package.json and summarise all dependencies' or 'Search the web for Vue 3 best practices'."
                            persistent-hint
                        />

                        <v-row class="mt-2">
                            <v-col cols="12" sm="6">
                                <v-select
                                    v-model="selectedProfile"
                                    :items="profileOptions"
                                    label="Model profile"
                                    variant="outlined"
                                    density="compact"
                                    hint="Auto lets Manna's router pick the best model per step. Fast = low latency, Reasoning = complex tasks, Code = programming tasks."
                                    persistent-hint
                                />
                            </v-col>
                            <v-col cols="12" sm="6" class="d-flex align-center">
                                <v-tooltip
                                    text="⚠ When enabled, the agent can create, modify, and delete files on the server's filesystem. Leave off unless file modification is required."
                                    location="top"
                                    max-width="320"
                                >
                                    <template #activator="{ props: tooltipProps }">
                                        <v-switch
                                            v-bind="tooltipProps"
                                            v-model="allowWrite"
                                            label="Allow write operations"
                                            color="warning"
                                            density="compact"
                                            hide-details
                                        />
                                    </template>
                                </v-tooltip>
                            </v-col>
                        </v-row>
                    </v-card-text>
                    <v-card-actions>
                        <v-tooltip
                            text="Sends the task and waits for the complete result (no intermediate updates)."
                            location="top"
                        >
                            <template #activator="{ props: tooltipProps }">
                                <v-btn
                                    v-bind="tooltipProps"
                                    color="primary"
                                    :loading="agentStore.loading && !agentStore.streaming"
                                    :disabled="!taskInput.trim() || agentStore.streaming"
                                    @click="submit"
                                >
                                    <v-icon start>mdi-play</v-icon>
                                    Run Task
                                </v-btn>
                            </template>
                        </v-tooltip>
                        <v-tooltip
                            text="Sends the task and shows real-time events as the agent reasons and uses tools."
                            location="top"
                        >
                            <template #activator="{ props: tooltipProps }">
                                <v-btn
                                    v-bind="tooltipProps"
                                    color="secondary"
                                    :loading="agentStore.streaming"
                                    :disabled="!taskInput.trim() || (agentStore.loading && !agentStore.streaming)"
                                    @click="submitStream"
                                >
                                    <v-icon start>mdi-antenna</v-icon>
                                    Stream
                                </v-btn>
                            </template>
                        </v-tooltip>
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
                    <v-card-subtitle>
                        Each event shows one step in the agent's reasoning chain: tool calls,
                        model routing decisions, and completion.
                    </v-card-subtitle>
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
import type { ModelProfile } from '@/api/types';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer.vue';
import CopyButton from '@/components/shared/CopyButton.vue';
import { PROFILE_OPTIONS } from '@/utils/constants';
import { formatTime } from '@/utils/formatting';
import { agentEventColor, agentEventSummary } from '@/utils/eventFormatting';

const agentStore = useAgentStore();

const taskInput = ref('');
// 'auto' is a UI-only sentinel value; it maps to `undefined` in API calls
// so the backend model router can freely choose the best profile per step
const selectedProfile = ref<ModelProfile | 'auto'>('auto');
// Default false: write access is dangerous — the agent can modify server files
const allowWrite = ref(false);
const latestResult = ref<ITaskHistoryEntry | undefined>(undefined);
// Separate ref from `agentStore.streaming` so we can distinguish
// "stream has finished" from "stream was never started" and keep the
// event timeline visible after streaming ends
const streamFinished = ref(false);

const profileOptions = PROFILE_OPTIONS;

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
    // Map 'auto' sentinel back to undefined so the router picks the profile
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
    // Map 'auto' sentinel back to undefined so the router picks the profile
    const profile = selectedProfile.value === 'auto' ? undefined : selectedProfile.value;
    const result = await agentStore.submitTaskStream(task, profile, allowWrite.value);
    // Mark stream as finished so the event timeline stays visible after streaming stops
    streamFinished.value = true;
    if (result) {
        latestResult.value = result;
        taskInput.value = '';
    }
}
</script>
