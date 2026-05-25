/**
 * @module utils/observabilityFormatting
 *
 * Pure helpers that normalize raw SSE events from `/events/stream`
 * into the `IObservabilityEvent` view-model used by the store and UI.
 */

import { v4 as uuidv4 } from 'uuid';
import type {
    IRawObservabilityEvent,
    IObservabilityEvent,
    ObservabilitySeverity,
    ObservabilitySource
} from '@/api/observabilityEvents';

/* ─── Severity derivation ──────────────────────────────────── */

/** Maps event type to a severity level. */
export function deriveSeverity(type: string, data: Record<string, unknown>): ObservabilitySeverity {
    if (type === 'error' || type === 'hard_stop' || type === 'subtask_error') return 'error';
    if (type === 'max_steps' || type === 'warning') return 'warning';
    if (type === 'done' || type === 'subtask_done' || type === 'step_done') return 'success';
    if (data['error']) return 'error';
    return 'info';
}

/* ─── Source derivation ────────────────────────────────────── */

/** Infers the source subsystem from event type and payload fields. */
export function deriveSource(type: string, data: Record<string, unknown>): ObservabilitySource {
    if (data['conversationId'] || type === 'message' || type === 'reply') return 'chat';
    if (data['subtaskId'] || type === 'decomposed' || type === 'subtask_start') return 'swarm';
    if (data['workflowIndex'] !== undefined || type === 'workflow_start' || type === 'step_start')
        return 'workflow';
    if (type === 'step' || type === 'tool' || type === 'route' || type === 'done') return 'agent';
    if (type === 'health' || type === 'heartbeat') return 'system';
    return 'unknown';
}

/* ─── Summary text ─────────────────────────────────────────── */

/** Produces a concise one-line summary from an event type and payload. */
export function deriveSummary(type: string, data: Record<string, unknown>): string {
    switch (type) {
        case 'step': {
            return `Step ${String(data['step'] ?? '?')}: ${String(data['action'] ?? '')}`;
        }
        case 'tool': {
            return data['error']
                ? `Tool ${String(data['tool'])} error`
                : `Tool ${String(data['tool'])} executed`;
        }
        case 'route': {
            return `Routed → ${String(data['profile'])} (${String(data['model'])})`;
        }
        case 'done': {
            return 'Completed';
        }
        case 'error': {
            return `Error: ${String(data['error'] ?? 'unknown')}`;
        }
        case 'hard_stop': {
            return `Hard stop (${String(data['code'])}): ${String(data['reason'])}`;
        }
        case 'max_steps': {
            return `Max steps: ${String(data['summary'] ?? '')}`;
        }
        case 'decomposed': {
            return `Decomposed into ${String(data['subtaskCount'])} subtasks`;
        }
        case 'subtask_start': {
            return `Subtask ${String(data['subtaskId'])} started`;
        }
        case 'subtask_done': {
            return `Subtask ${String(data['subtaskId'])} done`;
        }
        case 'subtask_error': {
            return `Subtask ${String(data['subtaskId'])} failed`;
        }
        case 'workflow_start': {
            return `Workflow started (${String(data['stepCount'])} steps)`;
        }
        case 'step_start': {
            return `Step ${String((data['index'] as number) + 1)} started`;
        }
        case 'step_done': {
            return `Step ${String(((data['index'] as number) ?? 0) + 1)} done`;
        }
        case 'heartbeat': {
            return 'Heartbeat';
        }
        default: {
            return type;
        }
    }
}

/* ─── Correlation ID extraction ────────────────────────────── */

/** Extracts any correlation IDs from the payload. */
export function extractCorrelationIds(data: Record<string, unknown>): Record<string, string> {
    const ids: Record<string, string> = {};
    const keys = ['runId', 'conversationId', 'subtaskId', 'requestId', 'sessionId'];
    for (const key of keys) {
        if (typeof data[key] === 'string') ids[key] = data[key] as string;
    }
    return ids;
}

/* ─── Color for UI chips/badges ────────────────────────────── */

/** Returns a Vuetify color name for a given severity. */
export function severityColor(severity: ObservabilitySeverity): string {
    const map: Record<ObservabilitySeverity, string> = {
        info: 'blue',
        warning: 'warning',
        error: 'error',
        success: 'success'
    };
    return map[severity] ?? 'grey';
}

/** Returns a Vuetify color name for a given event type. */
export function eventTypeColor(type: string): string {
    const map: Record<string, string> = {
        step: 'purple',
        tool: 'orange',
        route: 'teal',
        done: 'success',
        error: 'error',
        hard_stop: 'error',
        max_steps: 'warning',
        decomposed: 'blue',
        subtask_start: 'cyan',
        subtask_done: 'green',
        subtask_error: 'red',
        workflow_start: 'blue',
        step_start: 'cyan',
        step_done: 'green',
        heartbeat: 'grey'
    };
    return map[type] ?? 'grey';
}

/* ─── Main normalizer ──────────────────────────────────────── */

/** Transforms a raw SSE frame into the normalized view-model. */
export function normalizeEvent(raw: IRawObservabilityEvent): IObservabilityEvent {
    const now = new Date().toISOString();
    const data = raw.data;
    const timestamp = typeof data['timestamp'] === 'string' ? data['timestamp'] : now;
    const summary = deriveSummary(raw.type, data);

    return {
        localId: uuidv4(),
        receivedAt: now,
        timestamp,
        type: raw.type,
        severity: deriveSeverity(raw.type, data),
        source: deriveSource(raw.type, data),
        correlationIds: extractCorrelationIds(data),
        summary,
        rawPayload: data,
        searchText: `${raw.type} ${summary} ${JSON.stringify(data)}`.toLowerCase()
    };
}
