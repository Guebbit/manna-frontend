<template>
    <v-chip :color="isOnline ? 'success' : 'error'" size="small" variant="flat">
        <v-icon start size="x-small">
            {{ isOnline ? 'mdi-check-circle' : 'mdi-alert-circle' }}
        </v-icon>
        {{ isOnline ? 'Online' : 'Offline' }}
    </v-chip>
</template>

<script setup lang="ts">
defineProps<{
    isOnline: boolean;
}>();
</script>
