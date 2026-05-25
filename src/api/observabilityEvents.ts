/**
 * @module api/observabilityEvents
 *
 * Types for the persistent activity-history surface.
 * The backend stores all lifecycle events (agent steps, tool calls,
 * routing decisions, errors, etc.) in MongoDB and exposes them via
 * GET /history, GET /history/poll, GET /history/export, DELETE /history.
 *
 * The frontend normalizes each ActivityLogEntry into a local view-model
 * (`IHistoryEntry`) for filtering, searching, and detail inspection.
 */

/* ─── Re-export the generated API schema types ────────────── */

export type {
    ActivityLogEntry,
    ActivityLogListResponse,
    ActivityLogExportResponse,
    ActivityLogPollResponse,
    ActivityLogDeleteResponse
} from '@api/api';

/* ─── UI helpers ─────────────────────────────────────────── */

/** Severity levels used for coloring entries in the history view. */
export type ObservabilitySeverity = 'info' | 'warning' | 'error' | 'success';

/** Source category derived from an entry's category/kind for display. */
export type ObservabilitySource = 'agent' | 'swarm' | 'workflow' | 'chat' | 'system' | 'unknown';

/* ─── Normalized frontend view-model ─────────────────────── */

/**
 * Normalized history entry — the local view-model used by the store and UI.
 * Created once on ingestion from an ActivityLogEntry.
 */
export interface IHistoryEntry {
    /** Mongo ObjectId string (used as stable list key). */
    id: string;
    /** ISO timestamp from the backend record. */
    timestamp: string;
    /** Full internal event kind (e.g. `agent:step`, `tool:result`). */
    kind: string;
    /** Broad category (`run`, `tool`, `swarm`, `workflow`, `system`). */
    category: string;
    /** Specific type within category (e.g. `step`, `completed`, `failed`). */
    type: string;
    /** Derived severity for coloring. */
    severity: ObservabilitySeverity;
    /** Derived source subsystem for filtering. */
    source: ObservabilitySource;
    /** Correlation IDs (runId, conversationId, subtaskId, etc.). */
    correlationIds: Record<string, string>;
    /** Optional tool name for tool entries. */
    toolName?: string;
    /** Optional status string (e.g. `completed`, `failed`). */
    status?: string;
    /** Short one-line summary for the list view. */
    summary: string;
    /** Full raw data payload — kept for the inspector pane. */
    rawData: Record<string, unknown>;
    /** Optional metadata (metrics, durations, etc.) from the backend. */
    rawMeta?: Record<string, unknown>;
    /** Pre-computed lowercase searchable string. */
    searchText: string;
}

/* ─── Filter state ───────────────────────────────────────── */

/** Filter criteria applied to the history buffer. */
export interface IHistoryFilters {
    /** Free-text search matched against `searchText`. */
    query: string;
    /** Filter by kind/category; empty = show all. */
    kinds: string[];
    /** Filter by severity; empty = show all. */
    severities: ObservabilitySeverity[];
    /** Filter by source; empty = show all. */
    sources: ObservabilitySource[];
}

/* ─── Backward-compat aliases (for any code referencing old names) ─ */

/** @deprecated Use IHistoryEntry. */
export type IObservabilityEvent = IHistoryEntry;
/** @deprecated Use IHistoryFilters. */
export type IObservabilityFilters = IHistoryFilters;
