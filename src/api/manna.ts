/**
 * @module manna
 *
 * HTTP client functions for every Manna backend endpoint.
 *
 * All functions use the native `fetch` API and return typed response objects.
 * Failures are signalled by throwing an {@link ApiError} with the HTTP status code.
 * Streaming endpoints are implemented as `AsyncGenerator` functions that yield
 * typed event objects as they arrive over the wire.
 *
 * Import the base URL resolver from `@/config` — never hard-code backend URLs.
 */
import { getMannaBaseUrl } from '@/config';
import type {
    IRunRequest,
    IRunResponse,
    IAutocompleteRequest,
    IAutocompleteResponse,
    ILintConventionsRequest,
    ILintConventionsResponse,
    IPageReviewRequest,
    IPageReviewResponse,
    IImageClassifyResponse,
    ISpeechToTextResponse,
    IReadPdfResponse,
    IHealthResponse,
    IOpenAiModelListResponse,
    IOpenAiChatCompletionRequest,
    IOpenAiChatCompletionResponse,
    AgentStreamEvent,
    ISwarmRequest,
    ISwarmResponse,
    SwarmStreamEvent,
    IInfoModesResponse,
    IInfoModelsResponse,
    IHelpResponse,
    IWorkflowRequest,
    IWorkflowResponse,
    WorkflowStreamEvent
} from './types';

/* ─── Error class ────────────────────────────────────────────── */

/**
 * Custom error thrown when an API request fails.
 * Carries the HTTP status code and an optional retry-after delay.
 */
export class ApiError extends Error {
    status: number;
    retryAfterSeconds?: number;

    /**
     * @param message            - Human-readable error description.
     * @param status             - HTTP status code from the response.
     * @param retryAfterSeconds  - Seconds to wait before retrying (rate-limit scenarios).
     */
    constructor(message: string, status: number, retryAfterSeconds?: number) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.retryAfterSeconds = retryAfterSeconds;
    }
}

/* ─── Helpers ────────────────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/naming-convention
const JSON_HEADERS = { 'Content-Type': 'application/json' } as const;

/**
 * Parses a fetch Response and returns the typed JSON body, or throws an ApiError on failure.
 *
 * @param response - The raw fetch Response object.
 * @returns The parsed response body cast to `T`.
 * @throws {ApiError} When the response status is not OK.
 */
async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        await throwStreamError(response);
    }
    return response.json() as Promise<T>;
}

/**
 * Reads error details from a failed response and throws an {@link ApiError}.
 *
 * Used by both JSON and streaming endpoints.  Streaming endpoints must check
 * `response.ok` *before* consuming the body with a reader, so they call this
 * helper directly instead of going through {@link handleResponse}.
 *
 * @param response - A fetch Response with a non-OK status.
 * @throws {ApiError} Always — this function never returns normally.
 */
async function throwStreamError(response: Response): Promise<never> {
    let errorMessage = response.statusText;
    let retryAfter: number | undefined;
    try {
        const body = await response.json();
        errorMessage = body.error ?? errorMessage;
        retryAfter = body.retryAfterSeconds;
    } catch {
        /* ignore parse errors */
    }
    throw new ApiError(errorMessage, response.status, retryAfter);
}

/**
 * Returns the currently configured Manna backend base URL.
 *
 * @returns The backend base URL string.
 */
function baseUrl(): string {
    return getMannaBaseUrl();
}

/* ─── System ─────────────────────────────────────────────────── */

/**
 * Performs a health-check request against the Manna backend.
 *
 * @returns The health status payload from the server.
 */
export async function healthCheck(): Promise<IHealthResponse> {
    const response = await fetch(`${baseUrl()}/health`);
    return handleResponse<IHealthResponse>(response);
}

/* ─── Agent ──────────────────────────────────────────────────── */

/**
 * Submits an autonomous agent task to the Manna backend.
 *
 * @param parameters - The task description, profile, and write-access flag.
 * @returns The agent's result string.
 */
export async function runTask(parameters: IRunRequest): Promise<IRunResponse> {
    const response = await fetch(`${baseUrl()}/run`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(parameters)
    });
    return handleResponse<IRunResponse>(response);
}

/* ─── OpenAI Compat ──────────────────────────────────────────── */

/**
 * Fetches the list of available models from the OpenAI-compatible endpoint.
 *
 * @returns The model list response containing all available model objects.
 */
export async function listModels(): Promise<IOpenAiModelListResponse> {
    const response = await fetch(`${baseUrl()}/v1/models`);
    return handleResponse<IOpenAiModelListResponse>(response);
}

/**
 * Sends a non-streaming chat completion request.
 *
 * @param parameters - The chat messages, model, and optional generation settings.
 * @returns The complete assistant response with usage statistics.
 */
export async function chatCompletion(
    parameters: IOpenAiChatCompletionRequest
): Promise<IOpenAiChatCompletionResponse> {
    const response = await fetch(`${baseUrl()}/v1/chat/completions`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({ ...parameters, stream: false })
    });
    return handleResponse<IOpenAiChatCompletionResponse>(response);
}

