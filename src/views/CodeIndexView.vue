<template>
    <div>
        <h1 class="text-h4 mb-2">{{ t('codeIndex.title') }}</h1>
        <p class="text-body-2 text-grey mb-4">{{ t('codeIndex.subtitle') }}</p>

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
                    {{ t('codeIndex.changeWorkspace') }}
                </v-btn>
            </div>
        </v-alert>

        <v-alert v-else type="warning" variant="tonal" density="compact" class="mb-4">
            {{ t('codeIndex.noWorkspace') }}
            <v-btn variant="text" size="x-small" class="ml-2" :to="{ name: 'settings' }">
                {{ t('codeIndex.configureWorkspace') }}
            </v-btn>
        </v-alert>

        <v-row>
            <v-col cols="12" md="7">
                <!-- Analysis trigger card -->
                <v-card>
                    <v-card-title>
                        <v-icon start>mdi-text-search</v-icon>
                        {{ t('codeIndex.analyzeTitle') }}
                    </v-card-title>
                    <v-card-text>
                        <p class="text-body-2 mb-4">{{ t('codeIndex.analyzeDesc') }}</p>

                        <v-select
                            v-model="analysisMode"
                            :items="analysisModes"
                            :label="t('codeIndex.analysisMode')"
                            variant="outlined"
                            density="compact"
                            :hint="t('codeIndex.analysisModeHint')"
                            persistent-hint
                        />
                    </v-card-text>
                    <v-card-actions>
                        <v-btn
                            color="primary"
                            :loading="agentStore.streaming"
                            :disabled="!workspaceRoot || agentStore.streaming"
                            @click="runAnalysis"
                        >
                            <v-icon start>mdi-magnify-scan</v-icon>
                            {{ t('codeIndex.analyzeBtn') }}
                        </v-btn>
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
                                            </v-expansion-panel-text>
                                        </v-expansion-panel>
                                    </v-expansion-panels>
                                </template>
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

                <!-- Analysis result -->
                <v-card v-if="analysisResult" class="mt-4">
                    <v-card-title class="d-flex align-center">
                        {{ t('codeIndex.analysisResult') }}
                        <v-spacer />
                        <CopyButton :text="analysisResult" />
                    </v-card-title>
                    <v-card-text>
                        <MarkdownRenderer :content="analysisResult" />
                    </v-card-text>
                </v-card>
            </v-col>

            <!-- Info sidebar -->
            <v-col cols="12" md="5">
                <v-card>
                    <v-card-title>
                        <v-icon start>mdi-information-outline</v-icon>
                        {{ t('codeIndex.howItWorks') }}
                    </v-card-title>
                    <v-card-text>
                        <p class="text-body-2 mb-3">{{ t('codeIndex.howItWorksDesc') }}</p>
                        <v-list density="compact">
                            <v-list-item
                                prepend-icon="mdi-numeric-1-circle-outline"
                                :title="t('codeIndex.step1')"
                            />
                            <v-list-item
                                prepend-icon="mdi-numeric-2-circle-outline"
                                :title="t('codeIndex.step2')"
                            />
                            <v-list-item
                                prepend-icon="mdi-numeric-3-circle-outline"
                                :title="t('codeIndex.step3')"
                            />
                        </v-list>

                        <v-divider class="my-3" />

                        <!-- Phase 5 note: dedicated indexing endpoint -->
                        <v-alert type="info" variant="tonal" density="compact">
                            {{ t('codeIndex.phase5Note') }}
                        </v-alert>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAgentStore } from '@/stores/agent';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer.vue';
import CopyButton from '@/components/shared/CopyButton.vue';
import { agentEventColor, agentEventSummary } from '@/utils/eventFormatting';
import { getWorkspaceRoot } from '@/config';

const { t } = useI18n();
const agentStore = useAgentStore();

const workspaceRoot = getWorkspaceRoot() || undefined;
const streamFinished = ref(false);
const analysisResult = ref('');
const analysisMode = ref('structure');

/** Translated analysis mode options. */
const analysisModes = computed(() => [
    { title: t('codeIndex.modeStructure'), value: 'structure' },
    { title: t('codeIndex.modeDependencies'), value: 'dependencies' },
    { title: t('codeIndex.modeEntryPoints'), value: 'entrypoints' },
    { title: t('codeIndex.modeFull'), value: 'full' }
]);

/**
 * Analysis prompts keyed by mode.
 * Each prompt instructs the code-profile agent to use file tools to explore the workspace.
 */
const ANALYSIS_PROMPTS: Record<string, string> = {
    structure:
        'List the directory structure of {workspace}. Show main folders and their purposes. ' +
        'Identify the primary language/framework and key configuration files.',
    dependencies:
        'Analyse the dependencies of the project at {workspace}. ' +
        'List all direct dependencies with a one-line description of each.',
    entrypoints:
        'Find the main entry-point files of the project at {workspace} ' +
        '(e.g. main.ts, index.ts, App.vue, server.ts). Briefly explain what each one does.',
    full:
        'Perform a full project analysis of {workspace}: ' +
        '(1) directory structure, (2) main technologies, (3) entry points, ' +
        '(4) key modules/components, (5) test coverage overview.'
};

async function runAnalysis(): Promise<void> {
    if (!workspaceRoot) return;

    const prompt = (ANALYSIS_PROMPTS[analysisMode.value] ?? ANALYSIS_PROMPTS.structure).replace(
        '{workspace}',
        workspaceRoot
    );

    streamFinished.value = false;
    analysisResult.value = '';

    const entry = await agentStore.submitTaskStream(prompt, 'code', false, workspaceRoot);
    streamFinished.value = true;
    if (entry) {
        analysisResult.value = entry.result;
    }
}
</script>

<style scoped>
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

.tool-panel :deep(.v-expansion-panel) {
    box-shadow: none;
}
</style>
