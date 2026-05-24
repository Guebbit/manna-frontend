<template>
    <div>
        <h1 class="text-h4 mb-2">{{ t('swarm.title') }}</h1>
        <p class="text-body-2 text-grey mb-6">{{ t('swarm.subtitle') }}</p>

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
                <v-card v-if="swarmStore.streaming || streamFinished" class="mt-4">
                    <v-card-title class="d-flex align-center">
                        <v-icon start>mdi-antenna</v-icon>
                        {{ t('common.liveEvents') }}
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
                        {{ t('common.result') }}
                        <v-spacer />
                        <v-chip size="small" color="primary" class="mr-2">
                            {{ t('swarm.subtaskCount', latestResult.subtaskCount) }}
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
                <v-card>
                    <v-card-title>{{ t('swarm.swarmHistory') }}</v-card-title>
                    <v-card-text v-if="swarmStore.swarmHistory.length === 0" class="text-grey">
                        {{ t('swarm.noSwarmYet') }}
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
                                    {{ t('swarm.subtaskCount', entry.subtaskCount) }}
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
import { useI18n } from 'vue-i18n';
import { useSwarmStore, type ISwarmHistoryEntry } from '@/stores/swarm';
import type { SwarmRequestProfileEnum as ModelProfile } from '@api/api';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer.vue';
import CopyButton from '@/components/shared/CopyButton.vue';
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

watch(
    () => swarmStore.swarmHistory.length,
    () => {
        if (!latestResult.value && swarmStore.swarmHistory.length > 0) {
            latestResult.value = swarmStore.swarmHistory[0];
        }
    }
);

function submitJson(): void {
    const task = taskInput.value.trim();
    if (!task) return;

    streamFinished.value = false;
    const profile = selectedProfile.value === 'auto' ? undefined : selectedProfile.value;
    swarmStore.submitSwarm(task, profile, allowWrite.value, maxSubtasks.value).then((result) => {
        if (result) {
            latestResult.value = result;
            taskInput.value = '';
        }
    });
}

function submitStream(): void {
    const task = taskInput.value.trim();
    if (!task) return;

    streamFinished.value = false;
    const profile = selectedProfile.value === 'auto' ? undefined : selectedProfile.value;
    swarmStore
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
