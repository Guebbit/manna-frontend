/* ─── Shared ─────────────────────────────────────────────────── */

export interface IErrorResponse {
    error: string;
    requestId?: string;
}

export interface IRateLimitResponse {
    error: string;
    retryAfterSeconds: number;
}

export type ModelProfile = 'fast' | 'reasoning' | 'code' | 'default';

/* ─── System ─────────────────────────────────────────────────── */

export interface IHealthResponse {
    status: 'ok';
    timestamp: string;
}

/* ─── Agent /run ─────────────────────────────────────────────── */

export interface IRunRequest {
    task: string;
    allowWrite?: boolean;
    profile?: ModelProfile;
}

export interface IRunResponse {
    result: string;
}

/* ─── IDE /autocomplete ─────────────────────────────────────── */

export interface IAutocompleteRequest {
    prefix: string;
    suffix?: string;
    language?: string;
}

export interface IAutocompleteResponse {
    completion: string;
    model: string;
    language: string;
    cached: boolean;
    latencyMs: number;
    createdAtIso: string;
}

/* ─── IDE /lint-conventions ─────────────────────────────────── */

export interface ILintConventionsRequest {
    content: string;
    language?: string;
    filePath?: string;
    includeLlm?: boolean;
    model?: string;
    maxFindings?: number;
}

export interface IFinding {
    source: 'typescript' | 'convention' | 'llm';
    severity: 'error' | 'warning' | 'info';
    category: string;
    message: string;
    line?: number;
    column?: number;
    rule?: string;
}

export interface ILintConventionsSummary {
    total: number;
    errors: number;
    warnings: number;
    infos: number;
    deterministicCount: number;
    llmCount: number;
}

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

export interface IPageReviewRequest {
    content: string;
    language?: string;
    filePath?: string;
    projectContext?: string;
    model?: string;
}

export interface ICategorizedSuggestion {
    title: string;
    detail: string;
    priority: 'high' | 'medium' | 'low';
}

export interface IPageReviewCategories {
    correctness: ICategorizedSuggestion[];
    maintainability: ICategorizedSuggestion[];
    standards: ICategorizedSuggestion[];
    enhancements: ICategorizedSuggestion[];
}

export interface IPageReviewResponse {
    requestId: string;
    model: string;
    language: string;
    filePath: string;
    categories: IPageReviewCategories;
    latencyMs: number;
}

/* ─── Upload /upload/image-classify ─────────────────────────── */

export interface IImageClassifyResponse {
    model: string;
    path?: string;
    response: string;
}

/* ─── Upload /upload/speech-to-text ─────────────────────────── */

export interface ISpeechToTextResponse {
    model: string;
    path?: string;
    text: string;
}

/* ─── Upload /upload/read-pdf ───────────────────────────────── */

export interface IReadPdfResponse {
    path?: string;
    pageCount: number;
    text: string;
}

/* ─── Sketch /ink ────────────────────────────────────────────── */

export interface IInkResponse {
    requestId: string;
    model: string;
    originalName: string;
    inkingDescription: string;
    latencyMs: number;
}

/* ─── Sketch /ink-and-color ──────────────────────────────────── */

export type SketchState = 'sketch' | 'inked' | 'unknown';

export interface IInkAndColorResponse {
    requestId: string;
    model: string;
    originalName: string;
    detectedState: SketchState;
    colorizationDescription: string;
    latencyMs: number;
}

/* ─── OpenAI Compat /v1/models ──────────────────────────────── */

export interface IOpenAiModelObject {
    id: string;
    object: 'model';
    created: number;
    owned_by: string;
}

export interface IOpenAiModelListResponse {
    object: 'list';
    data: IOpenAiModelObject[];
}

/* ─── OpenAI Compat /v1/chat/completions ────────────────────── */

export type OpenAiChatMessageContentPart =
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string } };

export type OpenAiChatMessageContent = string | OpenAiChatMessageContentPart[];

export interface IOpenAiChatMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: OpenAiChatMessageContent;
}

export interface IOpenAiChatCompletionRequest {
    model: string;
    messages: IOpenAiChatMessage[];
    stream?: boolean;
    temperature?: number;
    max_tokens?: number;
    allowWrite?: boolean;
}

export interface IOpenAiChatCompletionChoice {
    index: number;
    message: {
        role: 'assistant';
        content: string;
    };
    finish_reason: 'stop' | 'length';
}

export interface IOpenAiUsage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
}

export interface IOpenAiChatCompletionResponse {
    id: string;
    object: 'chat.completion';
    created: number;
    model: string;
    choices: IOpenAiChatCompletionChoice[];
    usage: IOpenAiUsage;
}
