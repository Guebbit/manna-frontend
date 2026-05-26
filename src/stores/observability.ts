/**
 * @module stores/observability
 *
 * Pinia store for the persistent activity history dashboard.
 *
 * Replaces the old SSE-based observability stream with the new
 * /history API: initial fetch, optional long-poll for incremental
 * updates, export, and clear.
 */
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { historyApi } from '@/utils/api';
import { normalizeHistoryEntry } from '@/utils/observabilityFormatting';
import type {
    IHistoryEntry,
    IHistoryFilters,
    ActivityLogListResponse,
    ActivityLogPollResponse
} from '@/api/observabilityEvents';
import { handleApiError } from '@/utils/errorHandling';

/** Maximum entries kept in the buffer before oldest are discarded. */
const MAX_BUFFER_SIZE = 2000;

/** Long-poll timeout sent to the backend (ms). */
const POLL_TIMEOUT_MS = 30_000;

/** Loading/polling state of the history view. */
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export const useObservabilityStore = defineStore('observability', () => {
    /* ─── State ─────────────────────────────────────────────── */

    const entries = ref<IHistoryEntry[]>([]);
    /** Current load / poll state (maps to same ConnectionState type for UI reuse). */
    const connectionState = ref<ConnectionState>('disconnected');
    const connectionError = ref<string | undefined>(undefined);
    /** Whether background long-polling is active. */
    const pollingEnabled = ref(false);
    const selectedEntryId = ref<string | undefined>(undefined);
    const filters = ref<IHistoryFilters>({
        query: '',
        kinds: [],
        severities: [],
        sources: []
    });

    /* ─── Internal refs ─────────────────────────────────────── */

    /** Cursor for incremental fetches (Mongo ObjectId of the last seen entry). */
    let cursor: string | undefined;
    /** AbortController for the active long-poll request. */
    let pollAbort: AbortController | undefined;
    /** Whether a poll loop is currently running (prevents double-start). */
    let pollLoopRunning = false;

    /* ─── Derived state ──────────────────────────────────────── */

    /** Entries matching current filter criteria. */
    const filteredEntries = computed(() => {
        return entries.value.filter((entry) => {
            const { query, kinds, severities, sources } = filters.value;
            if (query && !entry.searchText.includes(query.toLowerCase())) return false;
            if (kinds.length > 0 && !kinds.includes(entry.kind)) return false;
            if (severities.length > 0 && !severities.includes(entry.severity)) return false;
            if (sources.length > 0 && !sources.includes(entry.source)) return false;
            return true;
        });
    });

    /** The currently selected entry for the inspector pane. */
    const selectedEntry = computed(() => entries.value.find((e) => e.id === selectedEntryId.value));

    /** Quick counter per severity. */
    const severityCounts = computed(() => {
        const counts = { info: 0, warning: 0, error: 0, success: 0 };
        for (const entry of entries.value) counts[entry.severity]++;
        return counts;
    });

    /* ─── Internal helpers ───────────────────────────────────── */

    /** Ingests a list of ActivityLogListResponse entries into the buffer. */
    function ingestList(response: ActivityLogListResponse): void {
        for (const raw of response.entries) {
            entries.value.push(normalizeHistoryEntry(raw));
        }
        // Ring buffer: keep only the most recent entries
        if (entries.value.length > MAX_BUFFER_SIZE) {
            entries.value = entries.value.slice(-MAX_BUFFER_SIZE);
        }
        if (response.nextCursor) cursor = response.nextCursor;
    }

    /* ─── Actions ────────────────────────────────────────────── */

    /** Performs an initial (or manual) fetch of all history. */
    function loadHistory(): void {
        connectionState.value = 'connecting';
        connectionError.value = undefined;

        historyApi
            .getHistory()
            .then((response) => {
                const data = (response.data as { data?: ActivityLogListResponse }).data;
                if (data) ingestList(data);
                connectionState.value = 'connected';
            })
            .catch((error: unknown) => {
                connectionState.value = 'error';
                connectionError.value =
                    error instanceof Error ? error.message : 'Failed to load history';
                handleApiError(error, 'Failed to load history');
            });
    }

    /**
     * Runs one long-poll request.
     * Returns true if new entries were received, false on timeout/empty.
     */
    function pollOnce(): Promise<boolean> {
        pollAbort = new AbortController();
        return historyApi
            .getHistoryPoll(cursor, 100, POLL_TIMEOUT_MS, {
                signal: pollAbort.signal,
                // Allow up to timeout + 5s for the HTTP round-trip
                timeout: POLL_TIMEOUT_MS + 5000
            })
            .then((response) => {
                const data = (response.data as { data?: ActivityLogPollResponse }).data;
                if (data && data.entries.length > 0) {
                    ingestList(data);
                    return true;
                }
                return false;
            })
            .catch((error: unknown) => {
                // AbortError is expected when polling is disabled — not a failure
                if (error instanceof DOMException && error.name === 'AbortError') return false;
                if (
                    typeof error === 'object' &&
                    error !== null &&
                    'name' in error &&
                    (error as { name: string }).name === 'AbortError'
                )
                    return false;
                connectionState.value = 'error';
                connectionError.value =
                    error instanceof Error ? error.message : 'Poll request failed';
                handleApiError(error, 'History poll failed');
                return false;
            });
    }

    /** Background loop: polls continuously while pollingEnabled is true. */
    async function runPollLoop(): Promise<void> {
        if (pollLoopRunning) return;
        pollLoopRunning = true;
        connectionState.value = 'connected';

        while (pollingEnabled.value) {
            await pollOnce(); // eslint-disable-line no-await-in-loop
            // Brief pause between polls — avoids hammering if server responds immediately
            if (pollingEnabled.value) {
                await new Promise<void>((resolve) => {
                    setTimeout(resolve, 500);
                }); // eslint-disable-line no-await-in-loop
            }
        }

        pollLoopRunning = false;
        connectionState.value = 'disconnected';
    }

    /** Starts background long-polling for incremental updates. */
    function startPolling(): void {
        if (pollingEnabled.value) return;
        pollingEnabled.value = true;
        void runPollLoop();
    }

    /** Stops background long-polling. */
    function stopPolling(): void {
        pollingEnabled.value = false;
        pollAbort?.abort();
        pollAbort = undefined;
    }

    /**
     * Downloads the full history as a JSON file.
     * Triggers a browser file-save dialog.
     */
    function exportHistory(): void {
        historyApi
            .getHistoryExport()
            .then((response) => {
                const data = response.data as {
                    data?: { exportedAt: string; count: number; entries: unknown[] };
                };
                const blob = new Blob([JSON.stringify(data?.data ?? response.data, undefined, 2)], {
                    type: 'application/json'
                });
                const url = URL.createObjectURL(blob);
                const anchor = document.createElement('a');
                anchor.href = url;
                anchor.download = `manna-history-${new Date().toISOString().slice(0, 10)}.json`;
                anchor.click();
                URL.revokeObjectURL(url);
            })
            .catch((error: unknown) => {
                handleApiError(error, 'Export failed');
            });
    }

    /** Clears all history on the backend and resets the local buffer. */
    function clearHistory(): void {
        historyApi
            .deleteHistory()
            .then(() => {
                entries.value = [];
                selectedEntryId.value = undefined;
                cursor = undefined;
            })
            .catch((error: unknown) => {
                handleApiError(error, 'Clear history failed');
            });
    }

    /** Selects an entry for detail inspection. */
    function selectEntry(id: string | undefined): void {
        selectedEntryId.value = id;
    }

    /** Resets all filters to defaults. */
    function resetFilters(): void {
        filters.value = { query: '', kinds: [], severities: [], sources: [] };
    }

    /* ─── Legacy aliases for backward compat ────────────────── */

    /** @deprecated Use loadHistory + startPolling. */
    const connect = loadHistory;
    /** @deprecated Use stopPolling. */
    const disconnect = stopPolling;
    /** @deprecated Use filteredEntries. */
    const filteredEvents = filteredEntries;
    /** @deprecated Use selectedEntry. */
    const selectedEvent = selectedEntry;
    /** @deprecated Use selectEntry. */
    const selectEvent = selectEntry;
    /** @deprecated Use clearHistory. */
    const clearEvents = clearHistory;

    return {
        // State
        entries,
        connectionState,
        connectionError,
        pollingEnabled,
        selectedEntryId,
        filters,
        // Derived
        filteredEntries,
        selectedEntry,
        severityCounts,
        // Actions
        loadHistory,
        startPolling,
        stopPolling,
        exportHistory,
        clearHistory,
        selectEntry,
        resetFilters,
        // Aliases
        connect,
        disconnect,
        filteredEvents,
        selectedEvent,
        selectEvent,
        clearEvents
    };
});
