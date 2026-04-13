<template>
    <v-app>
        <AppSidebar v-model="drawerOpen" :rail="railMode" @update:rail="railMode = $event" />

        <v-app-bar flat density="compact" color="surface">
            <v-app-bar-title class="text-h6">
                <v-icon class="mr-1">mdi-creation</v-icon>
                Manna
            </v-app-bar-title>
            <v-spacer />
            <v-btn icon variant="text" @click="toggleTheme">
                <v-icon>
                    {{ isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}
                </v-icon>
            </v-btn>
        </v-app-bar>

        <v-main>
            <v-container fluid class="pa-4 pa-md-6">
                <router-view />
            </v-container>
        </v-main>

        <!-- Global notification snackbars -->
        <v-snackbar
            v-for="notification in notificationStore.messages"
            :key="notification.id"
            :model-value="notification.visible"
            :color="notification.type"
            location="bottom right"
            @update:model-value="notificationStore.hideMessage(notification.id)"
        >
            {{ notification.message }}
            <template #actions>
                <v-btn variant="text" @click="notificationStore.hideMessage(notification.id)">
                    Close
                </v-btn>
            </template>
        </v-snackbar>
    </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useTheme } from 'vuetify';
import { useSystemStore } from '@/stores/system';
export { useNotificationsStore } from '@guebbit/vue-toolkit';
import AppSidebar from '@/components/layout/AppSidebar.vue';

const systemStore = useSystemStore();
const notificationStore = useNotificationsStore();
const theme = useTheme();

const drawerOpen = ref(true);
const railMode = ref(false);

const isDark = ref(theme.global.current.value.dark);

function toggleTheme(): void {
    theme.global.name.value = isDark.value ? 'light' : 'dark';
    isDark.value = !isDark.value;
}

// Health polling
let healthTimer: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
    void systemStore.fetchHealth();
    void systemStore.fetchModels();
    healthTimer = setInterval(() => {
        void systemStore.fetchHealth();
    }, 30_000);
});

onUnmounted(() => {
    if (healthTimer) clearInterval(healthTimer);
});
</script>
