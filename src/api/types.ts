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

/* ─── Sketch /ink ────────────────────────────────────────────── */

/** Response body from the /ink endpoint. */
export interface IInkResponse {
    requestId: string;
    model: string;
    originalName: string;
    inkingDescription: string;
    latencyMs: number;
}

/* ─── Sketch /ink-and-color ──────────────────────────────────── */

/** Detected state of the uploaded sketch image. */
export type SketchState = 'sketch' | 'inked' | 'unknown';

/** Response body from the /ink-and-color endpoint. */
export interface IInkAndColorResponse {
    requestId: string;
    model: string;
    originalName: string;
    detectedState: SketchState;
    colorizationDescription: string;
    latencyMs: number;
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
