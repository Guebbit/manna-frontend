/**
 * @module utils/observabilityFormatting
 *
 * Pure helpers that normalize ActivityLogEntry records from the /history API
 * into the `IHistoryEntry` view-model used by the store and UI.
 */

import type { ActivityLogEntry } from '@api/api';
import type {
    IHistoryEntry,
    ObservabilitySeverity,
    ObservabilitySource
} from '@/api/observabilityEvents';

/* ─── Severity derivation ──────────────────────────────────── */

/** Maps entry kind/type/status to a severity level. */
export function deriveSeverity(
    kind: string,
    type: string,
    status?: string,
    data?: Record<string, unknown>
): ObservabilitySeverity {
    if (
        type === 'failed' ||
        type === 'error' ||
        type === 'hard_stop' ||
        kind.endsWith(':error') ||
        kind.endsWith(':hard_stop')
    )
        return 'error';
    if (type === 'max_steps' || status === 'max_steps') return 'warning';
    if (type === 'completed' || type === 'done' || status === 'completed' || kind.endsWith(':done'))
        return 'success';
    if (data?.['error']) return 'error';
    return 'info';
}

/* ─── Source derivation ────────────────────────────────────── */

/** Infers the source subsystem from the entry's category and kind. */
export function deriveSource(
    category: string,
    kind: string,
    conversationId?: string
): ObservabilitySource {
    if (conversationId || category === 'chat') return 'chat';
    if (category === 'workflow' || kind.startsWith('workflow:')) return 'workflow';
    if (category === 'run' || kind.startsWith('agent:')) return 'agent';
    if (category === 'system' || kind.startsWith('system:')) return 'system';
    return 'unknown';
}

/* ─── Summary text ─────────────────────────────────────────── */

/** Produces a concise one-line summary for an activity log entry. */
export function deriveSummary(entry: ActivityLogEntry): string {
    const { kind, type, toolName, status, data, subtaskId } = entry;

    // Tool events
    if (toolName || kind.startsWith('tool:')) {
        const name = toolName ?? String(data['tool'] ?? '');
        if (type === 'failed' || data['error']) return `Tool ${name} failed`;
        return `Tool ${name} ${type === 'succeeded' ? 'succeeded' : type}`;
    }

    // Agent step
    if (kind === 'agent:step') {
        return `Step ${String(data['step'] ?? '?')}: ${String(data['action'] ?? '')}`;
    }

    // Agent routing
    if (kind === 'agent:model_routed') {
        return `Routed → ${String(data['profile'] ?? '')} (${String(data['model'] ?? '')})`;
    }

    // Agent hard stop
    if (kind === 'agent:hard_stop') {
        return `Hard stop (${String(data['code'] ?? '')}): ${String(data['reason'] ?? '')}`;
    }

    // Agent max steps
    if (kind === 'agent:max_steps') {
        return `Max steps: ${String(data['summary'] ?? '')}`;
    }

    // Generic fallback using status or type
    if (status) return `${type} — ${status}`;
    if (type) return type;
    return kind;
}

/* ─── Correlation ID extraction ────────────────────────────── */

/** Collects all non-empty correlation IDs from an entry. */
export function extractCorrelationIds(entry: ActivityLogEntry): Record<string, string> {
    const ids: Record<string, string> = {};
    const { runId, conversationId, subtaskId, requestId, messageId, workflowId, parentId } = entry;
    const candidates: Record<string, string | undefined> = {
        runId,
        conversationId,
        subtaskId,
        requestId,
        messageId,
        workflowId,
        parentId
    };
    for (const [key, value] of Object.entries(candidates)) {
        if (typeof value === 'string' && value) ids[key] = value;
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

/** Returns a Vuetify color name for a given event kind/type. */
export function eventTypeColor(kind: string): string {
    switch (kind) {
        case 'agent:step': {
            return 'purple';
        }
        case 'agent:start': {
            return 'blue-lighten-2';
        }
        case 'agent:done': {
            return 'success';
        }
        case 'agent:error': {
            return 'error';
        }
        case 'agent:hard_stop': {
            return 'error';
        }
        case 'agent:max_steps': {
            return 'warning';
        }
        case 'agent:model_routed': {
            return 'teal';
        }
        case 'tool:result': {
            return 'orange';
        }
        case 'tool:error': {
            return 'red';
        }
        case 'tool:verification_failed': {
            return 'deep-orange';
        }
        case 'system:heartbeat':
        case 'system:health': {
            return 'grey';
        }
        default: {
            return 'grey';
        }
    }
}

/* ─── Main normalizer ──────────────────────────────────────── */

/** Transforms a raw ActivityLogEntry into the normalized IHistoryEntry view-model. */
export function normalizeHistoryEntry(entry: ActivityLogEntry): IHistoryEntry {
    const summary = deriveSummary(entry);
    const severity = deriveSeverity(entry.kind, entry.type, entry.status, entry.data);
    const source = deriveSource(entry.category, entry.kind, entry.conversationId);
    const correlationIds = extractCorrelationIds(entry);

    return {
        id: entry.id,
        timestamp: entry.timestamp,
        kind: entry.kind,
        category: entry.category,
        type: entry.type,
        severity,
        source,
        correlationIds,
        toolName: entry.toolName,
        status: entry.status,
        summary,
        rawData: entry.data,
        rawMeta: entry.meta,
        searchText:
            `${entry.kind} ${entry.type} ${summary} ${JSON.stringify(entry.data)}`.toLowerCase()
    };
}

/* ─── Legacy alias (kept for backward-compat with any surviving references) ─ */

/** @deprecated Use normalizeHistoryEntry. */
export const normalizeEvent = normalizeHistoryEntry;