/**
 * Opens a streaming chat completion and yields content deltas as they arrive.
 *
 * @param parameters - The chat messages and model (stream flag is forced to `true`).
 * @yields Individual text chunks from the assistant's response.
 * @throws {ApiError} When the initial HTTP response is not OK.
 */
export async function* streamChat(
    parameters: Omit<IOpenAiChatCompletionRequest, 'stream'>
): AsyncGenerator<string> {
    const response = await fetch(`${baseUrl()}/v1/chat/completions`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({ ...parameters, stream: true })
    });

    if (!response.ok) await throwStreamError(response);

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') return;
            try {
                const chunk = JSON.parse(data);
                const delta = chunk.choices?.[0]?.delta?.content;
                if (delta) yield delta as string;
            } catch {
                /* skip malformed chunks */
            }
        }
    }
}

/* ─── IDE ────────────────────────────────────────────────────── */

/**
 * Requests code autocompletion from the IDE backend.
 *
 * @param parameters - The code prefix, optional suffix, and language.
 * @returns The completion suggestion with metadata.
 */
export async function autocomplete(
    parameters: IAutocompleteRequest
): Promise<IAutocompleteResponse> {
    const response = await fetch(`${baseUrl()}/autocomplete`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(parameters)
    });
    return handleResponse<IAutocompleteResponse>(response);
}

/**
 * Submits code for convention-aware linting analysis.
 *
 * @param parameters - The source content, language, file path, and LLM options.
 * @returns Lint findings grouped by severity with an overall summary.
 */
export async function lintConventions(
    parameters: ILintConventionsRequest
): Promise<ILintConventionsResponse> {
    const response = await fetch(`${baseUrl()}/lint-conventions`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(parameters)
    });
    return handleResponse<ILintConventionsResponse>(response);
}

/**
 * Requests an AI-powered page-level code review.
 *
 * @param parameters - The source content, language, file path, and optional model.
 * @returns Categorised review suggestions (correctness, maintainability, etc.).
 */
export async function pageReview(parameters: IPageReviewRequest): Promise<IPageReviewResponse> {
    const response = await fetch(`${baseUrl()}/page-review`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(parameters)
    });
    return handleResponse<IPageReviewResponse>(response);
}

/* ─── Upload (multipart) ─────────────────────────────────────── */

/**
 * Uploads a file to the given endpoint using multipart/form-data.
 *
 * @param endpoint    - The API path (e.g. `/upload/image-classify`).
 * @param file        - The file to upload.
 * @param fieldName   - The form field name for the file (defaults to `'file'`).
 * @param extraFields - Additional string key/value pairs to include in the form.
 * @returns The typed response body from the server.
 */
async function uploadFile<T>(
    endpoint: string,
    file: File,
    fieldName = 'file',
    extraFields?: Record<string, string>
): Promise<T> {
    const form = new FormData();
    form.append(fieldName, file);
    if (extraFields) {
        for (const [key, value] of Object.entries(extraFields)) {
            if (value !== undefined && value !== '') form.append(key, value);
        }
    }
    const response = await fetch(`${baseUrl()}${endpoint}`, {
        method: 'POST',
        body: form
    });
    return handleResponse<T>(response);
}

/**
 * Uploads an image for AI classification.
 *
 * @param parameters - The image file and optional prompt/model overrides.
 * @returns The classification result with the model used.
 */
export async function uploadImageClassify(parameters: {
    file: File;
    prompt?: string;
    model?: string;
}): Promise<IImageClassifyResponse> {
    const extra: Record<string, string> = {};
    if (parameters.prompt) extra.prompt = parameters.prompt;
    if (parameters.model) extra.model = parameters.model;
    return uploadFile<IImageClassifyResponse>(
        '/upload/image-classify',
        parameters.file,
        'file',
        extra
    );
}

/**
 * Uploads an audio file for speech-to-text transcription.
 *
 * @param parameters - The audio file, optional model, language hint, and prompt.
 * @returns The transcription text and model used.
 */
export async function uploadSpeechToText(parameters: {
    file: File;
    model?: string;
    language?: string;
    prompt?: string;
}): Promise<ISpeechToTextResponse> {
    const extra: Record<string, string> = {};
    if (parameters.model) extra.model = parameters.model;
    if (parameters.language) extra.language = parameters.language;
    if (parameters.prompt) extra.prompt = parameters.prompt;
    return uploadFile<ISpeechToTextResponse>(
        '/upload/speech-to-text',
        parameters.file,
        'file',
        extra
    );
}

/**
 * Uploads a PDF file for text extraction.
 *
 * @param parameters - The PDF file to read.
 * @returns The extracted text content and page count.
 */
export async function uploadReadPdf(parameters: { file: File }): Promise<IReadPdfResponse> {
    return uploadFile<IReadPdfResponse>('/upload/read-pdf', parameters.file);
}



/* ─── SSE helper ─────────────────────────────────────────────── */

/**
 * Shared SSE parser: yields typed events from a streaming `text/event-stream` response.
 * Expects `event: <type>\ndata: <json>\n\n` framing from the backend.
 *
 * @param response - A successful fetch Response with a readable body.
 * @yields Parsed SSE event objects with `type` and `data` properties.
 */
