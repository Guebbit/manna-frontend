/**
 * @module types
 *
 * Shared TypeScript interfaces and discriminated unions for all Manna API
 * request/response payloads and SSE event streams.
 *
 * Every exported symbol in this file maps 1-to-1 to a Manna backend contract.
 * Keep this file in sync with the backend's OpenAPI specification.
 */

/* ─── Shared ─────────────────────────────────────────────────── */

/** Standard error payload returned by the Manna API. */
export interface IErrorResponse {
    error: string;
    requestId?: string;
}

/** Error payload with retry information for rate-limited requests. */
export interface IRateLimitResponse {
    error: string;
    retryAfterSeconds: number;
}

/**
 * Model profile that controls which underlying LLM the backend routes a request to.
 *
 * - `'fast'`      — A small, low-latency model. Best for simple lookups and quick answers.
 * - `'reasoning'` — A large model optimised for multi-step reasoning and hard problems.
 * - `'code'`      — A code-specialised model. Best for completions, reviews, and debugging.
 * - `'default'`   — The balanced fallback when no specific profile is required.
 *
 * Pass `undefined` to let Manna's automatic model router pick the best profile per step.
 */
export type ModelProfile = 'fast' | 'reasoning' | 'code' | 'default';

/* ─── System ─────────────────────────────────────────────────── */

/** Server health-check payload. */
export interface IHealthResponse {
    status: 'ok';
    timestamp: string;
}

/* ─── Agent /run ─────────────────────────────────────────────── */

/**
 * Request body for the agent `/run` and `/run/stream` endpoints.
 *
 * The agent will reason step-by-step (up to 5 loops), selecting tools from its
 * 18-tool registry on each iteration, until it produces a final answer.
 */
export interface IRunRequest {
    /**
     * Natural-language instruction for the agent.
     * Be specific — e.g. "Read package.json and summarise all dependencies".
     */
    task: string;
    /**
     * When `true`, the agent gains access to filesystem write tools (create, edit,
     * delete). Defaults to `false`. Only enable when file modification is required.
     */
    allowWrite?: boolean;
    /**
     * Overrides the automatic model router for every step in this run.
     * Leave `undefined` to let Manna pick the best profile per step.
     */
    profile?: ModelProfile;
}

/** Response body from the agent /run endpoint. */
export interface IRunResponse {
    result: string;
}

/* ─── IDE /autocomplete ─────────────────────────────────────── */

/**
 * Request body for the `/autocomplete` IDE endpoint.
 *
 * This endpoint bypasses the agent loop for low-latency fill-in-the-middle
 * completions powered by a code-specialised model.
 */
export interface IAutocompleteRequest {
    /**
     * The code text that appears before the cursor position.
     * The model will continue writing from this point.
     */
    prefix: string;
    /**
     * Optional code text that appears after the cursor.
     * Providing it enables fill-in-the-middle (FIM) mode for better context-aware completions.
     */
    suffix?: string;
    /**
     * Language identifier (e.g. `'typescript'`, `'python'`).
     * Helps the model produce syntax-correct output for the target language.
     */
    language?: string;
}

/** Response body from the /autocomplete endpoint. */
export interface IAutocompleteResponse {
    completion: string;
    model: string;
    language: string;
    cached: boolean;
    latencyMs: number;
    createdAtIso: string;
}

/* ─── IDE /lint-conventions ─────────────────────────────────── */

/**
 * Request body for the `/lint-conventions` IDE endpoint.
 *
 * This endpoint runs deterministic TypeScript/ESLint-style rules first, then
 * optionally layers in an AI model review for style, bugs, and best-practice
 * findings that static analysis cannot catch.
 */
export interface ILintConventionsRequest {
    content: string;
    language?: string;
    filePath?: string;
    /**
     * When `true`, an LLM review pass runs after the deterministic rules.
     * This adds AI-powered findings (source `'llm'`) but increases latency.
     * Defaults to `false` for fastest results.
     */
    includeLlm?: boolean;
    model?: string;
    /**
     * Maximum number of findings to include in the response.
     * Useful for preventing very large responses on big files.
     * Leave `undefined` to return all findings.
     */
    maxFindings?: number;
}

/**
 * A single lint finding produced by deterministic rules or LLM analysis.
 *
 * The `source` field identifies how the finding was produced:
 * - `'typescript'`  — Compiler diagnostic (type error, syntax error).
 * - `'convention'`  — Rule-based convention check (naming, formatting, imports).
 * - `'llm'`         — AI-powered suggestion that goes beyond static rules.
 */
export interface IFinding {
    source: 'typescript' | 'convention' | 'llm';
    severity: 'error' | 'warning' | 'info';
    category: string;
    message: string;
    line?: number;
    column?: number;
    rule?: string;
}

/** Aggregated summary of lint findings by severity. */
export interface ILintConventionsSummary {
    total: number;
    errors: number;
    warnings: number;
    infos: number;
    deterministicCount: number;
    llmCount: number;
}

