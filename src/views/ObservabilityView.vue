<template>
    <div>
        <h1 class="text-h4 mb-2">{{ t('observability.title') }}</h1>
        <p class="text-body-2 text-grey mb-4">{{ t('observability.subtitle') }}</p>

        <!-- Toolbar: status + actions + severity counters -->
        <v-card class="mb-4">
            <v-card-text>
                <div class="d-flex align-center flex-wrap ga-3">
                    <!-- Status chip -->
                    <v-chip
                        :color="connectionChipColor"
                        size="small"
                        :prepend-icon="connectionChipIcon"
                    >
                        {{ t(`observability.state.${store.connectionState}`) }}
                    </v-chip>

                    <!-- Load / Refresh -->
                    <v-btn
                        color="primary"
                        variant="tonal"
                        size="small"
                        prepend-icon="mdi-refresh"
                        :loading="store.connectionState === 'connecting'"
                        @click="store.loadHistory()"
                    >
                        {{ t('observability.refresh') }}
                    </v-btn>

                    <!-- Enable / Disable long-poll -->
                    <v-btn
                        :color="store.pollingEnabled ? 'warning' : 'secondary'"
                        variant="tonal"
                        size="small"
                        :prepend-icon="store.pollingEnabled ? 'mdi-pause' : 'mdi-sync'"
                        @click="store.pollingEnabled ? store.stopPolling() : store.startPolling()"
                    >
                        {{
                            store.pollingEnabled
                                ? t('observability.stopPolling')
                                : t('observability.startPolling')
                        }}
                    </v-btn>

                    <!-- Export -->
                    <v-btn
                        variant="tonal"
                        size="small"
                        prepend-icon="mdi-download"
                        :disabled="store.entries.length === 0"
                        @click="store.exportHistory()"
                    >
                        {{ t('observability.export') }}
                    </v-btn>

                    <!-- Clear -->
                    <v-btn
                        variant="tonal"
                        size="small"
                        color="error"
                        prepend-icon="mdi-delete-sweep"
                        :disabled="store.entries.length === 0"
                        @click="store.clearHistory()"
                    >
                        {{ t('observability.clear') }}
                    </v-btn>

                    <v-spacer />

                    <!-- Severity counters -->
                    <v-chip size="x-small" color="error" variant="tonal" class="ml-1">
                        {{ store.severityCounts.error }} errors
                    </v-chip>
                    <v-chip size="x-small" color="warning" variant="tonal" class="ml-1">
                        {{ store.severityCounts.warning }} warn
                    </v-chip>
                    <v-chip size="x-small" color="success" variant="tonal" class="ml-1">
                        {{ store.severityCounts.success }} ok
                    </v-chip>
                </div>

                <!-- Filter row -->
                <v-row class="mt-2" dense>
                    <v-col cols="12" sm="4">
                        <v-text-field
                            v-model="store.filters.query"
                            :label="t('observability.search')"
                            variant="outlined"
                            density="compact"
                            prepend-inner-icon="mdi-magnify"
                            clearable
                            hide-details
                        />
                    </v-col>
                    <v-col cols="12" sm="3">
                        <v-select
                            v-model="store.filters.kinds"
                            :items="availableKinds"
                            :label="t('observability.filterKind')"
                            variant="outlined"
                            density="compact"
                            multiple
                            clearable
                            hide-details
                        />
                    </v-col>
                    <v-col cols="12" sm="2">
                        <v-select
                            v-model="store.filters.severities"
                            :items="severityOptions"
                            :label="t('observability.filterSeverity')"
                            variant="outlined"
                            density="compact"
                            multiple
                            clearable
                            hide-details
                        />
                    </v-col>
                    <v-col cols="12" sm="3">
                        <v-select
                            v-model="store.filters.sources"
                            :items="sourceOptions"
                            :label="t('observability.filterSource')"
                            variant="outlined"
                            density="compact"
                            multiple
                            clearable
                            hide-details
                        />
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>

        <!-- Error alert -->
        <v-alert
            v-if="store.connectionError"
            type="error"
            variant="tonal"
            density="compact"
            class="mb-4"
            closable
        >
            {{ store.connectionError }}
        </v-alert>

        <!-- Two-pane body: entry list + inspector -->
        <v-row>
            <!-- Left: Entry list -->
            <v-col cols="12" :md="store.selectedEntry ? 7 : 12">
                <v-card>
                    <v-card-title class="d-flex align-center">
                        <v-icon start>mdi-format-list-bulleted</v-icon>
                        {{ t('observability.entries') }}
                        <v-chip class="ml-2" size="small" color="primary">
                            {{ store.filteredEntries.length }}
                        </v-chip>
                        <v-spacer />
                        <v-btn
                            v-if="
                                store.filters.kinds.length > 0 ||
                                store.filters.severities.length > 0 ||
                                store.filters.sources.length > 0 ||
                                store.filters.query
                            "
                            variant="text"
                            size="small"
                            @click="store.resetFilters()"
                        >
                            {{ t('observability.resetFilters') }}
                        </v-btn>
                    </v-card-title>
                    <v-card-text class="entry-list-container">
                        <v-table v-if="store.filteredEntries.length > 0" density="compact" hover>
                            <thead>
                                <tr>
                                    <th style="width: 130px">
                                        {{ t('observability.colTime') }}
                                    </th>
                                    <th style="width: 160px">
                                        {{ t('observability.colKind') }}
                                    </th>
                                    <th style="width: 80px">
                                        {{ t('observability.colSource') }}
                                    </th>
                                    <th>{{ t('observability.colSummary') }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="entry in displayedEntries"
                                    :key="entry.id"
                                    :class="{
                                        'bg-blue-lighten-5': entry.id === store.selectedEntryId
                                    }"
                                    class="cursor-pointer"
                                    @click="store.selectEntry(entry.id)"
                                >
                                    <td class="text-caption text-no-wrap">
                                        {{ formatEntryTime(entry.timestamp) }}
                                    </td>
                                    <td>
                                        <v-chip
                                            :color="eventTypeColor(entry.kind)"
                                            size="x-small"
                                            label
                                        >
                                            {{ entry.kind }}
                                        </v-chip>
                                    </td>
                                    <td class="text-caption">{{ entry.source }}</td>
                                    <td class="text-body-2 text-truncate" style="max-width: 400px">
                                        {{ entry.summary }}
                                    </td>
                                </tr>
                            </tbody>
                        </v-table>
                        <!-- Empty state -->
                        <div v-else class="text-center pa-6">
                            <v-icon size="48" color="grey-lighten-1">mdi-history</v-icon>
                            <p class="text-grey mt-2">
                                {{
                                    store.connectionState === 'disconnected'
                                        ? t('observability.noEntriesHint')
                                        : t('observability.noEntries')
                                }}
                            </p>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>

            <!-- Right: Inspector pane -->
            <v-col v-if="store.selectedEntry" cols="12" md="5">
                <v-card>
                    <v-card-title class="d-flex align-center">
                        <v-icon start>mdi-magnify-scan</v-icon>
                        {{ t('observability.inspector') }}
                        <v-spacer />
                        <v-btn
                            icon
                            variant="text"
                            size="small"
                            @click="store.selectEntry(undefined)"
                        >
                            <v-icon>mdi-close</v-icon>
                        </v-btn>
                    </v-card-title>
                    <v-card-text>
                        <!-- Kind / severity / source chips -->
                        <div class="d-flex flex-wrap ga-2 mb-3">
                            <v-chip
                                :color="eventTypeColor(store.selectedEntry.kind)"
                                size="small"
                                label
                            >
                                {{ store.selectedEntry.kind }}
                            </v-chip>
                            <v-chip
                                :color="severityColor(store.selectedEntry.severity)"
                                size="small"
                            >
                                {{ store.selectedEntry.severity }}
                            </v-chip>
                            <v-chip size="small" variant="outlined">
                                {{ store.selectedEntry.source }}
                            </v-chip>
                            <v-chip
                                v-if="store.selectedEntry.status"
                                size="small"
                                variant="tonal"
                                color="secondary"
                            >
                                {{ store.selectedEntry.status }}
                            </v-chip>
                            <v-chip
                                v-if="store.selectedEntry.toolName"
                                size="small"
                                color="orange"
                                label
                            >
                                {{ store.selectedEntry.toolName }}
                            </v-chip>
                        </div>

                        <!-- Metadata list -->
                        <v-list density="compact" class="mb-3">
                            <v-list-item>
                                <v-list-item-title class="text-caption">
                                    {{ t('observability.timestamp') }}
                                </v-list-item-title>
                                <v-list-item-subtitle>
                                    {{ store.selectedEntry.timestamp }}
                                </v-list-item-subtitle>
                            </v-list-item>
                            <v-list-item>
                                <v-list-item-title class="text-caption">
                                    {{ t('observability.entryId') }}
                                </v-list-item-title>
                                <v-list-item-subtitle class="text-caption font-weight-medium">
                                    {{ store.selectedEntry.id }}
                                </v-list-item-subtitle>
                            </v-list-item>
                            <v-list-item
                                v-if="Object.keys(store.selectedEntry.correlationIds).length > 0"
                            >
                                <v-list-item-title class="text-caption">
                                    {{ t('observability.correlationIds') }}
                                </v-list-item-title>
                                <v-list-item-subtitle>
                                    <v-chip
                                        v-for="(value, key) in store.selectedEntry.correlationIds"
                                        :key="key"
                                        size="x-small"
                                        variant="outlined"
                                        class="mr-1 mb-1"
                                    >
                                        {{ key }}: {{ value }}
                                    </v-chip>
                                </v-list-item-subtitle>
                            </v-list-item>
                        </v-list>

                        <!-- Raw data payload -->
                        <div class="d-flex align-center mb-1">
                            <span class="text-caption font-weight-bold">
                                {{ t('observability.rawPayload') }}
                            </span>
                            <v-spacer />
                            <CopyButton :text="formattedPayload" />
                        </div>
                        <pre class="json-block">{{ formattedPayload }}</pre>

                        <!-- Meta / metrics block -->
                        <template v-if="store.selectedEntry.rawMeta">
                            <div class="d-flex align-center mb-1 mt-3">
                                <span class="text-caption font-weight-bold">
                                    {{ t('observability.meta') }}
                                </span>
                            </div>
                            <pre class="json-block">{{ formattedMeta }}</pre>
                        </template>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useObservabilityStore } from '@/stores/observability';
