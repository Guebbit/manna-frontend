<template>
    <div>
        <h1 class="text-h4 mb-6">Dashboard</h1>

        <v-row>
            <!-- Health Card -->
            <v-col cols="12" md="4">
                <v-card>
                    <v-card-title>
                        <v-icon start>mdi-heart-pulse</v-icon>
                        System Health
                    </v-card-title>
                    <v-card-text>
                        <div class="d-flex align-center ga-3">
                            <HealthBadge :is-online="!!systemStore.health" />
                            <span v-if="systemStore.health" class="text-caption">
                                Last check: {{ systemStore.health.timestamp }}
                            </span>
                            <span v-else class="text-caption text-error">
                                {{ systemStore.healthError || 'Not connected' }}
                            </span>
                        </div>
                    </v-card-text>
                    <v-card-actions>
                        <v-btn
                            variant="text"
                            :loading="systemStore.healthLoading"
                            @click="systemStore.fetchHealth()"
                        >
                            Refresh
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>

            <!-- Models Card -->
            <v-col cols="12" md="4">
                <v-card>
                    <v-card-title>
                        <v-icon start>mdi-brain</v-icon>
                        Models
                        <v-chip class="ml-2" size="small" color="primary">
                            {{ systemStore.models.length }}
                        </v-chip>
                    </v-card-title>
                    <v-card-text>
                        <v-chip
                            v-for="model in systemStore.models"
                            :key="model.id"
                            class="mr-1 mb-1"
                            size="small"
                            variant="outlined"
                        >
                            {{ model.id }}
                        </v-chip>
                        <p v-if="systemStore.models.length === 0" class="text-grey">
                            No models loaded
                        </p>
                    </v-card-text>
                    <v-card-actions>
                        <v-btn
                            variant="text"
                            :loading="systemStore.modelsLoading"
                            @click="systemStore.fetchModels()"
                        >
                            Refresh
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>

            <!-- Quick Actions -->
            <v-col cols="12" md="4">
                <v-card>
                    <v-card-title>
                        <v-icon start>mdi-lightning-bolt</v-icon>
                        Quick Actions
                    </v-card-title>
                    <v-card-text>
                        <v-btn
                            v-for="action in quickActions"
                            :key="action.to"
                            :to="action.to"
                            :prepend-icon="action.icon"
                            variant="tonal"
                            class="mr-2 mb-2"
                        >
                            {{ action.label }}
                        </v-btn>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </div>
</template>

<script setup lang="ts">
import { useSystemStore } from '@/stores/system';
import HealthBadge from '@/components/shared/HealthBadge.vue';

const systemStore = useSystemStore();

const quickActions = [
    { label: 'Chat', icon: 'mdi-chat', to: '/chat' },
    { label: 'Agent', icon: 'mdi-robot', to: '/agent' },
    { label: 'Code', icon: 'mdi-code-braces', to: '/code' },
    { label: 'Upload', icon: 'mdi-upload', to: '/upload' },
    { label: 'Sketch', icon: 'mdi-palette', to: '/sketch' }
];
</script>
