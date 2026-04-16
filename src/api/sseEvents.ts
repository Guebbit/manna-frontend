/**
 * @module api/sseEvents
 *
 * Discriminated-union types for all Server-Sent Event streams emitted by the
 * Manna backend. These types cannot be generated from the OpenAPI spec because
 * SSE event shapes are expressed only in endpoint descriptions, not in schema
 * objects.
 *
 * Import from this module whenever you consume a streaming endpoint.
 */
import type { ResponseMeta, WorkflowStepResult, WorkflowResponse } from '../../api/models';

/* ─── Agent /run/stream ────────────────────────────────────────── */

/** SSE event emitted for each agent reasoning step. */
export interface IAgentStepEvent {
    step: number;
    action: string;
    thought: string;
}

/** SSE event emitted after a tool has been invoked by the agent. */
export interface IAgentToolEvent {
    tool: string;
    result?: string;
    error?: string;
}

/** SSE event emitted when the model router selects a model profile. */
export interface IAgentRouteEvent {
    profile: string;
    model: string;
    reason: string;
}

/** SSE event emitted when the agent has produced its final answer. */
export interface IAgentDoneEvent {
    result: string;
    meta?: ResponseMeta;
}

/** SSE event emitted when the agent encounters an unrecoverable error. */
export interface IAgentErrorEvent {
    error: string;
}

/** SSE event emitted when the agent exhausts its maximum step count. */
export interface IAgentMaxStepsEvent {
    task: string;
    summary: string;
}

/** Discriminated union of all SSE events from POST /run/stream. */
export type AgentStreamEvent =
    | { type: 'step'; data: IAgentStepEvent }
    | { type: 'tool'; data: IAgentToolEvent }
    | { type: 'route'; data: IAgentRouteEvent }
    | { type: 'done'; data: IAgentDoneEvent }
    | { type: 'error'; data: IAgentErrorEvent }
    | { type: 'max_steps'; data: IAgentMaxStepsEvent };

/* ─── Swarm /run/swarm/stream ──────────────────────────────────── */

/** SSE event emitted when the swarm has decomposed the task. */
export interface ISwarmDecomposedEvent {
    subtaskCount: number;
    reasoning: string;
    subtasks: Array<{ id: string; description: string; profile: string }>;
}

/** SSE event emitted when a subtask agent loop begins. */
export interface ISwarmSubtaskStartEvent {
    subtaskId: string;
    profile: string;
}

/** SSE event emitted when a subtask agent loop completes. */
export interface ISwarmSubtaskDoneEvent {
    subtaskId: string;
    durationMs: number;
}

/** SSE event emitted when a subtask agent loop fails. */
export interface ISwarmSubtaskErrorEvent {
    subtaskId: string;
    error: string;
}

/** SSE event emitted when the swarm synthesis produces the final answer. */
export interface ISwarmDoneEvent {
    result: string;
    totalDurationMs: number;
    subtaskCount: number;
    meta?: ResponseMeta;
}

/** Discriminated union of all SSE events from POST /run/swarm/stream. */
export type SwarmStreamEvent =
    | { type: 'decomposed'; data: ISwarmDecomposedEvent }
    | { type: 'subtask_start'; data: ISwarmSubtaskStartEvent }
    | { type: 'subtask_done'; data: ISwarmSubtaskDoneEvent }
    | { type: 'subtask_error'; data: ISwarmSubtaskErrorEvent }
    | { type: 'step'; data: IAgentStepEvent }
    | { type: 'tool'; data: IAgentToolEvent }
    | { type: 'route'; data: IAgentRouteEvent }
    | { type: 'done'; data: ISwarmDoneEvent }
    | { type: 'error'; data: IAgentErrorEvent };

/* ─── Workflow /workflow/stream ────────────────────────────────── */

/** SSE event: workflow started. */
export interface IWorkflowStartEvent {
    stepCount: number;
}

/** SSE event: workflow step started. */
export interface IWorkflowStepStartEvent {
    index: number;
    task: string;
}

/** SSE event: inner agent iteration within a workflow step. */
export interface IWorkflowAgentStepEvent {
    workflowIndex: number;
    step: number;
    action: string;
    thought: string;
}

/** SSE event: tool execution within a workflow step. */
export interface IWorkflowToolEvent {
    workflowIndex: number;
    tool: string;
    result?: string;
    error?: string;
}

/** SSE event: model routing within a workflow step. */
export interface IWorkflowRouteEvent {
    workflowIndex: number;
    profile: string;
    model: string;
    reason: string;
}

/** SSE event: workflow completed — full WorkflowResponse plus optional meta. */
export interface IWorkflowDoneEvent extends WorkflowResponse {
    meta?: ResponseMeta;
}

/** Discriminated union of all SSE events from POST /workflow/stream. */
export type WorkflowStreamEvent =
    | { type: 'workflow_start'; data: IWorkflowStartEvent }
    | { type: 'step_start'; data: IWorkflowStepStartEvent }
    | { type: 'step'; data: IWorkflowAgentStepEvent }
    | { type: 'tool'; data: IWorkflowToolEvent }
    | { type: 'route'; data: IWorkflowRouteEvent }
    | { type: 'step_done'; data: WorkflowStepResult }
    | { type: 'done'; data: IWorkflowDoneEvent }
    | { type: 'error'; data: IAgentErrorEvent };