import { eventTypeColor, severityColor } from '@/utils/observabilityFormatting';
import CopyButton from '@/components/shared/CopyButton.vue';

const { t } = useI18n();
const store = useObservabilityStore();

/** Max entries shown in the table at once (avoids DOM overload). */
const DISPLAY_LIMIT = 500;

/** Display only the most recent N filtered entries (newest at bottom). */
const displayedEntries = computed(() => {
    const all = store.filteredEntries;
    return all.length > DISPLAY_LIMIT ? all.slice(-DISPLAY_LIMIT) : all;
});

/** Format time for the table column. */
function formatEntryTime(iso: string): string {
    return new Date(iso).toLocaleTimeString();
}

/** Pretty-printed JSON for the data inspector block. */
const formattedPayload = computed(() =>
    store.selectedEntry ? JSON.stringify(store.selectedEntry.rawData, undefined, 2) : ''
);

/** Pretty-printed JSON for the meta inspector block. */
const formattedMeta = computed(() =>
    store.selectedEntry?.rawMeta ? JSON.stringify(store.selectedEntry.rawMeta, undefined, 2) : ''
);

/** Available event kinds derived from current buffer for filter options. */
const availableKinds = computed(() => {
    const kinds = new Set(store.entries.map((e) => e.kind));
    return [...kinds].toSorted();
});