/** Response body from the /lint-conventions endpoint. */
export interface ILintConventionsResponse {
    requestId: string;
    language: string;
    filePath: string;
    summary: ILintConventionsSummary;
    findings: IFinding[];
    llmModelUsed: string | undefined;
    latencyMs: number;
}

/* ─── IDE /page-review ──────────────────────────────────────── */

/**
 * Request body for the `/page-review` IDE endpoint.
 *
 * Performs a holistic AI-powered review of an entire source file, returning
 * categorised suggestions grouped by correctness, maintainability, standards,
 * and enhancements.
 */
export interface IPageReviewRequest {
    content: string;
    language?: string;
    filePath?: string;
    /**
     * A brief description of the project (e.g. `'Vue 3 SPA with Pinia stores'`).
     * Providing context makes the AI reviewer give more targeted, relevant suggestions
     * instead of generic advice.
     */
    projectContext?: string;
    model?: string;
}

/** A single categorised suggestion inside a page review. */
export interface ICategorizedSuggestion {
    title: string;
    detail: string;
    priority: 'high' | 'medium' | 'low';
}

/** Grouped review suggestions by quality category. */
export interface IPageReviewCategories {
    correctness: ICategorizedSuggestion[];
    maintainability: ICategorizedSuggestion[];
    standards: ICategorizedSuggestion[];
    enhancements: ICategorizedSuggestion[];
}

/** Response body from the /page-review endpoint. */
export interface IPageReviewResponse {
    requestId: string;
    model: string;
    language: string;
    filePath: string;
    categories: IPageReviewCategories;
    latencyMs: number;
}

/* ─── Upload /upload/image-classify ─────────────────────────── */

/** Response body from the /upload/image-classify endpoint. */
export interface IImageClassifyResponse {
    model: string;
    path?: string;
    response: string;
}

/* ─── Upload /upload/speech-to-text ─────────────────────────── */

/** Response body from the /upload/speech-to-text endpoint. */
export interface ISpeechToTextResponse {
    model: string;
    path?: string;
    text: string;
}

/* ─── Upload /upload/read-pdf ───────────────────────────────── */

/** Response body from the /upload/read-pdf endpoint. */
export interface IReadPdfResponse {
    path?: string;
    pageCount: number;
    text: string;
}

/* ─── OpenAI Compat /v1/models ──────────────────────────────── */

/** A single model object in the OpenAI-compatible model list. */
export interface IOpenAiModelObject {
    id: string;
    object: 'model';
    created: number;
    owned_by: string;
}

/** Response body from the /v1/models endpoint. */
export interface IOpenAiModelListResponse {
    object: 'list';
    data: IOpenAiModelObject[];
}

/* ─── OpenAI Compat /v1/chat/completions ────────────────────── */

/** Content part of a multimodal chat message. */
export type OpenAiChatMessageContentPart =
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string } };

/** Chat message content — plain string or multimodal parts array. */
export type OpenAiChatMessageContent = string | OpenAiChatMessageContentPart[];

/** A single message in an OpenAI-compatible chat conversation. */
export interface IOpenAiChatMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: OpenAiChatMessageContent;
}

/**
 * Request body for the `/v1/chat/completions` endpoint.
 *
 * This is the OpenAI-compatible interface exposed by Manna.  When `model` is set
 * to `'manna'` (or any `'manna-*'` variant), the request is routed through the
 * full agentic loop — the model can call tools, search the web, read files, etc.
 * When `model` is any other identifier (e.g. `'llama3.1:8b'`), the request goes
 * directly to Ollama for plain chat inference without tool access.
 */
export interface IOpenAiChatCompletionRequest {
    model: string;
    messages: IOpenAiChatMessage[];
    stream?: boolean;
    temperature?: number;
    max_tokens?: number;
    allowWrite?: boolean;
}

/** A single choice returned by a chat completion. */
export interface IOpenAiChatCompletionChoice {
    index: number;
    message: {
        role: 'assistant';
        content: string;
    };
    finish_reason: 'stop' | 'length';
}

/** Token usage statistics for a chat completion request. */
export interface IOpenAiUsage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
}

/** Response body from the /v1/chat/completions endpoint. */
export interface IOpenAiChatCompletionResponse {
    id: string;
    object: 'chat.completion';
    created: number;
    model: string;
    choices: IOpenAiChatCompletionChoice[];
    usage: IOpenAiUsage;
}

/* ─── Agent /run/stream SSE events ──────────────────────────── */

/**
 * SSE event emitted for each agent reasoning step.
 * Fires at the start of every loop iteration as the agent decides what to do next.
 */
export interface IAgentStepEvent {
    step: number;
    action: string;
    thought: string;
}

/**
 * SSE event emitted after a tool has been invoked by the agent.
 * The `error` field is set when the tool call failed; `result` contains the tool output.
 */
export interface IAgentToolEvent {
    tool: string;
    result?: string;
    error?: string;
}

