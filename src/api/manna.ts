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
    AutocompleteRequest,
    AutocompleteResponse,
    ChatMessage,
    Conversation,
    ConversationWithMessages,
    CreateConversation201Response,
    CreateConversationRequest,
    CreateMessage201Response,
    CreateMessageRequest,
    GetConversation200Response,
    GetHelp200Response,
    GetInfoModels200Response,
    GetInfoModes200Response,
    HealthResponse,
    ListConversations200Response,
    LintConventionsRequest,
    LintResponse,
    PageReviewRequest,
    PageReviewResponse,
    RunRequest,
    RunResponse,
    SwarmRequest,
    SwarmResponse,
    UpdateConversationRequest,
    UpdateMessageRequest,
    UploadImageClassify200Response,
    UploadReadPdf200Response,
    UploadSpeechToText200Response,
    WorkflowRequest,
    WorkflowResponse
} from '@api';
import type { AgentStreamEvent, SwarmStreamEvent, WorkflowStreamEvent } from './sseEvents';

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
export async function healthCheck(): Promise<HealthResponse> {
    const response = await fetch(`${baseUrl()}/health`);
    return handleResponse<HealthResponse>(response);
}

/* ─── Agent ──────────────────────────────────────────────────── */

/**
 * Submits an autonomous agent task to the Manna backend.
 *
 * @param parameters - The task description, profile, and write-access flag.
 * @returns The agent's result string.
 */
export async function runTask(parameters: RunRequest): Promise<RunResponse> {
    const response = await fetch(`${baseUrl()}/run`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(parameters)
    });
    return handleResponse<RunResponse>(response);
}

/* ─── IDE ────────────────────────────────────────────────────── */

/**
 * Requests code autocompletion from the IDE backend.
 *
 * @param parameters - The code prefix, optional suffix, and language.
 * @returns The completion suggestion with metadata.
 */
export async function autocomplete(parameters: AutocompleteRequest): Promise<AutocompleteResponse> {
    const response = await fetch(`${baseUrl()}/autocomplete`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(parameters)
    });
    return handleResponse<AutocompleteResponse>(response);
}

/**
 * Submits code for convention-aware linting analysis.
 *
 * @param parameters - The source code, language, filename, and LLM options.
 * @returns Lint findings grouped by severity with an overall summary.
 */
export async function lintConventions(parameters: LintConventionsRequest): Promise<LintResponse> {
    const response = await fetch(`${baseUrl()}/lint-conventions`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(parameters)
    });
    return handleResponse<LintResponse>(response);
}

/**
 * Requests an AI-powered page-level code review.
 *
 * @param parameters - The source code, language, filename, and optional model.
 * @returns Review findings with request metadata.
 */
export async function pageReview(parameters: PageReviewRequest): Promise<PageReviewResponse> {
    const response = await fetch(`${baseUrl()}/page-review`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(parameters)
    });
    return handleResponse<PageReviewResponse>(response);
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
 * @returns The classification result.
 */
