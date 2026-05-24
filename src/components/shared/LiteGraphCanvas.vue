<template>
    <div ref="containerReference" class="litegraph-container" :style="containerStyle">
        <canvas ref="canvasReference" />
    </div>
</template>

<script setup lang="ts">
/**
 * LiteGraphCanvas — mounts and manages a LiteGraph visual pipeline editor.
 *
 * Wraps the raw <canvas> in a container div to handle responsive sizing.
 * Sets canvas width/height attributes (not just CSS) so LiteGraph renders
 * at the correct resolution and context menus work properly.
 *
 * The live `graph` and `graphCanvas` instances are exposed via `defineExpose` so
 * that parent components (e.g. `GraphBuilderView`) can serialise, deserialise, and
 * execute the graph without needing direct DOM access.
 */
import { ref, shallowRef, onMounted, onUnmounted, watch } from 'vue';
import { LGraph, LGraphCanvas } from 'litegraph.js';
import 'litegraph.js/css/litegraph.css';
import { setupLiteGraph } from '@/litegraph/setup';
import { registerMannaNodes } from '@/litegraph/nodes';

const props = withDefaults(
    defineProps<{
        /** Canvas width in pixels. If omitted, fills parent width. */
        width?: number;
        /** Canvas height in pixels. Defaults to 600 px. */
        height?: number;
    }>(),
    {
        width: undefined,
        height: 600
    }
);

const containerReference = ref<HTMLDivElement>();
const canvasReference = ref<HTMLCanvasElement>();

/** CSS style for the outer container. */
const containerStyle = { width: '100%', display: 'block', position: 'relative' as const };

/** Live LiteGraph instance — held in a shallow ref to preserve reactivity. */
const graph = shallowRef<LGraph>();

/** Live LiteGraph canvas controller. */
const graphCanvas = shallowRef<LGraphCanvas>();

/** ResizeObserver to keep canvas pixel dimensions in sync with layout. */
let resizeObserver: ResizeObserver | undefined;

/**
 * Syncs the canvas element's width/height attributes with its layout size.
 * LiteGraph requires these attributes to render at the correct resolution.
 */
function syncCanvasSize(): void {
    const canvas = canvasReference.value;
    const container = containerReference.value;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const w = props.width ?? Math.round(rect.width);
    const h = props.height;

    if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
    }

    // Inform LiteGraph canvas of the new dimensions
    if (graphCanvas.value) {
        graphCanvas.value.resize(w, h);
    }
}

onMounted(() => {
    setupLiteGraph();
    registerMannaNodes();

    const element = canvasReference.value;
    if (!element) return;

    // Set initial pixel dimensions before LiteGraph reads them
    syncCanvasSize();

    graph.value = new LGraph();
    graphCanvas.value = new LGraphCanvas(element, graph.value);

    // Enable context menu (allow_searchbox enables right-click node search)
    graphCanvas.value.allow_searchbox = true;

    graph.value.start();

    // Observe container resizes to keep canvas in sync
    if (containerReference.value) {
        resizeObserver = new ResizeObserver(syncCanvasSize);
        resizeObserver.observe(containerReference.value);
    }
});

onUnmounted(() => {
    resizeObserver?.disconnect();
    resizeObserver = undefined;
    graph.value?.stop();
    graph.value = undefined;
    graphCanvas.value = undefined;
});

// Re-sync when height prop changes
watch(
    () => props.height,
    () => syncCanvasSize()
);

defineExpose({ graph, graphCanvas });
</script>

<style scoped>
.litegraph-container canvas {
    display: block;
    width: 100%;
}
</style>
