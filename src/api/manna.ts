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

export class ApiError extends Error {
    status: number;
    retryAfterSeconds?: number;

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

function baseUrl(): string {
    return getMannaBaseUrl();
}

/* ─── System ─────────────────────────────────────────────────── */

export async function healthCheck(): Promise<IHealthResponse> {
    const response = await fetch(`${baseUrl()}/health`);
    return handleResponse<IHealthResponse>(response);
}

/* ─── Agent ──────────────────────────────────────────────────── */

export async function runTask(parameters: IRunRequest): Promise<IRunResponse> {
    const response = await fetch(`${baseUrl()}/run`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(parameters)
    });
    return handleResponse<IRunResponse>(response);
}

/* ─── OpenAI Compat ──────────────────────────────────────────── */

export async function listModels(): Promise<IOpenAiModelListResponse> {
    const response = await fetch(`${baseUrl()}/v1/models`);
    return handleResponse<IOpenAiModelListResponse>(response);
}

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

export async function pageReview(parameters: IPageReviewRequest): Promise<IPageReviewResponse> {
    const response = await fetch(`${baseUrl()}/page-review`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(parameters)
    });
    return handleResponse<IPageReviewResponse>(response);
}

/* ─── Upload (multipart) ─────────────────────────────────────── */

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

export async function uploadReadPdf(parameters: { file: File }): Promise<IReadPdfResponse> {
    return uploadFile<IReadPdfResponse>('/upload/read-pdf', parameters.file);
}

/* ─── Sketch (multipart) ─────────────────────────────────────── */

export async function inkSketch(parameters: {
    image: File;
    model?: string;
}): Promise<IInkResponse> {
    const extra: Record<string, string> = {};
    if (parameters.model) extra.model = parameters.model;
    return uploadFile<IInkResponse>('/ink', parameters.image, 'image', extra);
}

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
