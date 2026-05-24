<template>
    <div>
        <PageHeader :title="t('swarm.title')" :subtitle="t('swarm.subtitle')" />

        <v-row>
            <v-col cols="12" md="7">
                <v-card>
                    <v-card-title>{{ t('swarm.submitSwarmTask') }}</v-card-title>
                    <v-card-text>
                        <v-textarea
                            v-model="taskInput"
                            :label="t('swarm.taskDescription')"
                            :placeholder="t('swarm.taskPlaceholder')"
                            variant="outlined"
                            rows="4"
                            auto-grow
                            :hint="t('swarm.taskHint')"
                            persistent-hint
                        />

                        <v-row class="mt-2">
                            <v-col cols="12" sm="4">
                                <v-select
                                    v-model="selectedProfile"
                                    :items="profileOptions"
                                    :label="t('swarm.modelProfile')"
                                    variant="outlined"
                                    density="compact"
                                />
                            </v-col>
                            <v-col cols="12" sm="4">
                                <v-text-field
                                    v-model.number="maxSubtasks"
                                    :label="t('swarm.maxSubtasks')"
                                    type="number"
                                    variant="outlined"
                                    density="compact"
                                    min="1"
                                    max="20"
                                    :placeholder="t('swarm.maxSubtasksPlaceholder')"
                                    clearable
                                    :hint="t('swarm.maxSubtasksHint')"
                                    persistent-hint
                                />
                            </v-col>
                            <v-col cols="12" sm="4" class="d-flex align-center">
                                <v-tooltip
                                    :text="t('swarm.allowWriteTooltip')"
                                    location="top"
                                    max-width="320"
                                >
                                    <template #activator="{ props: tooltipProps }">
                                        <v-switch
                                            v-bind="tooltipProps"
                                            v-model="allowWrite"
                                            :label="t('swarm.allowWrite')"
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
                        <v-tooltip :text="t('swarm.runSwarmTooltip')" location="top">
                            <template #activator="{ props: tooltipProps }">
                                <v-btn
                                    v-bind="tooltipProps"
                                    color="primary"
                                    :loading="swarmStore.loading && !swarmStore.streaming"
                                    :disabled="!taskInput.trim() || swarmStore.streaming"
                                    @click="submitJson"
                                >
                                    <v-icon start>mdi-sitemap</v-icon>
                                    {{ t('swarm.runSwarm') }}
                                </v-btn>
                            </template>
                        </v-tooltip>
                        <v-tooltip :text="t('swarm.runSwarmStreamTooltip')" location="top">
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
                                    {{ t('swarm.runSwarmStream') }}
                                </v-btn>
                            </template>
                        </v-tooltip>
                    </v-card-actions>
                </v-card>

                <!-- Stream Event Feed -->
                <StreamEventFeed
                    :streaming="swarmStore.streaming"
                    :finished="streamFinished"
                    :events="swarmStore.streamEvents"
                    :color-fn="swarmEventColor"
                    :summary-fn="swarmEventSummary"
                />

                <!-- JSON Result -->
                <ResultCard v-if="latestResult" :content="latestResult.result">
                    <template #chips>
                        <v-chip size="small" color="primary" class="mr-2">
                            {{ t('swarm.subtaskCount', latestResult.subtaskCount) }}
                        </v-chip>
                        <v-chip size="small" color="secondary">
                            {{ formatDuration(latestResult.totalDurationMs) }}
                        </v-chip>
                    </template>
                </ResultCard>

                <!-- Subtask Breakdown -->
                <v-card
                    v-if="latestResult && (latestResult.response.subtaskResults?.length ?? 0) > 0"
                    class="mt-4"
                >
                    <v-card-title>{{ t('swarm.subtaskBreakdown') }}</v-card-title>
                    <v-card-subtitle>{{ t('swarm.subtaskBreakdownSubtitle') }}</v-card-subtitle>
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
                <TaskHistorySidebar
                    :title="t('swarm.swarmHistory')"
                    :empty-text="t('swarm.noSwarmYet')"
                    :items="historyItems"
                    :active-id="latestResult?.id"
                    @select="onHistorySelect"
                >
                    <template #item-subtitle="{ item }">
                        {{ item.subtitle }}
                    </template>
                </TaskHistorySidebar>
            </v-col>
        </v-row>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSwarmStore, type ISwarmHistoryEntry } from '@/stores/swarm';
import type { SwarmRequestProfileEnum as ModelProfile } from '@api/api';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer.vue';
import PageHeader from '@/components/shared/PageHeader.vue';
import StreamEventFeed from '@/components/shared/StreamEventFeed.vue';
import ResultCard from '@/components/shared/ResultCard.vue';
import TaskHistorySidebar from '@/components/shared/TaskHistorySidebar.vue';
import type { IHistoryItem } from '@/components/shared/TaskHistorySidebar.vue';
import { useProfileOptions } from '@/utils/constants';
import { formatTime, formatDuration } from '@/utils/formatting';
import { swarmEventColor, swarmEventSummary } from '@/utils/eventFormatting';

const { t } = useI18n();
const swarmStore = useSwarmStore();
const profileOptions = useProfileOptions();

const taskInput = ref('');
const selectedProfile = ref<ModelProfile | 'auto'>('auto');
const allowWrite = ref(false);
const maxSubtasks = ref<number | undefined>(undefined);
const latestResult = ref<ISwarmHistoryEntry | undefined>(undefined);
const streamFinished = ref(false);

/** Map store history to generic IHistoryItem format for the sidebar */
const historyItems = computed<IHistoryItem[]>(() =>
    swarmStore.swarmHistory.map((entry) => ({
        id: entry.id,
        label: entry.task,
        subtitle: formatTime(entry.timestamp)
    }))
);

function onHistorySelect(item: IHistoryItem): void {
    latestResult.value = swarmStore.swarmHistory.find((e) => e.id === item.id);
}

watch(
    () => swarmStore.swarmHistory.length,
    () => {
        if (!latestResult.value && swarmStore.swarmHistory.length > 0) {
            latestResult.value = swarmStore.swarmHistory[0];
        }
    }
);

function submitJson(): Promise<void> {
    const task = taskInput.value.trim();
    if (!task) return Promise.resolve();

    streamFinished.value = false;
    const profile = selectedProfile.value === 'auto' ? undefined : selectedProfile.value;
    return swarmStore
        .submitSwarm(task, profile, allowWrite.value, maxSubtasks.value)
        .then((result) => {
            if (result) {
                latestResult.value = result;
                taskInput.value = '';
            }
        });
}

function submitStream(): Promise<void> {
    const task = taskInput.value.trim();
    if (!task) return Promise.resolve();

    streamFinished.value = false;
    const profile = selectedProfile.value === 'auto' ? undefined : selectedProfile.value;
    return swarmStore
        .submitSwarmStream(task, profile, allowWrite.value, maxSubtasks.value)
        .then((result) => {
            streamFinished.value = true;
            if (result) {
                latestResult.value = result;
                taskInput.value = '';
            }
        });
}
</script>
