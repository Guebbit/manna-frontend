<template>
    <div>
        <PageHeader :title="t('dashboard.title')" />

        <v-alert type="info" variant="tonal" class="mb-6" closable>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <span v-html="t('dashboard.welcomeHtml')" />
        </v-alert>

        <v-row>
            <!-- Health Card -->
            <v-col cols="12" md="4">
                <v-card>
                    <v-card-title>
                        <v-icon start>mdi-heart-pulse</v-icon>
                        {{ t('dashboard.systemHealth') }}
                    </v-card-title>
                    <v-card-text>
                        <div class="d-flex align-center ga-3">
                            <HealthBadge :is-online="!!systemStore.health" />
                            <span v-if="systemStore.health" class="text-caption">
                                {{
                                    t('dashboard.lastCheck', {
                                        timestamp: systemStore.health.timestamp
                                    })
                                }}
                            </span>
                            <span v-else class="text-caption text-error">
                                {{ systemStore.healthError || t('dashboard.notConnected') }}
                            </span>
                        </div>
                    </v-card-text>
                    <v-card-actions>
                        <v-btn
                            variant="text"
                            :loading="systemStore.healthLoading"
                            @click="systemStore.fetchHealth()"
                        >
                            {{ t('common.refresh') }}
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>

            <!-- Models Card -->
            <v-col cols="12" md="4">
                <v-card>
                    <v-card-title>
                        <v-icon start>mdi-brain</v-icon>
                        {{ t('dashboard.models') }}
                        <v-chip class="ml-2" size="small" color="primary">
                            {{ systemStore.models.length }}
                        </v-chip>
                        <v-chip
                            v-if="systemStore.modes.length > 0"
                            class="ml-1"
                            size="small"
                            color="secondary"
                        >
                            {{ t('common.mode', systemStore.modes.length) }}
                        </v-chip>
                    </v-card-title>
                    <v-card-text>
                        <v-chip
                            v-for="model in systemStore.models"
                            :key="model.name"
                            class="mr-1 mb-1"
                            size="small"
                            variant="outlined"
                        >
                            {{ model.name }}
                        </v-chip>
                        <p v-if="systemStore.models.length === 0" class="text-grey">
                            {{ t('dashboard.noModelsLoaded') }}
                        </p>
                    </v-card-text>
                    <v-card-actions>
                        <v-btn
                            variant="text"
                            :loading="systemStore.modelsLoading"
                            @click="systemStore.fetchModels()"
                        >
                            {{ t('common.refresh') }}
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>

            <!-- Quick Actions -->
            <v-col cols="12" md="4">
                <v-card>
                    <v-card-title>
                        <v-icon start>mdi-lightning-bolt</v-icon>
                        {{ t('dashboard.quickActions') }}
                    </v-card-title>
                    <v-card-text>
                        <div v-for="action in quickActions" :key="action.title" class="mb-3">
                            <v-btn
                                :to="action.to"
                                :prepend-icon="action.icon"
                                variant="tonal"
                                class="mb-1"
                            >
                                {{ t(action.title) }}
                            </v-btn>
                            <p class="text-body-2 text-grey ml-1">{{ t(action.description) }}</p>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useSystemStore } from '@/stores/system';
import HealthBadge from '@/components/shared/HealthBadge.vue';
import PageHeader from '@/components/shared/PageHeader.vue';
import { NAV_ITEMS } from '@/utils/navigation';

const { t } = useI18n();
const systemStore = useSystemStore();

// Dashboard shows all pages except the first (Dashboard itself) and last (Settings)
const quickActions = NAV_ITEMS.slice(1, -1);
</script>