/** Static filter options. */
const severityOptions = ['info', 'warning', 'error', 'success'];
const sourceOptions = ['agent', 'swarm', 'workflow', 'chat', 'system', 'unknown'];

/** Connection chip coloring. */
const connectionChipColor = computed(() => {
    const map: Record<string, string> = {
        disconnected: 'grey',
        connecting: 'warning',
        connected: 'success',
        error: 'error'
    };
    return map[store.connectionState] ?? 'grey';
});

const connectionChipIcon = computed(() => {
    const map: Record<string, string> = {
        disconnected: 'mdi-circle-outline',
        connecting: 'mdi-loading',
        connected: 'mdi-check-circle',
        error: 'mdi-alert-circle'
    };
    return map[store.connectionState] ?? 'mdi-circle-outline';
});

// Auto-load history on mount for a non-empty landing page
onMounted(() => {
    store.loadHistory();
});

// Stop polling when leaving the page
onUnmounted(() => {
    store.stopPolling();
});
</script>

<style scoped>
.entry-list-container {
    max-height: 600px;
    overflow-y: auto;
}

.json-block {
    background: #1e1e1e;
    color: #d4d4d4;
    border-radius: 8px;
    padding: 12px 16px;
    overflow-x: auto;
    font-family: 'Fira Code', 'Cascadia Code', monospace;
    font-size: 0.8rem;
    white-space: pre-wrap;
    max-height: 400px;
    overflow-y: auto;
}

.cursor-pointer {
    cursor: pointer;
}
</style>
