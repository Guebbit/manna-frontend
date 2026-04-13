<template>
    <div class="d-flex align-center justify-center fill-height" style="min-height: 60vh">
        <div class="text-center">
            <v-icon size="80" color="grey">mdi-alert-circle-outline</v-icon>
            <h1 class="text-h4 mt-4 mb-2">{{ title }}</h1>
            <p class="text-body-1 text-grey mb-6">{{ description }}</p>
            <v-btn to="/" variant="tonal" prepend-icon="mdi-home"> Go to Dashboard </v-btn>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const title = computed(() => {
    const code = route.query.code;
    if (code === '500') return 'Server Error';
    return 'Page Not Found';
});

const description = computed(() => {
    const code = route.query.code;
    if (code === '500') return 'Something went wrong on the server.';
    return 'The page you are looking for does not exist.';
});
</script>
