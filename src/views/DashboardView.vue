<template>
    <div>
        <h1 class="text-h4 mb-4">Dashboard</h1>

        <!-- Welcome banner — gives first-time users a quick overview of what Manna offers -->
        <v-alert type="info" variant="tonal" class="mb-6" closable>
            <strong>Welcome to Manna</strong> — a local-first AI agent platform. Use the sidebar to
            access different tools: <strong>Chat</strong> for conversations,
            <strong>Agent</strong> for autonomous task execution, <strong>Swarm</strong> for
            multi-agent complex tasks, <strong>Code Tools</strong> for IDE features, and
            <strong>Upload</strong> for file analysis.
        </v-alert>

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
                        <v-chip
                            v-if="systemStore.modes.length > 0"
                            class="ml-1"
                            size="small"
                            color="secondary"
                        >
                            {{ systemStore.modes.length }}
                            {{ systemStore.modes.length === 1 ? 'mode' : 'modes' }}
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
                        <div v-for="action in quickActions" :key="action.to" class="mb-3">
                            <v-btn
                                :to="action.to"
                                :prepend-icon="action.icon"
                                variant="tonal"
                                class="mb-1"
                            >
                                {{ action.title }}
                            </v-btn>
                            <p class="text-body-2 text-grey ml-1">{{ action.description }}</p>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </div>
</template>

<script setup lang="ts">
import { useSystemStore } from '@/stores/system';
import HealthBadge from '@/components/shared/HealthBadge.vue';
import { NAV_ITEMS } from '@/utils/navigation';

const systemStore = useSystemStore();

// Quick actions = all navigable pages except Dashboard (first) and Settings (last)
const quickActions = NAV_ITEMS.filter(
    (item) => item.to !== '/' && item.to !== '/settings'
);
</script>