/**
 * SSE event emitted when the model router selects a model profile for a step.
 * Fires before the LLM call so the UI can show routing decisions in real time.
 */
export interface IAgentRouteEvent {
    profile: string;
    model: string;
    reason: string;
}

/** SSE event emitted when the agent has produced its final answer. Terminates the stream. */
export interface IAgentDoneEvent {
    result: string;
}

/** SSE event emitted when the agent encounters an unrecoverable error. Terminates the stream. */
export interface IAgentErrorEvent {
    error: string;
}

/**
 * SSE event emitted when the agent exhausts its maximum step count (default 5)
 * without producing a final answer. Contains a partial summary of progress.
 */
export interface IAgentMaxStepsEvent {
    task: string;
    summary: string;
}

/**
 * Discriminated union of all SSE events emitted by `POST /run/stream`.
 *
 * Lifecycle: `step` → `route` → `tool` (repeated up to 5×) → `done` | `error` | `max_steps`.
 */
export type AgentStreamEvent =
    | { type: 'step'; data: IAgentStepEvent }
    | { type: 'tool'; data: IAgentToolEvent }
    | { type: 'route'; data: IAgentRouteEvent }
    | { type: 'done'; data: IAgentDoneEvent }
    | { type: 'error'; data: IAgentErrorEvent }
    | { type: 'max_steps'; data: IAgentMaxStepsEvent };

/* ─── Swarm ─────────────────────────────────────────────────── */

/** Request body for the `/run/swarm` and `/run/swarm/stream` endpoints. */
export interface ISwarmRequest {
    task: string;
    allowWrite?: boolean;
    profile?: ModelProfile;
    maxSubtasks?: number;
}

/** A single subtask result from a swarm execution. */
export interface ISwarmSubtaskResult {
    id: string;
    description: string;
    profile: string;
    success: boolean;
    answer: string;
    durationMs: number;
    error?: string;
}

/**
 * Response body from the `POST /run/swarm` endpoint.
 *
 * The swarm pipeline has three phases:
 * 1. **Decompose** — the orchestrator breaks the task into focused subtasks.
 * 2. **Delegate**  — each subtask runs in a separate agent loop, potentially in parallel.
 * 3. **Synthesise** — results are merged into a single coherent `result` string.
 *
 * `subtaskResults` contains the individual per-agent answers for inspection.
 * In streaming mode (`/run/swarm/stream`) these are not available; only `result` is sent.
 */
export interface ISwarmResponse {
    result: string;
    subtaskResults: ISwarmSubtaskResult[];
    decomposition: {
        reasoning: string;
        subtaskCount: number;
    };
    totalDurationMs: number;
}

/** SSE event emitted when the swarm orchestrator has decomposed the task into subtasks. */
export interface ISwarmDecomposedEvent {
    subtaskCount: number;
    reasoning: string;
    subtasks: Array<{ id: string; description: string; profile: string }>;
}

/** SSE event emitted when a subtask agent loop begins execution. */
export interface ISwarmSubtaskStartEvent {
    subtaskId: string;
    profile: string;
}

/** SSE event emitted when a subtask agent loop completes successfully. */
export interface ISwarmSubtaskDoneEvent {
    subtaskId: string;
    durationMs: number;
}

/** SSE event emitted when a subtask agent loop fails. */
export interface ISwarmSubtaskErrorEvent {
    subtaskId: string;
    error: string;
}

/** SSE event emitted when the swarm synthesis step has produced the final answer. */
export interface ISwarmDoneEvent {
    result: string;
    totalDurationMs: number;
    subtaskCount: number;
}

/**
 * Discriminated union of all SSE events emitted by `POST /run/swarm/stream`.
 *
 * Lifecycle: `decomposed` → `subtask_start` (×N, parallel) → `subtask_done`/`subtask_error`
 * → per-subtask `step`/`tool`/`route` interleaved → `done` | `error`.
 */
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

/* ─── Info endpoints ────────────────────────────────────────── */

/** A single Manna agent routing profile. */
export interface IInfoMode {
    profile: string;
    model: string;
    envVar: string;
    description: string;
}

/** Response body from GET /info/modes. */
export interface IInfoModesResponse {
    count: number;
    modes: IInfoMode[];
}

/** A single model from the connected Ollama instance. */
export interface IInfoModel {
    name: string;
    size: number | null;
    digest: string | null;
    modifiedAt: string | null;
    details: Record<string, unknown> | null;
}

/** Response body from GET /info/models. */
export interface IInfoModelsResponse {
    count: number;
    ollamaBaseUrl: string;
    models: IInfoModel[];
}

/** A single endpoint descriptor in the help response. */
export interface IHelpEndpoint {
    method: string;
    path: string;
    summary: string;
    params: Array<{
        name: string;
        type: string;
        required: boolean;
        description: string;
    }>;
}

/** Response body from GET /help. */
export interface IHelpResponse {
    description: string;
    endpointCount: number;
    endpoints: IHelpEndpoint[];
}
