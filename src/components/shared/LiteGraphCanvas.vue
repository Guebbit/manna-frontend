<template>
    <canvas ref="canvasReference" :style="canvasStyle" />
</template>

<script setup lang="ts">
/**
 * LiteGraphCanvas — mounts and manages a LiteGraph visual pipeline editor.
 *
 * On mount, registers all Manna-specific custom nodes (text input, LLM generate,
 * shell, read/write file, browser fetch, semantic search, text output) and
 * initialises a `LGraph` + `LGraphCanvas` instance bound to the `<canvas>` element.
 *
 * The live `graph` and `graphCanvas` instances are exposed via `defineExpose` so
 * that parent components (e.g. `GraphBuilderView`) can serialise, deserialise, and
 * execute the graph without needing direct DOM access.
 *
 * @prop width  - Canvas width in pixels.  Defaults to `100%` of the parent element.
 * @prop height - Canvas height in pixels.  Defaults to `600`.
 */
import { ref, computed, shallowRef, onMounted, onUnmounted } from 'vue';
import { LGraph, LGraphCanvas } from 'litegraph.js';
import 'litegraph.js/css/litegraph.css';
import { setupLiteGraph } from '@/litegraph/setup';
import { registerMannaNodes } from '@/litegraph/nodes';

/** Props controlling the canvas dimensions. */
const props = withDefaults(
    defineProps<{
        /** Canvas width in pixels. Defaults to 100% of the parent element. */
        width?: number;
        /** Canvas height in pixels. Defaults to 600 px. */
        height?: number;
    }>(),
    {
        width: undefined,
        height: 600,
    }
);

const canvasReference = ref<HTMLCanvasElement>();

const canvasStyle = computed(() => ({
    width: props.width ? `${props.width}px` : '100%',
    height: `${props.height}px`,
    display: 'block',
}));

/** Live LiteGraph instance — held in a shallow ref to preserve reactivity. */
const graph = shallowRef<LGraph>();

/** Live LiteGraph canvas controller. */
const graphCanvas = shallowRef<LGraphCanvas>();

onMounted(() => {
    setupLiteGraph();
    registerMannaNodes();

    const element = canvasReference.value;
    if (!element) {
        return;
    }

    graph.value = new LGraph();
    graphCanvas.value = new LGraphCanvas(element, graph.value);
    graph.value.start();
});

onUnmounted(() => {
    graph.value?.stop();
    graph.value = undefined;
    graphCanvas.value = undefined;
});

defineExpose({ graph, graphCanvas });
</script>
