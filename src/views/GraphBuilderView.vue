<template>
    <div class="graph-builder">
        <PageHeader :title="t('graphBuilder.title')" :subtitle="t('graphBuilder.subtitle')" />

        <!-- Toolbar -->
        <v-toolbar flat density="compact" color="surface" class="mb-4 rounded" border>
            <v-tooltip :text="t('graphBuilder.saveTooltip')" location="top">
                <template #activator="{ props: tooltipProps }">
                    <v-btn
                        v-bind="tooltipProps"
                        variant="tonal"
                        prepend-icon="mdi-content-save"
                        class="mr-2"
                        @click="onSave"
                    >
                        {{ t('graphBuilder.save') }}
                    </v-btn>
                </template>
            </v-tooltip>
            <v-tooltip :text="t('graphBuilder.loadTooltip')" location="top">
                <template #activator="{ props: tooltipProps }">
                    <v-btn
                        v-bind="tooltipProps"
                        variant="tonal"
                        prepend-icon="mdi-folder-open"
                        class="mr-2"
                        @click="onLoad"
                    >
                        {{ t('graphBuilder.load') }}
                    </v-btn>
                </template>
            </v-tooltip>
            <v-tooltip :text="t('graphBuilder.clearTooltip')" location="top">
                <template #activator="{ props: tooltipProps }">
                    <v-btn
                        v-bind="tooltipProps"
                        variant="tonal"
                        prepend-icon="mdi-delete"
                        class="mr-2"
                        @click="onClear"
                    >
                        {{ t('graphBuilder.clear') }}
                    </v-btn>
                </template>
            </v-tooltip>
            <v-divider vertical class="mx-2" />
            <v-tooltip :text="t('graphBuilder.executeTooltip')" location="top">
                <template #activator="{ props: tooltipProps }">
                    <v-btn
                        v-bind="tooltipProps"
                        color="primary"
                        prepend-icon="mdi-play"
                        :loading="graphStore.isExecuting"
                        @click="onExecute"
                    >
                        {{ t('graphBuilder.execute') }}
                    </v-btn>
                </template>
            </v-tooltip>
            <v-spacer />
            <v-btn
                variant="text"
                :prepend-icon="showResults ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                @click="showResults = !showResults"
            >
                {{ t('graphBuilder.results') }}
            </v-btn>
        </v-toolbar>

        <!-- Node type reference -->
        <v-alert type="info" variant="tonal" density="compact" class="mb-4" :icon="false">
            <span class="text-caption">
                <strong>{{ t('graphBuilder.nodesLabel') }}</strong>
                {{ t('graphBuilder.nodesHint') }}
            </span>
        </v-alert>

        <!-- Canvas -->
        <v-card border>
            <LiteGraphCanvas ref="canvasReference" :height="canvasHeight" />
        </v-card>

        <!-- Results panel -->
        <v-expand-transition>
            <v-card v-if="showResults" class="mt-4" border>
                <v-card-title class="d-flex align-center">
                    {{ t('graphBuilder.executionResult') }}
                    <v-spacer />
                    <v-btn
                        v-if="graphStore.executionResult"
                        icon
                        variant="text"
                        size="small"
                        @click="copyResult"
                    >
                        <v-icon>mdi-content-copy</v-icon>
                    </v-btn>
                </v-card-title>
                <v-card-text>
                    <div v-if="graphStore.executionResult" class="text-body-2 text-pre-wrap">
                        {{ graphStore.executionResult }}
                    </div>
                    <span v-else class="text-grey">
                        {{ t('graphBuilder.noResult') }}
                    </span>
                </v-card-text>
            </v-card>
        </v-expand-transition>

        <!-- Hidden file input for load -->
        <input
            ref="fileInputReference"
            type="file"
            accept=".json"
            style="display: none"
            @change="onFileSelected"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import LiteGraphCanvas from '@/components/shared/LiteGraphCanvas.vue';
import PageHeader from '@/components/shared/PageHeader.vue';
import { useGraphStore } from '@/stores/graph';
import type { IGraphData } from '@/stores/graph';
import { useNotificationsStore, TOAST_TYPE } from '@/stores/notification';

const { t } = useI18n();
const graphStore = useGraphStore();
const notificationStore = useNotificationsStore();

const canvasReference = ref<InstanceType<typeof LiteGraphCanvas>>();
const fileInputReference = ref<HTMLInputElement>();

const showResults = ref(false);

/** Vertical space (px) occupied by the app-bar, toolbar, page heading, and padding. */
const CHROME_HEIGHT_PX = 280;

/** Minimum canvas height in pixels. */
const MIN_CANVAS_HEIGHT_PX = 400;

/** Canvas height — leaves room for the toolbar and results. */
const canvasHeight = computed(() =>
    Math.max(MIN_CANVAS_HEIGHT_PX, window.innerHeight - CHROME_HEIGHT_PX)
);

/** Serialises the current graph and shows a success notification. */
function onSave(): void {
    const graph = canvasReference.value?.graph;
    if (!graph) {
        return;
    }
    graphStore.saveGraph(graph);
    const json = JSON.stringify(graphStore.graphData, undefined, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'manna-graph.json';
    anchor.click();
    URL.revokeObjectURL(url);
    notificationStore.addMessage(t('graphBuilder.savedMessage'), TOAST_TYPE.SUCCESS);
}

/** Opens the file picker so the user can load a graph JSON. */
function onLoad(): void {
    fileInputReference.value?.click();
}

/** Reads the selected file and loads it into the canvas graph. */
function onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    file.text()
        .then((text) => {
            const data = JSON.parse(text) as IGraphData;
            const graph = canvasReference.value?.graph;
            if (!graph) return;
            graphStore.loadGraph(graph, data);
            notificationStore.addMessage(t('graphBuilder.loadedMessage'), TOAST_TYPE.SUCCESS);
        })
        .catch(() => {
            notificationStore.addMessage(t('graphBuilder.loadErrorMessage'), TOAST_TYPE.DANGER);
        })
        .finally(() => {
            input.value = '';
        });
}

/** Clears all nodes from the canvas. */
function onClear(): void {
    canvasReference.value?.graph?.clear();
    graphStore.graphData = undefined;
    graphStore.executionResult = undefined;
}

/** Serialises the graph and sends it to the backend for execution. */
function onExecute(): void {
    const graph = canvasReference.value?.graph;
    if (!graph) return;
    graphStore.saveGraph(graph);
    if (!graphStore.graphData) return;
    showResults.value = true;
    graphStore.executeGraph(graphStore.graphData, true);
}

/** Copies the execution result to the clipboard. */
function copyResult(): void {
    if (!graphStore.executionResult) return;
    navigator.clipboard
        .writeText(graphStore.executionResult)
        .then(() => {
            notificationStore.addMessage(t('graphBuilder.copiedMessage'), TOAST_TYPE.SUCCESS);
        })
        .catch(() => {
            /* clipboard API may not be available */
        });
}
</script>

<style scoped>
.text-pre-wrap {
    white-space: pre-wrap;
    word-break: break-word;
}
</style>
