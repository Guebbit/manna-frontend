<template>
    <div>
        <h1 class="text-h4 mb-2">{{ t('observability.title') }}</h1>
        <p class="text-body-2 text-grey mb-4">{{ t('observability.subtitle') }}</p>

        <!-- Connection + filter toolbar -->
        <v-card class="mb-4">
            <v-card-text>
                <div class="d-flex align-center flex-wrap ga-3">
                    <!-- Connection status chip -->
                    <v-chip
                        :color="connectionChipColor"
                        size="small"
                        :prepend-icon="connectionChipIcon"
                    >
                        {{ t(`observability.state.${store.connectionState}`) }}
                    </v-chip>

                    <!-- Connect / Disconnect -->
                    <v-btn
                        v-if="
                            store.connectionState === 'disconnected' ||
                            store.connectionState === 'error'
                        "
                        color="primary"
                        variant="tonal"
                        size="small"
                        prepend-icon="mdi-connection"
                        @click="store.connect()"
                    >
                        {{ t('observability.connect') }}
                    </v-btn>
                    <v-btn
                        v-else
                        color="error"
                        variant="tonal"
                        size="small"
                        prepend-icon="mdi-close-circle"
                        @click="store.disconnect()"
                    >
                        {{ t('observability.disconnect') }}
                    </v-btn>

                    <!-- Pause / Resume -->
                    <v-btn
                        :disabled="store.connectionState !== 'connected'"
                        variant="tonal"
                        size="small"
                        :prepend-icon="store.paused ? 'mdi-play' : 'mdi-pause'"
                        @click="store.togglePause()"
                    >
                        {{ store.paused ? t('observability.resume') : t('observability.pause') }}
                    </v-btn>

                    <!-- Clear -->
                    <v-btn
                        variant="tonal"
                        size="small"
                        prepend-icon="mdi-delete-sweep"
                        :disabled="store.events.length === 0"
                        @click="store.clearEvents()"
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
                            v-model="store.filters.types"
                            :items="availableTypes"
                            :label="t('observability.filterType')"
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

        <!-- Two-pane body: event list + inspector -->
        <v-row>
            <!-- Left: Event list -->
            <v-col cols="12" :md="store.selectedEvent ? 7 : 12">
                <v-card>
                    <v-card-title class="d-flex align-center">
                        <v-icon start>mdi-format-list-bulleted</v-icon>
                        {{ t('observability.events') }}
                        <v-chip class="ml-2" size="small" color="primary">
                            {{ store.filteredEvents.length }}
                        </v-chip>
                        <v-spacer />
                        <v-btn
                            v-if="
                                store.filters.types.length > 0 ||
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
                    <v-card-text class="event-list-container">
                        <v-table v-if="store.filteredEvents.length > 0" density="compact" hover>
                            <thead>
                                <tr>
                                    <th style="width: 130px">
                                        {{ t('observability.colTime') }}
                                    </th>
                                    <th style="width: 100px">
                                        {{ t('observability.colType') }}
                                    </th>
                                    <th style="width: 80px">
                                        {{ t('observability.colSource') }}
                                    </th>
                                    <th>{{ t('observability.colSummary') }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="event in displayedEvents"
                                    :key="event.localId"
                                    :class="{
                                        'bg-blue-lighten-5': event.localId === store.selectedEventId
                                    }"
                                    class="cursor-pointer"
                                    @click="store.selectEvent(event.localId)"
                                >
                                    <td class="text-caption text-no-wrap">
                                        {{ formatEventTime(event.receivedAt) }}
                                    </td>
                                    <td>
                                        <v-chip
                                            :color="eventTypeColor(event.type)"
                                            size="x-small"
                                            label
                                        >
                                            {{ event.type }}
                                        </v-chip>
                                    </td>
                                    <td class="text-caption">{{ event.source }}</td>
                                    <td class="text-body-2 text-truncate" style="max-width: 400px">
                                        {{ event.summary }}
                                    </td>
                                </tr>
                            </tbody>
                        </v-table>
                        <p v-else class="text-center text-grey pa-6">
                            {{ t('observability.noEvents') }}
                        </p>
                    </v-card-text>
                </v-card>
            </v-col>

            <!-- Right: Inspector pane -->
            <v-col v-if="store.selectedEvent" cols="12" md="5">
                <v-card>
                    <v-card-title class="d-flex align-center">
                        <v-icon start>mdi-magnify-scan</v-icon>
                        {{ t('observability.inspector') }}
                        <v-spacer />
                        <v-btn
                            icon
                            variant="text"
                            size="small"
                            @click="store.selectEvent(undefined)"
                        >
                            <v-icon>mdi-close</v-icon>
                        </v-btn>
                    </v-card-title>
                    <v-card-text>
                        <!-- Summary chips -->
                        <div class="d-flex flex-wrap ga-2 mb-3">
                            <v-chip
                                :color="eventTypeColor(store.selectedEvent.type)"
                                size="small"
                                label
                            >
                                {{ store.selectedEvent.type }}
                            </v-chip>
                            <v-chip
                                :color="severityColor(store.selectedEvent.severity)"
                                size="small"
                            >
                                {{ store.selectedEvent.severity }}
                            </v-chip>
                            <v-chip size="small" variant="outlined">
                                {{ store.selectedEvent.source }}
                            </v-chip>
                        </div>

                        <!-- Metadata -->
                        <v-list density="compact" class="mb-3">
                            <v-list-item>
                                <v-list-item-title class="text-caption">
                                    {{ t('observability.timestamp') }}
                                </v-list-item-title>
                                <v-list-item-subtitle>
                                    {{ store.selectedEvent.timestamp }}
                                </v-list-item-subtitle>
                            </v-list-item>
                            <v-list-item>
                                <v-list-item-title class="text-caption">
                                    {{ t('observability.receivedAt') }}
                                </v-list-item-title>
                                <v-list-item-subtitle>
                                    {{ store.selectedEvent.receivedAt }}
                                </v-list-item-subtitle>
                            </v-list-item>
                            <v-list-item
                                v-if="Object.keys(store.selectedEvent.correlationIds).length > 0"
                            >
                                <v-list-item-title class="text-caption">
                                    {{ t('observability.correlationIds') }}
                                </v-list-item-title>
                                <v-list-item-subtitle>
                                    <v-chip
                                        v-for="(value, key) in store.selectedEvent.correlationIds"
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

                        <!-- Raw JSON payload -->
                        <div class="d-flex align-center mb-1">
                            <span class="text-caption font-weight-bold">
                                {{ t('observability.rawPayload') }}
                            </span>
                            <v-spacer />
                            <CopyButton :text="formattedPayload" />
                        </div>
                        <pre class="json-block">{{ formattedPayload }}</pre>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useObservabilityStore } from '@/stores/observability';
import { eventTypeColor, severityColor } from '@/utils/observabilityFormatting';
import CopyButton from '@/components/shared/CopyButton.vue';

const { t } = useI18n();
const store = useObservabilityStore();

/** Max events shown in the table at once (avoids DOM overload). */
const DISPLAY_LIMIT = 500;

/** Display only the most recent N filtered events (newest at bottom). */
const displayedEvents = computed(() => {
    const all = store.filteredEvents;
    return all.length > DISPLAY_LIMIT ? all.slice(-DISPLAY_LIMIT) : all;
});

/** Format time for the table column. */
function formatEventTime(iso: string): string {
    return new Date(iso).toLocaleTimeString();
}

/** Pretty-printed JSON for the inspector. */
const formattedPayload = computed(() =>
    store.selectedEvent ? JSON.stringify(store.selectedEvent.rawPayload, undefined, 2) : ''
);

/** Available event types derived from current buffer for filter options. */
const availableTypes = computed(() => {
    const types = new Set(store.events.map((e) => e.type));
    return [...types].toSorted();
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

// Clean up SSE connection when leaving the page
onUnmounted(() => {
    store.disconnect();
});
</script>

<style scoped>
.event-list-container {
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
