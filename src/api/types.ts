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

/** Available model profiles for backend inference routing. */
export type ModelProfile = 'fast' | 'reasoning' | 'code' | 'default';

/* ─── System ─────────────────────────────────────────────────── */

/** Server health-check payload. */
export interface IHealthResponse {
    status: 'ok';
    timestamp: string;
}

/* ─── Agent /run ─────────────────────────────────────────────── */

/** Request body for the agent /run endpoint. */
export interface IRunRequest {
    task: string;
    allowWrite?: boolean;
    profile?: ModelProfile;
}

/** Response body from the agent /run endpoint. */
export interface IRunResponse {
    result: string;
}

/* ─── IDE /autocomplete ─────────────────────────────────────── */

/** Request body for the /autocomplete endpoint. */
export interface IAutocompleteRequest {
    prefix: string;
    suffix?: string;
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

/** Request body for the /lint-conventions endpoint. */
export interface ILintConventionsRequest {
    content: string;
    language?: string;
    filePath?: string;
    includeLlm?: boolean;
    model?: string;
    maxFindings?: number;
}

/** A single lint finding produced by deterministic or LLM analysis. */
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

/** Request body for the /page-review endpoint. */
export interface IPageReviewRequest {
    content: string;
    language?: string;
    filePath?: string;
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

/** Request body for the /v1/chat/completions endpoint. */
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

/** SSE event: agent step completed */
export interface IAgentStepEvent {
    step: number;
    action: string;
    thought: string;
}

/** SSE event: tool executed */
export interface IAgentToolEvent {
    tool: string;
    result?: string;
    error?: string;
}

/** SSE event: model profile routed */
export interface IAgentRouteEvent {
    profile: string;
    model: string;
    reason: string;
}

/** SSE event: agent finished */
export interface IAgentDoneEvent {
    result: string;
}

/** SSE event: agent error */
export interface IAgentErrorEvent {
    error: string;
}

/** SSE event: agent max steps exhausted */
export interface IAgentMaxStepsEvent {
    task: string;
    summary: string;
}

/** Discriminated union of all SSE events from /run/stream */
export type AgentStreamEvent =
    | { type: 'step'; data: IAgentStepEvent }
    | { type: 'tool'; data: IAgentToolEvent }
    | { type: 'route'; data: IAgentRouteEvent }
    | { type: 'done'; data: IAgentDoneEvent }
    | { type: 'error'; data: IAgentErrorEvent }
    | { type: 'max_steps'; data: IAgentMaxStepsEvent };

/* ─── Swarm ─────────────────────────────────────────────────── */

/** Request body for the /run/swarm endpoint. */
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

/** Response body from the /run/swarm endpoint. */
export interface ISwarmResponse {
    result: string;
    subtaskResults: ISwarmSubtaskResult[];
    decomposition: {
        reasoning: string;
        subtaskCount: number;
    };
    totalDurationMs: number;
}

/** SSE event: swarm decomposition complete */
export interface ISwarmDecomposedEvent {
    subtaskCount: number;
    reasoning: string;
    subtasks: Array<{ id: string; description: string; profile: string }>;
}

/** SSE event: subtask started */
export interface ISwarmSubtaskStartEvent {
    subtaskId: string;
    profile: string;
}

/** SSE event: subtask completed */
export interface ISwarmSubtaskDoneEvent {
    subtaskId: string;
    durationMs: number;
}

/** SSE event: subtask failed */
export interface ISwarmSubtaskErrorEvent {
    subtaskId: string;
    error: string;
}

/** SSE event: swarm finished */
export interface ISwarmDoneEvent {
    result: string;
    totalDurationMs: number;
    subtaskCount: number;
}

/** Discriminated union of all SSE events from /run/swarm/stream */
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
