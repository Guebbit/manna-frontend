/**
 * @module utils/eventFormatting
 *
 * Shared helpers for formatting SSE stream events from the Agent, Swarm, and
 * Workflow views.  Each event type is given a colour (for timeline dot/chip)
 * and a human-readable summary string.
 *
 * The functions accept the full discriminated-union event objects so that
 * TypeScript narrows the `data` field automatically in each case branch.
 */

import type { AgentStreamEvent, SwarmStreamEvent, WorkflowStreamEvent } from '@/api/types';
import { formatDuration } from './formatting';

/* ─── Colour maps ────────────────────────────────────────────── */

/** Colour map for agent stream event types. */
const AGENT_EVENT_COLORS: Record<AgentStreamEvent['type'], string> = {
    step: 'purple',
    tool: 'orange',
    route: 'teal',
    done: 'success',
    error: 'error',
    max_steps: 'warning'
};

/** Colour map for swarm stream event types. */
const SWARM_EVENT_COLORS: Record<SwarmStreamEvent['type'], string> = {
    decomposed: 'blue',
    subtask_start: 'cyan',
    subtask_done: 'green',
    subtask_error: 'red',
    step: 'purple',
    tool: 'orange',
    route: 'teal',
    done: 'success',
    error: 'error'
};

/** Colour map for workflow stream event types. */
const WORKFLOW_EVENT_COLORS: Record<WorkflowStreamEvent['type'], string> = {
    workflow_start: 'blue',
    step_start: 'cyan',
    step: 'purple',
    tool: 'orange',
    route: 'teal',
    step_done: 'green',
    done: 'success',
    error: 'error'
};

/* ─── Colour accessors ───────────────────────────────────────── */

/** Returns the timeline colour for an agent stream event type. */
export function agentEventColor(type: AgentStreamEvent['type']): string {
    return AGENT_EVENT_COLORS[type] ?? 'grey';
}

/** Returns the timeline colour for a swarm stream event type. */
export function swarmEventColor(type: SwarmStreamEvent['type']): string {
    return SWARM_EVENT_COLORS[type] ?? 'grey';
}

/** Returns the timeline colour for a workflow stream event type. */
export function workflowEventColor(type: WorkflowStreamEvent['type']): string {
    return WORKFLOW_EVENT_COLORS[type] ?? 'grey';
}

/* ─── Summary formatters ─────────────────────────────────────── */

/** Returns a one-line summary string for an agent stream event. */
export function agentEventSummary(event: AgentStreamEvent): string {
    switch (event.type) {
        case 'step': {
            return `Step ${String(event.data.step)}: ${event.data.action} — ${event.data.thought}`;
        }
        case 'tool': {
            return event.data.error
                ? `Tool ${event.data.tool} error: ${event.data.error}`
                : `Tool ${event.data.tool} executed`;
        }
        case 'route': {
            return `Routed to ${event.data.profile} (${event.data.model})`;
        }
        case 'done': {
            return 'Agent completed';
        }
        case 'error': {
            return `Error: ${event.data.error}`;
        }
        case 'max_steps': {
            return `Max steps reached: ${event.data.summary}`;
        }
        default: {
            return '';
        }
    }
}

/** Returns a one-line summary string for a swarm stream event. */
export function swarmEventSummary(event: SwarmStreamEvent): string {
    switch (event.type) {
        case 'decomposed': {
            return `Decomposed into ${event.data.subtaskCount} subtasks`;
        }
        case 'subtask_start': {
            return `Subtask ${event.data.subtaskId} started (${event.data.profile})`;
        }
        case 'subtask_done': {
            return `Subtask ${event.data.subtaskId} done in ${formatDuration(event.data.durationMs)}`;
        }
        case 'subtask_error': {
            return `Subtask ${event.data.subtaskId} failed: ${event.data.error}`;
        }
        case 'step': {
            return `Step ${event.data.step}: ${event.data.action}`;
        }
        case 'tool': {
            return event.data.error
                ? `Tool ${event.data.tool} error: ${event.data.error}`
                : `Tool ${event.data.tool} executed`;
        }
        case 'route': {
            return `Routed to ${event.data.profile} (${event.data.model})`;
        }
        case 'done': {
            return `Completed in ${formatDuration(event.data.totalDurationMs)}`;
        }
        case 'error': {
            return `Error: ${event.data.error}`;
        }
        default: {
            return '';
        }
    }
}

/** Returns a one-line summary string for a workflow stream event. */
export function workflowEventSummary(event: WorkflowStreamEvent): string {
    switch (event.type) {
        case 'workflow_start': {
            return `Workflow started with ${event.data.stepCount} step${event.data.stepCount === 1 ? '' : 's'}`;
        }
        case 'step_start': {
            return `Step ${event.data.index + 1} started: ${event.data.task}`;
        }
        case 'step': {
            return `Step ${event.data.workflowIndex + 1}, iteration ${event.data.step}: ${event.data.action}`;
        }
        case 'tool': {
            return event.data.error
                ? `Tool ${event.data.tool} error: ${event.data.error}`
                : `Tool ${event.data.tool} executed`;
        }
        case 'route': {
            return `Routed to ${event.data.profile} (${event.data.model})`;
        }
        case 'step_done': {
            return event.data.success
                ? `Step ${event.data.index + 1} done in ${formatDuration(event.data.durationMs)}`
                : `Step ${event.data.index + 1} failed: ${event.data.error ?? 'unknown error'}`;
        }
        case 'done': {
            return `Workflow completed in ${formatDuration(event.data.totalDurationMs)}`;
        }
        case 'error': {
            return `Error: ${event.data.error}`;
        }
        default: {
            return '';
        }
    }
}
