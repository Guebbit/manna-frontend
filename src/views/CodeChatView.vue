<template>
    <div>
        <PageHeader :title="t('codeChat.title')" :subtitle="t('codeChat.subtitle')" />

        <!-- Workspace context bar -->
        <v-alert
            v-if="workspaceRoot"
            type="success"
            variant="tonal"
            density="compact"
            class="mb-4"
            :icon="false"
        >
            <div class="d-flex align-center ga-2">
                <v-icon color="success">mdi-folder-open</v-icon>
                <code class="text-caption">{{ workspaceRoot }}</code>
                <v-spacer />
                <v-btn variant="text" size="x-small" :to="{ name: 'settings' }">
                    {{ t('codeChat.changeWorkspace') }}
                </v-btn>
            </div>
        </v-alert>

        <v-alert v-else type="warning" variant="tonal" density="compact" class="mb-4">
            {{ t('codeChat.noWorkspace') }}
            <v-btn variant="text" size="x-small" class="ml-2" :to="{ name: 'settings' }">
                {{ t('codeChat.configureWorkspace') }}
            </v-btn>
        </v-alert>

        <v-row>
            <v-col cols="12" md="7">
                <TaskInputCard
                    v-model="taskInput"
                    v-model:profile="selectedProfile"
                    :title="t('codeChat.askAboutCode')"
                    :input-label="t('codeChat.taskLabel')"
                    :placeholder="t('codeChat.taskPlaceholder')"
                    :hint="t('codeChat.taskHint')"
                    :profile-label="t('codeChat.modelProfile')"
                >
                    <template #actions>
                        <v-btn
                            color="primary"
                            :loading="agentStore.streaming"
                            :disabled="!taskInput.trim() || agentStore.streaming"
                            @click="submitStream"
                        >
                            <v-icon start>mdi-send</v-icon>
                            {{ t('codeChat.send') }}
                        </v-btn>

                        <!-- Quick-prompt chips for common code tasks -->
                        <v-spacer />
                        <v-menu>
                            <template #activator="{ props: menuProps }">
                                <v-btn v-bind="menuProps" variant="text" size="small">
                                    <v-icon start>mdi-lightning-bolt</v-icon>
                                    {{ t('codeChat.quickPrompts') }}
                                </v-btn>
                            </template>
                            <v-list density="compact">
                                <v-list-item
                                    v-for="qp in quickPrompts"
                                    :key="qp.key"
                                    :title="t(qp.key)"
                                    @click="applyQuickPrompt(qp.template)"
                                />
                            </v-list>
                        </v-menu>
                    </template>
                </TaskInputCard>

                <!-- Live stream event feed with tool expansion panels -->
                <StreamEventFeed
                    :streaming="agentStore.streaming"
                    :finished="streamFinished"
                    :events="agentStore.streamEvents"
                    :color-fn="agentEventColor"
                    :summary-fn="agentEventSummary"
                >
                    <template #event="{ event }">
                        <!-- Tool events get an expandable result panel -->
                        <template v-if="event.type === 'tool'">
                            <v-expansion-panels variant="accordion" class="tool-panel">
                                <v-expansion-panel>
                                    <v-expansion-panel-title>
                                        <v-chip color="orange" size="x-small" label class="mr-2">
                                            tool
                                        </v-chip>
                                        <span class="text-body-2">{{ event.data.tool }}</span>
                                        <v-chip
                                            v-if="event.data.error"
                                            color="error"
                                            size="x-small"
                                            class="ml-2"
                                        >
                                            error
                                        </v-chip>
                                    </v-expansion-panel-title>
                                    <v-expansion-panel-text>
                                        <pre v-if="event.data.result" class="tool-result-pre">{{
                                            event.data.result
                                        }}</pre>
                                        <p
                                            v-else-if="event.data.error"
                                            class="text-error text-caption"
                                        >
                                            {{ event.data.error }}
                                        </p>
                                        <p v-else class="text-grey text-caption">
                                            {{ t('codeChat.noOutput') }}
                                        </p>
                                    </v-expansion-panel-text>
                                </v-expansion-panel>
                            </v-expansion-panels>
                        </template>

                        <!-- All other events: compact summary -->
                        <template v-else>
                            <div class="d-flex align-center ga-2">
                                <v-chip
                                    :color="agentEventColor(event.type as AgentStreamEvent['type'])"
                                    size="x-small"
                                    label
                                >
                                    {{ event.type }}
                                </v-chip>
                                <span class="text-body-2">
                                    {{ agentEventSummary(event as AgentStreamEvent) }}
                                </span>
                            </div>
                        </template>
                    </template>
                </StreamEventFeed>

                <!-- Result -->
                <ResultCard v-if="latestResult" :content="latestResult.result" />
            </v-col>

            <!-- Session history -->
            <v-col cols="12" md="5">
                <TaskHistorySidebar
                    :title="t('codeChat.history')"
                    :empty-text="t('codeChat.noHistoryYet')"
                    :items="historyItems"
                    :active-id="latestResult?.id"
                    @select="onHistorySelect"
                />
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
import type { AgentStreamEvent } from '@/api/sseEvents';
import { getWorkspaceRoot } from '@/config';

const { t } = useI18n();
const agentStore = useAgentStore();

const taskInput = ref('');
/** Default to 'code' profile for code-focused tasks */
const selectedProfile = ref<ModelProfile | 'auto'>('code');
const latestResult = ref<ITaskHistoryEntry | undefined>(undefined);
const streamFinished = ref(false);

/** Workspace root from Settings — prepended to every request. */
const workspaceRoot = getWorkspaceRoot() || undefined;

/** Quick-prompt templates that inject the workspace root. */
const quickPrompts = [
    {
        key: 'codeChat.qp.explain',
        template: 'Explain the architecture and main components of the project at {workspace}.'
    },
    {
        key: 'codeChat.qp.listFiles',
        template: 'List the main files and directory structure of {workspace}.'
    },
    {
        key: 'codeChat.qp.findBugs',
        template:
            'Review the code at {workspace} and identify potential bugs or code quality issues.'
    },
    {
        key: 'codeChat.qp.dependencies',
        template: 'What dependencies does the project at {workspace} use and what is each one for?'
    },
    {
        key: 'codeChat.qp.tests',
        template: 'List all test files in {workspace} and summarise what is being tested.'
    }
];

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

/** Apply a quick-prompt template, substituting the workspace path. */
function applyQuickPrompt(template: string): void {
    taskInput.value = template.replace('{workspace}', workspaceRoot ?? '<workspace-path>');
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

<style scoped>
/* Monospace result from tool calls */
.tool-result-pre {
    background: rgba(0, 0, 0, 0.06);
    border-radius: 6px;
    padding: 8px 12px;
    overflow-x: auto;
    font-size: 0.8rem;
    white-space: pre-wrap;
    max-height: 260px;
    overflow-y: auto;
}

/* Remove default expansion-panel styling inside timeline */
.tool-panel :deep(.v-expansion-panel) {
    box-shadow: none;
}
</style>
