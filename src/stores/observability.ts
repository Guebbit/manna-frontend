/**
 * @module stores/observability
 *
 * Pinia store for the developer observability stream.
 *
 * Manages the SSE connection lifecycle (connect/disconnect/pause),
 * a bounded ring-buffer of normalized events, filtering, and
 * selection state for the inspector panel.
 */
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { getMannaBaseUrl } from '@/config';
import { openEventStream } from '@/utils/sse';
import { normalizeEvent } from '@/utils/observabilityFormatting';
import type {
    IRawObservabilityEvent,
    IObservabilityEvent,
    IObservabilityFilters
} from '@/api/observabilityEvents';
import { handleApiError } from '@/utils/errorHandling';

/** Maximum events kept in the ring buffer before oldest are discarded. */
const MAX_BUFFER_SIZE = 2000;

/** Connection state of the SSE stream. */
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export const useObservabilityStore = defineStore('observability', () => {
    /* ─── State ─────────────────────────────────────────────── */

    const events = ref<IObservabilityEvent[]>([]);
    const connectionState = ref<ConnectionState>('disconnected');
    const connectionError = ref<string | undefined>(undefined);
    const paused = ref(false);
    const selectedEventId = ref<string | undefined>(undefined);
    const filters = ref<IObservabilityFilters>({
        query: '',
        types: [],
        severities: [],
        sources: []
    });

    /* ─── Internal refs (not exposed) ────────────────────────── */

    let abortController: AbortController | undefined;

    /* ─── Derived state ──────────────────────────────────────── */

    /** Events matching current filter criteria. */
    const filteredEvents = computed(() => {
        return events.value.filter((event) => {
            const { query, types, severities, sources } = filters.value;

            if (query && !event.searchText.includes(query.toLowerCase())) return false;
            if (types.length > 0 && !types.includes(event.type)) return false;
            if (severities.length > 0 && !severities.includes(event.severity)) return false;
            if (sources.length > 0 && !sources.includes(event.source)) return false;

            return true;
        });
    });

    /** The currently selected event for the inspector pane. */
    const selectedEvent = computed(() =>
        events.value.find((e) => e.localId === selectedEventId.value)
    );

    /** Quick counter per severity. */
    const severityCounts = computed(() => {
        const counts = { info: 0, warning: 0, error: 0, success: 0 };
        for (const event of events.value) {
            counts[event.severity]++;
        }
        return counts;
    });

    /* ─── Actions ────────────────────────────────────────────── */

    /** Connects to the `/events/stream` endpoint. */
    function connect(): void {
        if (connectionState.value === 'connected' || connectionState.value === 'connecting') return;

        abortController = new AbortController();
        connectionState.value = 'connecting';
        connectionError.value = undefined;

        const url = `${getMannaBaseUrl()}/events/stream`;

        // Consume the async generator in the background
        void consumeStream(url, abortController.signal);
    }

    /** Internal: reads events from the SSE generator until abort or error. */
    async function consumeStream(url: string, signal: AbortSignal): Promise<void> {
        try {
            const generator = openEventStream<IRawObservabilityEvent>(url, signal);
            connectionState.value = 'connected';

            for await (const raw of generator) {
                // Skip ingestion while paused (connection stays open)
                if (paused.value) continue;

                const normalized = normalizeEvent(raw);
                events.value.push(normalized);

                // Ring buffer: drop oldest when exceeding max
                if (events.value.length > MAX_BUFFER_SIZE) {
                    events.value = events.value.slice(-MAX_BUFFER_SIZE);
                }
            }

            // Stream ended gracefully
            connectionState.value = 'disconnected';
        } catch (error: unknown) {
            // AbortError is expected on disconnect — not a real failure
            if (error instanceof DOMException && error.name === 'AbortError') {
                connectionState.value = 'disconnected';
                return;
            }

            connectionState.value = 'error';
            connectionError.value = error instanceof Error ? error.message : 'Unknown stream error';
            handleApiError(error, 'Observability stream failed');
        }
    }

    /** Disconnects the current SSE connection. */
    function disconnect(): void {
        abortController?.abort();
        abortController = undefined;
        connectionState.value = 'disconnected';
    }

    /** Toggles the pause state — events are still received but not ingested. */
    function togglePause(): void {
        paused.value = !paused.value;
    }

    /** Clears the event buffer and selection. */
    function clearEvents(): void {
        events.value = [];
        selectedEventId.value = undefined;
    }

    /** Selects an event for detail inspection. */
    function selectEvent(localId: string | undefined): void {
        selectedEventId.value = localId;
    }

    /** Resets filters to defaults. */
    function resetFilters(): void {
        filters.value = { query: '', types: [], severities: [], sources: [] };
    }

    return {
        events,
        connectionState,
        connectionError,
        paused,
        selectedEventId,
        filters,
        filteredEvents,
        selectedEvent,
        severityCounts,
        connect,
        disconnect,
        togglePause,
        clearEvents,
        selectEvent,
        resetFilters
    };
});
