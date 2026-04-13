<template>
    <div class="graph-builder">
        <h1 class="text-h4 mb-4">Graph Builder</h1>

        <!-- Toolbar -->
        <v-toolbar flat density="compact" color="surface" class="mb-4 rounded" border>
            <v-btn
                variant="tonal"
                prepend-icon="mdi-content-save"
                class="mr-2"
                @click="onSave"
            >
                Save
            </v-btn>
            <v-btn
                variant="tonal"
                prepend-icon="mdi-folder-open"
                class="mr-2"
                @click="onLoad"
            >
                Load
            </v-btn>
            <v-btn
                variant="tonal"
                prepend-icon="mdi-delete"
                class="mr-2"
                @click="onClear"
            >
                Clear
            </v-btn>
            <v-divider vertical class="mx-2" />
            <v-switch
                v-model="allowWrite"
                label="Allow write"
                color="warning"
                density="compact"
                hide-details
                class="mr-4"
            />
            <v-btn
                color="primary"
                prepend-icon="mdi-play"
                :loading="graphStore.isExecuting"
                @click="onExecute"
            >
                Execute
            </v-btn>
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
                    <div
                        v-if="graphStore.executionResult"
                        class="text-body-2 text-pre-wrap"
                    >
                        {{ graphStore.executionResult }}
                    </div>
                    <span v-else class="text-grey">No result yet. Execute the graph to see output here.</span>
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

/** Canvas height — leaves room for the toolbar and results. */
const canvasHeight = computed(() => Math.max(400, window.innerHeight - 280));

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