async function* parseSseStream<T extends { type: string; data: unknown }>(
    response: Response
): AsyncGenerator<T> {
    if (!response.body) throw new ApiError('Response body is missing', 500);
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Split on double-newline (SSE block delimiter)
        const blocks = buffer.split('\n\n');
        buffer = blocks.pop() ?? '';

        for (const block of blocks) {
            if (!block.trim()) continue;
            const lines = block.split('\n');
            let eventType = '';
            let dataLine = '';

            for (const line of lines) {
                if (line.startsWith('event: ')) {
                    eventType = line.slice(7).trim();
                } else if (line.startsWith('data: ')) {
                    dataLine = line.slice(6).trim();
                }
            }

            if (!eventType || !dataLine) continue;
            try {
                const parsed = JSON.parse(dataLine);
                yield { type: eventType, data: parsed } as T;
            } catch {
                /* skip malformed SSE frames */
            }
        }
    }
}

/* ─── Agent streaming ────────────────────────────────────────── */

/**
 * Submits an agent task and streams lifecycle events as they arrive via SSE.
 *
 * @param parameters - The task description, profile, and write-access flag.
 * @yields Typed `AgentStreamEvent` objects (step, tool, route, done, error, max_steps).
 * @throws {ApiError} When the initial HTTP response is not OK.
 */
export async function* runTaskStream(
    parameters: IRunRequest
): AsyncGenerator<AgentStreamEvent> {
    const response = await fetch(`${baseUrl()}/run/stream`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(parameters)
    });

    if (!response.ok) await throwStreamError(response);

    yield* parseSseStream<AgentStreamEvent>(response);
}

/* ─── Swarm ──────────────────────────────────────────────────── */

/**
 * Submits a multi-agent swarm task and waits for the complete JSON result.
 *
 * @param parameters - The task, profile, write-access flag, and optional subtask limit.
 * @returns The swarm result including subtask breakdown and timing.
 */
export async function runSwarm(parameters: ISwarmRequest): Promise<ISwarmResponse> {
    const response = await fetch(`${baseUrl()}/run/swarm`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(parameters)
    });
    return handleResponse<ISwarmResponse>(response);
}

/**
 * Submits a multi-agent swarm task and streams lifecycle events via SSE.
 *
 * @param parameters - The task, profile, write-access flag, and optional subtask limit.
 * @yields Typed `SwarmStreamEvent` objects.
 * @throws {ApiError} When the initial HTTP response is not OK.
 */
export async function* runSwarmStream(
    parameters: ISwarmRequest
): AsyncGenerator<SwarmStreamEvent> {
    const response = await fetch(`${baseUrl()}/run/swarm/stream`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(parameters)
    });

    if (!response.ok) await throwStreamError(response);

    yield* parseSseStream<SwarmStreamEvent>(response);
}

/* ─── Info endpoints ─────────────────────────────────────────── */

/**
 * Fetches the list of Manna agent routing profiles with resolved model names.
 *
 * @returns Mode list including profile names, model identifiers, and descriptions.
 */
export async function fetchInfoModes(): Promise<IInfoModesResponse> {
    const response = await fetch(`${baseUrl()}/info/modes`);
    return handleResponse<IInfoModesResponse>(response);
}

/**
 * Fetches the list of models currently available on the connected Ollama instance.
 *
 * @returns Model list with metadata (name, size, digest, modified date).
 */
export async function fetchInfoModels(): Promise<IInfoModelsResponse> {
    const response = await fetch(`${baseUrl()}/info/models`);
    return handleResponse<IInfoModelsResponse>(response);
}

/**
 * Fetches a structured JSON overview of all available Manna API endpoints.
 *
 * @returns API reference including endpoint descriptors and parameter schemas.
 */
export async function fetchHelp(): Promise<IHelpResponse> {
    const response = await fetch(`${baseUrl()}/help`);
    return handleResponse<IHelpResponse>(response);
}

/* ─── Workflow ─────────────────────────────────────────────────── */

/**
 * Submits a sequential workflow and waits for the complete JSON result.
 *
 * @param parameters - The ordered step list, carry mode, profile, and write-access flag.
 * @returns The workflow result including per-step breakdown and timing.
 */
export async function runWorkflow(parameters: IWorkflowRequest): Promise<IWorkflowResponse> {
    const response = await fetch(`${baseUrl()}/workflow`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(parameters)
    });
    return handleResponse<IWorkflowResponse>(response);
}

/**
 * Submits a sequential workflow and streams lifecycle events via SSE.
 *
 * @param parameters - The ordered step list, carry mode, profile, and write-access flag.
 * @yields Typed `WorkflowStreamEvent` objects.
 * @throws {ApiError} When the initial HTTP response is not OK.
 */
export async function* runWorkflowStream(
    parameters: IWorkflowRequest
): AsyncGenerator<WorkflowStreamEvent> {
    const response = await fetch(`${baseUrl()}/workflow/stream`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(parameters)
    });

    if (!response.ok) await throwStreamError(response);

    yield* parseSseStream<WorkflowStreamEvent>(response);
}
