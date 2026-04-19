<template>
    <div>
        <h1 class="text-h4 mb-2">{{ t('agent.title') }}</h1>
        <p class="text-body-2 text-grey mb-6">{{ t('agent.subtitle') }}</p>

        <v-row>
            <v-col cols="12" md="7">
                <v-card>
                    <v-card-title>{{ t('agent.submitTask') }}</v-card-title>
                    <v-card-text>
                        <v-textarea
                            v-model="taskInput"
                            :label="t('agent.taskDescription')"
                            :placeholder="t('agent.taskPlaceholder')"
                            variant="outlined"
                            rows="4"
                            auto-grow
                            :hint="t('agent.taskHint')"
                            persistent-hint
                        />

                        <v-row class="mt-2">
                            <v-col cols="12" sm="6">
                                <v-select
                                    v-model="selectedProfile"
                                    :items="profileOptions"
                                    :label="t('agent.modelProfile')"
                                    variant="outlined"
                                    density="compact"
                                    :hint="t('agent.profileHint')"
                                    persistent-hint
                                />
                            </v-col>
                            <v-col cols="12" sm="6" class="d-flex align-center">
                                <v-tooltip
                                    :text="t('agent.allowWriteTooltip')"
                                    location="top"
                                    max-width="320"
                                >
                                    <template #activator="{ props: tooltipProps }">
                                        <v-switch
                                            v-bind="tooltipProps"
                                            v-model="allowWrite"
                                            :label="t('agent.allowWrite')"
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
                        <v-tooltip :text="t('agent.runTaskTooltip')" location="top">
                            <template #activator="{ props: tooltipProps }">
                                <v-btn
                                    v-bind="tooltipProps"
                                    color="primary"
                                    :loading="agentStore.loading && !agentStore.streaming"
                                    :disabled="!taskInput.trim() || agentStore.streaming"
                                    @click="submit"
                                >
                                    <v-icon start>mdi-play</v-icon>
                                    {{ t('agent.runTask') }}
                                </v-btn>
                            </template>
                        </v-tooltip>
                        <v-tooltip :text="t('agent.streamTooltip')" location="top">
                            <template #activator="{ props: tooltipProps }">
                                <v-btn
                                    v-bind="tooltipProps"
                                    color="secondary"
                                    :loading="agentStore.streaming"
                                    :disabled="
                                        !taskInput.trim() ||
                                        (agentStore.loading && !agentStore.streaming)
                                    "
                                    @click="submitStream"
                                >
                                    <v-icon start>mdi-antenna</v-icon>
                                    {{ t('agent.stream') }}
                                </v-btn>
                            </template>
                        </v-tooltip>
                    </v-card-actions>
                </v-card>

                <!-- Stream Event Feed -->
                <v-card v-if="agentStore.streaming || streamFinished" class="mt-4">
                    <v-card-title class="d-flex align-center">
                        <v-icon start>mdi-antenna</v-icon>
                        {{ t('common.liveEvents') }}
                        <v-progress-circular
                            v-if="agentStore.streaming"
                            indeterminate
                            size="16"
                            class="ml-2"
                        />
                    </v-card-title>
                    <v-card-subtitle>{{ t('agent.liveEventsSubtitle') }}</v-card-subtitle>
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
                        {{ t('common.result') }}
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
                    <v-card-title>{{ t('agent.taskHistory') }}</v-card-title>
                    <v-card-text v-if="agentStore.taskHistory.length === 0" class="text-grey">
                        {{ t('agent.noTasksYet') }}
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
import { useI18n } from 'vue-i18n';
import { useAgentStore, type ITaskHistoryEntry } from '@/stores/agent';
import type { RunRequestProfileEnum as ModelProfile } from '@api/api';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer.vue';
import CopyButton from '@/components/shared/CopyButton.vue';
import { useProfileOptions } from '@/utils/constants';
import { formatTime } from '@/utils/formatting';
import { agentEventColor, agentEventSummary } from '@/utils/eventFormatting';

const { t } = useI18n();
const agentStore = useAgentStore();
const profileOptions = useProfileOptions();

const taskInput = ref('');
const selectedProfile = ref<ModelProfile | 'auto'>('auto');
const allowWrite = ref(false);
const latestResult = ref<ITaskHistoryEntry | undefined>(undefined);
const streamFinished = ref(false);

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
</script>
