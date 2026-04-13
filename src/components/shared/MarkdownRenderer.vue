<template>
    <div class="markdown-renderer" v-html="rendered"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';

const props = defineProps<{
    content: string;
}>();

const markedInstance = new Marked(
    markedHighlight({
        emptyLangClass: 'hljs',
        langPrefix: 'hljs language-',
        highlight(code: string, lang: string) {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, { language }).value;
        }
    })
);

const rendered = computed(() => {
    if (!props.content) return '';
    return markedInstance.parse(props.content, { async: false }) as string;
});
</script>

<style>
.markdown-renderer pre {
    background: #1e1e1e;
    border-radius: 8px;
    padding: 16px;
    overflow-x: auto;
    margin: 8px 0;
}

.markdown-renderer code {
    font-family: 'Fira Code', 'Cascadia Code', monospace;
    font-size: 0.875rem;
}

.markdown-renderer p code {
    background: rgba(var(--v-theme-on-surface), 0.08);
    padding: 2px 6px;
    border-radius: 4px;
}

.markdown-renderer table {
    border-collapse: collapse;
    width: 100%;
    margin: 8px 0;
}

.markdown-renderer th,
.markdown-renderer td {
    border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
    padding: 8px 12px;
    text-align: left;
}

.markdown-renderer blockquote {
    border-left: 4px solid rgb(var(--v-theme-primary));
    padding-left: 16px;
    margin: 8px 0;
    opacity: 0.85;
}
</style>
