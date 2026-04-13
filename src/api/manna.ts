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
    IInkResponse,
    IInkAndColorResponse,
    SketchState
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
    return response.json() as Promise<T>;
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

    if (!response.ok) {
        let errorMessage = response.statusText;
        try {
            const body = await response.json();
            errorMessage = body.error ?? errorMessage;
        } catch {
            /* ignore */
        }
        throw new ApiError(errorMessage, response.status);
    }

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

/* ─── Sketch (multipart) ─────────────────────────────────────── */

/**
 * Uploads a sketch image for AI inking analysis.
 *
 * @param parameters - The sketch image file and optional model override.
 * @returns The inking description and metadata.
 */
export async function inkSketch(parameters: {
    image: File;
    model?: string;
}): Promise<IInkResponse> {
    const extra: Record<string, string> = {};
    if (parameters.model) extra.model = parameters.model;
    return uploadFile<IInkResponse>('/ink', parameters.image, 'image', extra);
}

/**
 * Uploads a sketch image for combined inking and colorization.
 *
 * @param parameters - The sketch image, optional model, and detected sketch state.
 * @returns The colorization description and detected state.
 */
export async function inkAndColor(parameters: {
    image: File;
    model?: string;
    sketchState?: SketchState;
}): Promise<IInkAndColorResponse> {
    const extra: Record<string, string> = {};
    if (parameters.model) extra.model = parameters.model;
    if (parameters.sketchState) extra.sketchState = parameters.sketchState;
    return uploadFile<IInkAndColorResponse>('/ink-and-color', parameters.image, 'image', extra);
}
