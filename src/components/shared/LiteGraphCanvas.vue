<template>
    <canvas ref="canvasReference" :style="canvasStyle" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
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

let graph: LGraph | undefined;
let graphCanvas: LGraphCanvas | undefined;

onMounted(() => {
    setupLiteGraph();
    registerMannaNodes();

    const element = canvasReference.value;
    if (!element) {
        return;
    }

    graph = new LGraph();
    graphCanvas = new LGraphCanvas(element, graph);
    graph.start();
});

onUnmounted(() => {
    graph?.stop();
    graph = undefined;
    graphCanvas = undefined;
});

defineExpose({ graph, graphCanvas });
</script>
