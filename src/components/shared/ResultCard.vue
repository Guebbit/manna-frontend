<template>
    <!-- Shared result display card with markdown rendering and copy button -->
    <v-card v-if="content" class="mt-4">
        <v-card-title class="d-flex align-center">
            <slot name="title">{{ cardTitle }}</slot>
            <v-spacer />
            <slot name="chips" />
            <CopyButton :text="content" class="ml-2" />
        </v-card-title>
        <v-card-text>
            <MarkdownRenderer :content="content" />
        </v-card-text>
        <slot name="extra" />
    </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import MarkdownRenderer from './MarkdownRenderer.vue';
import CopyButton from './CopyButton.vue';

const props = withDefaults(
    defineProps<{
        /** Markdown content to render */
        content?: string;
        /** Card title */
        title?: string;
    }>(),
    {
        content: undefined,
        title: undefined
    }
);

const { t } = useI18n();

const cardTitle = computed(() => props.title ?? t('common.result'));
</script>
