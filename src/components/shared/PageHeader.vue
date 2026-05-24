<template>
    <!-- Reusable page title + subtitle block -->
    <div class="mb-4">
        <h1 class="text-h4 mb-2">
            <slot>{{ title }}</slot>
        </h1>
        <p v-if="subtitle || $slots.subtitle" class="text-body-2 text-grey">
            <slot name="subtitle">{{ subtitle }}</slot>
        </p>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    /** Page title text */
    title?: string;
    /** Optional subtitle below the title */
    subtitle?: string;
}>();
</script>
