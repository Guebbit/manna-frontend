<template>
    <div class="graph-builder">
        <h1 class="text-h4 mb-2">Graph Builder</h1>
        <p class="text-body-2 text-grey mb-4">
            Build visual pipelines with a node graph editor. Connect nodes to define multi-step
            workflows, then execute them on the backend via the agent loop.
        </p>

        <!-- Toolbar -->
        <v-toolbar flat density="compact" color="surface" class="mb-4 rounded" border>
            <v-tooltip text="Download the current graph as a JSON file." location="top">
                <template #activator="{ props: tooltipProps }">
                    <v-btn
                        v-bind="tooltipProps"
                        variant="tonal"
                        prepend-icon="mdi-content-save"
                        class="mr-2"
                        @click="onSave"
                    >
                        Save
                    </v-btn>
                </template>
            </v-tooltip>
            <v-tooltip text="Import a previously saved graph JSON file." location="top">
                <template #activator="{ props: tooltipProps }">
                    <v-btn
                        v-bind="tooltipProps"
                        variant="tonal"
                        prepend-icon="mdi-folder-open"
                        class="mr-2"
                        @click="onLoad"
                    >
                        Load
                    </v-btn>
                </template>
            </v-tooltip>
            <v-tooltip text="Remove all nodes and connections from the canvas." location="top">
                <template #activator="{ props: tooltipProps }">
                    <v-btn
                        v-bind="tooltipProps"
                        variant="tonal"
                        prepend-icon="mdi-delete"
                        class="mr-2"
                        @click="onClear"
                    >
                        Clear
                    </v-btn>
                </template>
            </v-tooltip>
            <v-divider vertical class="mx-2" />
            <v-tooltip
                text="⚠ When enabled, the agent executing this graph can create, modify, and delete files on the server's filesystem."
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
                        class="mr-4"
                    />
                </template>
            </v-tooltip>
            <v-tooltip
                text="Serialises the graph and sends it to the agent for execution. Results appear in the panel below."
                location="top"
            >
                <template #activator="{ props: tooltipProps }">
                    <v-btn
                        v-bind="tooltipProps"
                        color="primary"
                        prepend-icon="mdi-play"
                        :loading="graphStore.isExecuting"
                        @click="onExecute"
                    >
                        Execute
                    </v-btn>
                </template>
            </v-tooltip>
            <v-spacer />
            <v-btn
                variant="text"
                :prepend-icon="showResults ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                @click="showResults = !showResults"
            >
                Results
            </v-btn>
        </v-toolbar>

        <!-- Canvas -->
        <v-card border>
            <LiteGraphCanvas ref="canvasReference" :height="canvasHeight" />
        </v-card>

        <!-- Results panel -->
        <v-expand-transition>
            <v-card v-if="showResults" class="mt-4" border>
                <v-card-title class="d-flex align-center">
                    Execution Result
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
                        No result yet. Build a graph with nodes and edges, then click
                        <strong>Execute</strong> to run the pipeline on the backend.
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
import LiteGraphCanvas from '@/components/shared/LiteGraphCanvas.vue';
import { useGraphStore } from '@/stores/graph';
import type { IGraphData } from '@/stores/graph';
import { useNotificationsStore, TOAST_TYPE } from '@/stores/notification';

const graphStore = useGraphStore();
const notificationStore = useNotificationsStore();

const canvasReference = ref<InstanceType<typeof LiteGraphCanvas>>();
const fileInputReference = ref<HTMLInputElement>();

const allowWrite = ref(false);
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
    notificationStore.addMessage('Graph saved', TOAST_TYPE.SUCCESS);
}

/** Opens the file picker so the user can load a graph JSON. */
function onLoad(): void {
    fileInputReference.value?.click();
}

/** Reads the selected file and loads it into the canvas graph. */
async function onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
        return;
    }
    try {
        const text = await file.text();
        const data = JSON.parse(text) as IGraphData;
        const graph = canvasReference.value?.graph;
        if (!graph) {
            return;
        }
        graphStore.loadGraph(graph, data);
        notificationStore.addMessage('Graph loaded', TOAST_TYPE.SUCCESS);
    } catch {
        notificationStore.addMessage('Failed to parse graph JSON', TOAST_TYPE.DANGER);
    }
    input.value = '';
}

/** Clears all nodes from the canvas. */
function onClear(): void {
    canvasReference.value?.graph?.clear();
    graphStore.graphData = undefined;
    graphStore.executionResult = undefined;
}

/** Serialises the graph and sends it to the backend for execution. */
async function onExecute(): Promise<void> {
    const graph = canvasReference.value?.graph;
    if (!graph) {
        return;
    }
    graphStore.saveGraph(graph);
    if (!graphStore.graphData) {
        return;
    }
    showResults.value = true;
    await graphStore.executeGraph(graphStore.graphData, allowWrite.value);
}

/** Copies the execution result to the clipboard. */
async function copyResult(): Promise<void> {
    if (!graphStore.executionResult) {
        return;
    }
    await navigator.clipboard.writeText(graphStore.executionResult);
    notificationStore.addMessage('Copied to clipboard', TOAST_TYPE.SUCCESS);
}
</script>

<style scoped>
.text-pre-wrap {
    white-space: pre-wrap;
    word-break: break-word;
}
</style>