export async function uploadImageClassify(parameters: {
    file: File;
    prompt?: string;
    model?: string;
}): Promise<UploadImageClassify200Response> {
    const extra: Record<string, string> = {};
    if (parameters.prompt) extra.prompt = parameters.prompt;
    if (parameters.model) extra.model = parameters.model;
    return uploadFile<UploadImageClassify200Response>(
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
 * @returns The transcription payload.
 */
export async function uploadSpeechToText(parameters: {
    file: File;
    model?: string;
    language?: string;
    prompt?: string;
}): Promise<UploadSpeechToText200Response> {
    const extra: Record<string, string> = {};
    if (parameters.model) extra.model = parameters.model;
    if (parameters.language) extra.language = parameters.language;
    if (parameters.prompt) extra.prompt = parameters.prompt;
    return uploadFile<UploadSpeechToText200Response>(
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
 * @returns The extracted text payload.
 */
export async function uploadReadPdf(parameters: { file: File }): Promise<UploadReadPdf200Response> {
    return uploadFile<UploadReadPdf200Response>('/upload/read-pdf', parameters.file);
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
export async function* runTaskStream(parameters: RunRequest): AsyncGenerator<AgentStreamEvent> {
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
export async function runSwarm(parameters: SwarmRequest): Promise<SwarmResponse> {
    const response = await fetch(`${baseUrl()}/run/swarm`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(parameters)
    });
    return handleResponse<SwarmResponse>(response);
}

/**
 * Submits a multi-agent swarm task and streams lifecycle events via SSE.
 *
 * @param parameters - The task, profile, write-access flag, and optional subtask limit.
 * @yields Typed `SwarmStreamEvent` objects.
 * @throws {ApiError} When the initial HTTP response is not OK.
 */
export async function* runSwarmStream(parameters: SwarmRequest): AsyncGenerator<SwarmStreamEvent> {
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
export async function fetchInfoModes(): Promise<GetInfoModes200Response> {
    const response = await fetch(`${baseUrl()}/info/modes`);
    return handleResponse<GetInfoModes200Response>(response);
}

/**
 * Fetches the list of models currently available on the connected Ollama instance.
 *
 * @returns Model list with metadata (name, size, digest, modified date).
 */
export async function fetchInfoModels(): Promise<GetInfoModels200Response> {
    const response = await fetch(`${baseUrl()}/info/models`);
    return handleResponse<GetInfoModels200Response>(response);
}

/**
 * Fetches a structured JSON overview of all available Manna API endpoints.
 *
 * @returns API reference including endpoint descriptors and parameter schemas.
 */
export async function fetchHelp(): Promise<GetHelp200Response> {
    const response = await fetch(`${baseUrl()}/help`);
    return handleResponse<GetHelp200Response>(response);
}

/* ─── Chat conversations ─────────────────────────────────────── */

export async function listConversations(): Promise<Conversation[]> {
    const response = await fetch(`${baseUrl()}/chat/conversations`);
    if (!response.ok) await throwStreamError(response);
    const body = (await response.json()) as ListConversations200Response;
    return body.data?.conversations ?? [];
}

export async function createConversation(
    request: CreateConversationRequest
): Promise<Conversation> {
    const response = await fetch(`${baseUrl()}/chat/conversations`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(request)
    });
    if (!response.ok) await throwStreamError(response);
    const body = (await response.json()) as CreateConversation201Response;
    if (!body.data?.conversation) throw new ApiError('No conversation in response', 500);
    return body.data.conversation;
}

export async function getConversation(id: string): Promise<ConversationWithMessages> {
    const response = await fetch(`${baseUrl()}/chat/conversations/${encodeURIComponent(id)}`);
    if (!response.ok) await throwStreamError(response);
    const body = (await response.json()) as GetConversation200Response;
    if (!body.data?.conversation) throw new ApiError('No conversation in response', 500);
    return body.data.conversation;
}

export async function updateConversation(
    id: string,
    request: UpdateConversationRequest
): Promise<Conversation> {
    const response = await fetch(`${baseUrl()}/chat/conversations/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: JSON_HEADERS,
        body: JSON.stringify(request)
    });
    if (!response.ok) await throwStreamError(response);
    const json = await response.json();
    const conv = json?.data?.conversation;
    if (!conv) throw new ApiError('No conversation in response', 500);
    return conv as Conversation;
}

export async function deleteChatConversation(id: string): Promise<void> {
    const response = await fetch(`${baseUrl()}/chat/conversations/${encodeURIComponent(id)}`, {
        method: 'DELETE'
    });
    if (!response.ok) await throwStreamError(response);
}

export async function addChatMessage(
    conversationId: string,
    request: CreateMessageRequest
): Promise<ChatMessage> {
    const response = await fetch(
        `${baseUrl()}/chat/conversations/${encodeURIComponent(conversationId)}/messages`,
        {
            method: 'POST',
            headers: JSON_HEADERS,
            body: JSON.stringify(request)
        }
    );
    if (!response.ok) await throwStreamError(response);
    const body = (await response.json()) as CreateMessage201Response;
    if (!body.data?.message) throw new ApiError('No message in response', 500);
    return body.data.message;
}

export async function editChatMessage(
    conversationId: string,
    messageId: string,
    request: UpdateMessageRequest
): Promise<ChatMessage> {
    const response = await fetch(
        `${baseUrl()}/chat/conversations/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}`,
        {
            method: 'PUT',
            headers: JSON_HEADERS,
            body: JSON.stringify(request)
        }
    );
    if (!response.ok) await throwStreamError(response);
    const json = await response.json();
    const message = json?.data?.message;
    if (!message) throw new ApiError('No message in response', 500);
    return message as ChatMessage;
}

export async function deleteChatMessage(conversationId: string, messageId: string): Promise<void> {
    const response = await fetch(
        `${baseUrl()}/chat/conversations/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}`,
        {
            method: 'DELETE'
        }
    );
    if (!response.ok) await throwStreamError(response);
}

/* ─── Workflow ─────────────────────────────────────────────────── */

/**
 * Submits a sequential workflow and waits for the complete JSON result.
 *
 * @param parameters - The ordered step list, carry mode, profile, and write-access flag.
 * @returns The workflow result including per-step breakdown and timing.
 */
export async function runWorkflow(parameters: WorkflowRequest): Promise<WorkflowResponse> {
    const response = await fetch(`${baseUrl()}/workflow`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(parameters)
    });
    return handleResponse<WorkflowResponse>(response);
}

/**
 * Submits a sequential workflow and streams lifecycle events via SSE.
 *
 * @param parameters - The ordered step list, carry mode, profile, and write-access flag.
 * @yields Typed `WorkflowStreamEvent` objects.
 * @throws {ApiError} When the initial HTTP response is not OK.
 */
export async function* runWorkflowStream(
    parameters: WorkflowRequest
): AsyncGenerator<WorkflowStreamEvent> {
    const response = await fetch(`${baseUrl()}/workflow/stream`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(parameters)
    });

    if (!response.ok) await throwStreamError(response);

    yield* parseSseStream<WorkflowStreamEvent>(response);
}

export { type Conversation, type ChatMessage, type ConversationWithMessages } from '@api';
