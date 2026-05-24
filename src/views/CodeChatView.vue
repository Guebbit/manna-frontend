<template>
    <div>
        <h1 class="text-h4 mb-2">{{ t('codeChat.title') }}</h1>
        <p class="text-body-2 text-grey mb-4">{{ t('codeChat.subtitle') }}</p>

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
                <!-- Task input card -->
                <v-card>
                    <v-card-title>{{ t('codeChat.askAboutCode') }}</v-card-title>
                    <v-card-text>
                        <v-textarea
                            v-model="taskInput"
                            :label="t('codeChat.taskLabel')"
                            :placeholder="t('codeChat.taskPlaceholder')"
                            variant="outlined"
                            rows="4"
                            auto-grow
                            :hint="t('codeChat.taskHint')"
                            persistent-hint
                        />

                        <v-row class="mt-2" align="center">
                            <v-col cols="12" sm="6">
                                <v-select
                                    v-model="selectedProfile"
                                    :items="profileOptions"
                                    :label="t('codeChat.modelProfile')"
                                    variant="outlined"
                                    density="compact"
                                />
                            </v-col>
                            <v-col cols="auto">
                                <v-tooltip
                                    :text="t('codeChat.allowWriteTooltip')"
                                    location="top"
                                    max-width="320"
                                >
                                    <template #activator="{ props: tooltipProps }">
                                        <v-switch
                                            v-bind="tooltipProps"
                                            v-model="allowWrite"
                                            :label="t('codeChat.allowWrite')"
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
                    </v-card-actions>
                </v-card>

                <!-- Live stream event feed -->
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
                    <v-card-text>
                        <v-timeline density="compact" side="end">
                            <v-timeline-item
                                v-for="(event, index) in agentStore.streamEvents"
                                :key="index"
                                :dot-color="agentEventColor(event.type)"
                                size="small"
                            >
                                <!-- Tool events get an expandable result panel -->
                                <template v-if="event.type === 'tool'">
                                    <v-expansion-panels variant="accordion" class="tool-panel">
                                        <v-expansion-panel>
                                            <v-expansion-panel-title>
                                                <v-chip
                                                    color="orange"
                                                    size="x-small"
                                                    label
                                                    class="mr-2"
                                                >
                                                    tool
                                                </v-chip>
                                                <span class="text-body-2">{{
                                                    event.data.tool
                                                }}</span>
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
                                                <pre
                                                    v-if="event.data.result"
                                                    class="tool-result-pre"
                                                    >{{ event.data.result }}</pre
                                                >
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
                                            :color="agentEventColor(event.type)"
                                            size="x-small"
                                            label
                                        >
                                            {{ event.type }}
                                        </v-chip>
                                        <span class="text-body-2">
                                            {{ agentEventSummary(event) }}
                                        </span>
                                    </div>
                                </template>
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

            <!-- Session history -->
            <v-col cols="12" md="5">
                <v-card>
                    <v-card-title>{{ t('codeChat.history') }}</v-card-title>
                    <v-card-text v-if="agentStore.taskHistory.length === 0" class="text-grey">
                        {{ t('codeChat.noHistoryYet') }}
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
                                <v-chip
                                    v-if="entry.workspaceRoot"
                                    size="x-small"
                                    color="info"
                                    class="ml-1"
                                    :title="entry.workspaceRoot"
                                >
                                    <v-icon size="x-small">mdi-folder</v-icon>
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
import { getWorkspaceRoot } from '@/config';

const { t } = useI18n();
const agentStore = useAgentStore();
const profileOptions = useProfileOptions();

const taskInput = ref('');
/** Default to 'code' profile for code-focused tasks */
const selectedProfile = ref<ModelProfile | 'auto'>('code');
const allowWrite = ref(false);
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

function submitStream(): void {
    const task = taskInput.value.trim();
    if (!task) return;

    streamFinished.value = false;
    const profile = selectedProfile.value === 'auto' ? undefined : selectedProfile.value;
    agentStore.submitTaskStream(task, profile, allowWrite.value, workspaceRoot).then((result) => {
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
