<template>
    <div>
        <PageHeader :title="t('agent.title')" :subtitle="t('agent.subtitle')" />

        <v-row>
            <v-col cols="12" md="7">
                <TaskInputCard
                    v-model="taskInput"
                    v-model:profile="selectedProfile"
                    :title="t('agent.submitTask')"
                    :input-label="t('agent.taskDescription')"
                    :placeholder="t('agent.taskPlaceholder')"
                    :hint="t('agent.taskHint')"
                    :profile-label="t('agent.modelProfile')"
                >
                    <template #extra>
                        <!-- Workspace root banner — shown only when configured -->
                        <v-alert
                            v-if="workspaceRoot"
                            type="info"
                            variant="tonal"
                            density="compact"
                            class="mt-3"
                            :text="t('agent.workspaceActive', { path: workspaceRoot })"
                        />
                    </template>
                    <template #actions>
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
                    </template>
                </TaskInputCard>

                <!-- Stream Event Feed -->
                <StreamEventFeed
                    :streaming="agentStore.streaming"
                    :finished="streamFinished"
                    :events="agentStore.streamEvents"
                    :color-fn="agentEventColor"
                    :summary-fn="agentEventSummary"
                    :subtitle="t('agent.liveEventsSubtitle')"
                />

                <!-- Result -->
                <ResultCard v-if="latestResult" :content="latestResult.result">
                    <template #extra>
                        <!-- Citations (non-streaming mode only) -->
                        <template
                            v-if="latestResult.citations && latestResult.citations.length > 0"
                        >
                            <v-divider />
                            <v-card-title class="text-body-1">
                                <v-icon start size="small">mdi-link-variant</v-icon>
                                {{ t('agent.citations') }}
                            </v-card-title>
                            <v-card-text>
                                <v-list density="compact">
                                    <v-list-item
                                        v-for="citation in latestResult.citations"
                                        :key="citation.id"
                                        :subtitle="citation.text"
                                    >
                                        <template #title>
                                            <span class="text-caption font-weight-medium">
                                                {{ citation.title }}
                                            </span>
                                        </template>
                                    </v-list-item>
                                </v-list>
                            </v-card-text>
                        </template>
                    </template>
                </ResultCard>
            </v-col>

            <!-- Task History -->
            <v-col cols="12" md="5">
                <TaskHistorySidebar
                    :title="t('agent.taskHistory')"
                    :empty-text="t('agent.noTasksYet')"
                    :items="historyItems"
                    :active-id="latestResult?.id"
                    @select="onHistorySelect"
                >
                    <template #item-title="{ item }">
                        {{ item.label }}
                    </template>
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
import { useAgentStore, type ITaskHistoryEntry } from '@/stores/agent';
import type { RunRequestProfileEnum as ModelProfile } from '@api/api';
import PageHeader from '@/components/shared/PageHeader.vue';
import TaskInputCard from '@/components/shared/TaskInputCard.vue';
import StreamEventFeed from '@/components/shared/StreamEventFeed.vue';
import ResultCard from '@/components/shared/ResultCard.vue';
import TaskHistorySidebar from '@/components/shared/TaskHistorySidebar.vue';
import type { IHistoryItem } from '@/components/shared/TaskHistorySidebar.vue';
import { formatTime } from '@/utils/formatting';
import { agentEventColor, agentEventSummary } from '@/utils/eventFormatting';
import { getWorkspaceRoot } from '@/config';

const { t } = useI18n();
const agentStore = useAgentStore();

const taskInput = ref('');
const selectedProfile = ref<ModelProfile | 'auto'>('auto');
const latestResult = ref<ITaskHistoryEntry | undefined>(undefined);
const streamFinished = ref(false);

/** Workspace root from Settings — injected into every run call. */
const workspaceRoot = getWorkspaceRoot() || undefined;

/** Map store history to generic IHistoryItem format for the sidebar */
const historyItems = computed<IHistoryItem[]>(() =>
    agentStore.taskHistory.map((entry) => ({
        id: entry.id,
        label: entry.task,
        subtitle: formatTime(entry.timestamp)
    }))
);

function onHistorySelect(item: IHistoryItem): void {
    latestResult.value = agentStore.taskHistory.find((e) => e.id === item.id);
}

watch(
    () => agentStore.taskHistory.length,
    () => {
        if (!latestResult.value && agentStore.taskHistory.length > 0) {
            latestResult.value = agentStore.taskHistory[0];
        }
    }
);

function submit(): Promise<void> {
    const task = taskInput.value.trim();
    if (!task) return Promise.resolve();

    streamFinished.value = false;
    const profile = selectedProfile.value === 'auto' ? undefined : selectedProfile.value;
    return agentStore.submitTask(task, profile, true, workspaceRoot).then((result) => {
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
    return agentStore.submitTaskStream(task, profile, true, workspaceRoot).then((result) => {
        streamFinished.value = true;
        if (result) {
            latestResult.value = result;
            taskInput.value = '';
        }
    });
}
</script>
