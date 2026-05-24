/**
 * @module api/observabilityEvents
 *
 * Types for the normalized `/events/stream` SSE endpoint.
 * This endpoint emits a unified stream of all backend lifecycle events
 * (agent steps, tool calls, routing decisions, errors, etc.) for
 * developer observability.
 *
 * The frontend normalizes each raw event into a local view-model
 * (`IObservabilityEvent`) for filtering, searching, and inspection.
 */

/* ─── Raw SSE event from backend ─────────────────────────── */

/**
 * Raw event envelope arriving over the `/events/stream` SSE connection.
 * The backend sends typed events with arbitrary JSON payloads.
 */
export interface IRawObservabilityEvent {
    type: string;
    data: Record<string, unknown>;
}

/* ─── Normalized frontend view-model ─────────────────────── */

/** Severity levels for observability events. */
export type ObservabilitySeverity = 'info' | 'warning' | 'error' | 'success';

/** Source category describing which subsystem emitted the event. */
export type ObservabilitySource = 'agent' | 'swarm' | 'workflow' | 'chat' | 'system' | 'unknown';

/**
 * Normalized observability event — the local view-model used by the store
 * and UI components. Created once on ingestion from the raw SSE frame.
 */
export interface IObservabilityEvent {
    /** Locally generated unique ID (for keying in lists). */
    localId: string;
    /** Timestamp when the frontend received this event. */
    receivedAt: string;
    /** Canonical backend timestamp if present in payload, else receivedAt. */
    timestamp: string;
    /** SSE event type (e.g. 'step', 'tool', 'route', 'done', 'error'). */
    type: string;
    /** Derived severity for filtering and coloring. */
    severity: ObservabilitySeverity;
    /** Derived source subsystem. */
    source: ObservabilitySource;
    /** Correlation IDs extracted from payload (runId, conversationId, etc.). */
    correlationIds: Record<string, string>;
    /** Short one-line summary for the event list. */
    summary: string;
    /** Full raw payload — kept untouched for the inspector pane. */
    rawPayload: Record<string, unknown>;
    /** Pre-computed lowercase searchable string (type + summary + JSON keys). */
    searchText: string;
}

/* ─── Filter state ───────────────────────────────────────── */

/** Filter criteria applied to the event buffer in the observability store. */
export interface IObservabilityFilters {
    /** Free-text search matched against `searchText`. */
    query: string;
    /** Filter by event type(s); empty = show all. */
    types: string[];
    /** Filter by severity; empty = show all. */
    severities: ObservabilitySeverity[];
    /** Filter by source; empty = show all. */
    sources: ObservabilitySource[];
}
