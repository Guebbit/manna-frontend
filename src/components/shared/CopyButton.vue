<template>
    <v-btn
        icon
        size="small"
        variant="text"
        :color="copied ? 'success' : 'default'"
        @click="copyToClipboard"
    >
        <v-icon>{{ copied ? 'mdi-check' : 'mdi-content-copy' }}</v-icon>
        <v-tooltip activator="parent" location="top">
            {{ copied ? 'Copied!' : 'Copy' }}
        </v-tooltip>
    </v-btn>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
    text: string;
}>();

const copied = ref(false);

async function copyToClipboard(): Promise<void> {
    try {
        await navigator.clipboard.writeText(props.text);
        copied.value = true;
        setTimeout(() => {
            copied.value = false;
        }, 2000);
    } catch {
        /* clipboard API may not be available */
    }
}
</script>
