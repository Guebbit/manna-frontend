<template>
    <div>
        <h1 class="text-h4 mb-2">Swarm Orchestration</h1>
        <p class="text-body-2 text-grey mb-6">
            Swarm decomposes a complex task into subtasks, runs them in parallel across multiple
            agents, then synthesises a final answer. Best for multi-part research or analysis tasks.
        </p>

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
                            hint="Works best with complex, multi-part tasks: e.g. 'Research Vue 3, React, and Svelte — compare performance, DX, and ecosystem size'."
                            persistent-hint
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
                                    hint="Limits how many subtasks are created. Leave empty to let the system decide. Lower = faster but less thorough."
                                    persistent-hint
                                />
                            </v-col>
                            <v-col cols="12" sm="4" class="d-flex align-center">
                                <v-tooltip
                                    text="⚠ When enabled, all subtask agents can create, modify, and delete files on the server's filesystem. Leave off unless needed."
                                    location="top"
                                    max-width="320"
                                >
                                    <template #activator="{ props: tooltipProps }">
                                        <v-switch
                                            v-bind="tooltipProps"
                                            v-model="allowWrite"
                                            label="Allow write"
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
                            text="Waits for all subtasks to complete, then returns the full result with per-subtask breakdowns."
                            location="top"
                        >
                            <template #activator="{ props: tooltipProps }">
                                <v-btn
                                    v-bind="tooltipProps"
                                    color="primary"
                                    :loading="swarmStore.loading && !swarmStore.streaming"
                                    :disabled="!taskInput.trim() || swarmStore.streaming"
                                    @click="submitJson"
                                >
                                    <v-icon start>mdi-sitemap</v-icon>
                                    Run Swarm
                                </v-btn>
                            </template>
                        </v-tooltip>
                        <v-tooltip
                            text="Shows live events as subtasks start, complete, and the final synthesis happens."
                            location="top"
                        >
                            <template #activator="{ props: tooltipProps }">
                                <v-btn
                                    v-bind="tooltipProps"
                                    color="secondary"
                                    :loading="swarmStore.streaming"
                                    :disabled="
                                        !taskInput.trim() ||
                                        (swarmStore.loading && !swarmStore.streaming)
                                    "
                                    @click="submitStream"
                                >
                                    <v-icon start>mdi-antenna</v-icon>
                                    Run Swarm (Stream)
                                </v-btn>
                            </template>
                        </v-tooltip>
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
                                :dot-color="swarmEventColor(event.type)"
                                size="small"
                            >
                                <div class="d-flex align-center ga-2">
                                    <v-chip
                                        :color="swarmEventColor(event.type)"
                                        size="x-small"
                                        label
                                    >
                                        {{ event.type }}
                                    </v-chip>
                                    <span class="text-body-2">{{ swarmEventSummary(event) }}</span>
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
                            {{ latestResult.subtaskCount }} subtask{{
                                latestResult.subtaskCount === 1 ? '' : 's'
                            }}
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
                    v-if="latestResult && (latestResult.response.subtaskResults?.length ?? 0) > 0"
                    class="mt-4"
                >
                    <v-card-title>Subtask Breakdown</v-card-title>
                    <v-card-subtitle>
                        Each subtask ran independently with its own agent loop. Expand a row to see
                        the individual answer.
                    </v-card-subtitle>
                    <v-card-text>
                        <v-expansion-panels>
                            <v-expansion-panel
                                v-for="sub in latestResult.response.subtaskResults ?? []"
                                :key="sub.id"
                            >
                                <v-expansion-panel-title>
                                    <div class="d-flex align-center ga-2">
                                        <v-icon
                                            :color="sub.success ? 'success' : 'error'"
                                            size="small"
                                        >
                                            {{
                                                sub.success
                                                    ? 'mdi-check-circle'
                                                    : 'mdi-close-circle'
                                            }}
                                        </v-icon>
                                        <span class="text-truncate">{{ sub.description }}</span>
                                        <v-chip size="x-small" class="ml-auto">
                                            {{ sub.profile }}
                                        </v-chip>
                                        <v-chip size="x-small" variant="outlined">
                                            {{ formatDuration(sub.durationMs ?? 0) }}
                                        </v-chip>
                                    </div>
                                </v-expansion-panel-title>
                                <v-expansion-panel-text>
                                    <p v-if="sub.error" class="text-error">{{ sub.error }}</p>
                                    <MarkdownRenderer v-else :content="sub.answer ?? ''" />
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
import type { SwarmRequestProfileEnum as ModelProfile } from '../../api/models';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer.vue';
import CopyButton from '@/components/shared/CopyButton.vue';
import { PROFILE_OPTIONS } from '@/utils/constants';
import { formatTime, formatDuration } from '@/utils/formatting';
import { swarmEventColor, swarmEventSummary } from '@/utils/eventFormatting';

const swarmStore = useSwarmStore();

const taskInput = ref('');
// 'auto' maps to undefined in API calls — lets the model router choose per subtask
const selectedProfile = ref<ModelProfile | 'auto'>('auto');
// Default false: write access is dangerous — all subtask agents share this flag
const allowWrite = ref(false);
const maxSubtasks = ref<number | undefined>(undefined);
const latestResult = ref<ISwarmHistoryEntry | undefined>(undefined);
// Tracks whether a stream has completed so the event timeline stays visible afterwards
const streamFinished = ref(false);

const profileOptions = PROFILE_OPTIONS;

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
    // Map 'auto' sentinel to undefined so the model router picks per subtask
    const profile = selectedProfile.value === 'auto' ? undefined : selectedProfile.value;
    const result = await swarmStore.submitSwarm(task, profile, allowWrite.value, maxSubtasks.value);
    if (result) {
        latestResult.value = result;
        taskInput.value = '';
    }
}

async function submitStream(): Promise<void> {
    const task = taskInput.value.trim();
    if (!task) return;

    streamFinished.value = false;
    // Map 'auto' sentinel to undefined so the model router picks per subtask
    const profile = selectedProfile.value === 'auto' ? undefined : selectedProfile.value;
    const result = await swarmStore.submitSwarmStream(
        task,
        profile,
        allowWrite.value,
        maxSubtasks.value
    );
    // Mark finished so the event timeline stays visible after streaming ends
    streamFinished.value = true;
    if (result) {
        latestResult.value = result;
        taskInput.value = '';
    }
}
</script>
