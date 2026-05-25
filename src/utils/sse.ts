import type { RunRequest, SwarmRequest, WorkflowRequest, CreateMessageRequest } from '@api';
import { getMannaBaseUrl } from '@/config';
import type {
    AgentStreamEvent,
    ChatStreamEvent,
    SwarmStreamEvent,
    WorkflowStreamEvent
} from '@/api/sseEvents';

const JSON_HEADERS = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'Content-Type': 'application/json',
    Accept: 'text/event-stream'
} as const;

function getErrorMessage(status: number, statusText: string, bodyText: string): string {
    if (!bodyText) return `HTTP ${String(status)} ${statusText}`;

    try {
        const parsed = JSON.parse(bodyText) as { error?: string; message?: string };
        return parsed.error ?? parsed.message ?? `HTTP ${String(status)} ${statusText}`;
    } catch {
        return bodyText;
    }
}

async function* parseSseStream<T extends { type: string; data: unknown }>(
    response: Response
): AsyncGenerator<T> {
    if (!response.body) throw new Error('Response body is missing');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let eventType = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() ?? '';

        for (const chunk of chunks) {
            const lines = chunk.split('\n');
            let data = '';

            for (const line of lines) {
                if (line.startsWith('event:')) eventType = line.slice(6).trim();
                if (line.startsWith('data:')) data += line.slice(5).trim();
            }

            if (!eventType || !data) continue;
            const parsedData: unknown = JSON.parse(data);
            yield { type: eventType, data: parsedData } as T;
            eventType = '';
        }
    }
}

async function openSse(url: string, payload: unknown): Promise<Response> {
    const response = await fetch(url, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const bodyText = await response.text();
        throw new Error(getErrorMessage(response.status, response.statusText, bodyText));
    }

    return response;
}

export async function* runTaskStream(parameters: RunRequest): AsyncGenerator<AgentStreamEvent> {
    const response = await openSse(`${getMannaBaseUrl()}/run/stream`, parameters);
    yield* parseSseStream<AgentStreamEvent>(response);
}

export async function* runSwarmStream(parameters: SwarmRequest): AsyncGenerator<SwarmStreamEvent> {
    const response = await openSse(`${getMannaBaseUrl()}/run/swarm/stream`, parameters);
    yield* parseSseStream<SwarmStreamEvent>(response);
}

export async function* runWorkflowStream(
    parameters: WorkflowRequest
): AsyncGenerator<WorkflowStreamEvent> {
    const response = await openSse(`${getMannaBaseUrl()}/workflow/stream`, parameters);
    yield* parseSseStream<WorkflowStreamEvent>(response);
}

/**
 * Sends a user message to a conversation and streams the backend's reply as
 * Server-Sent Events. Calls the dedicated streaming endpoint
 * `POST /chat/conversations/:id/messages/stream` (Option A contract split).
 *
 * Expected SSE events:
 * - `message` — the persisted user ChatMessage, emitted immediately on save.
 * - `reply`   — the assistant ChatMessage plus inference metadata.
 * - `error`   — unrecoverable inference failure with an error string.
 */
export async function* sendChatMessageStream(
    conversationId: string,
    request: CreateMessageRequest
): AsyncGenerator<ChatStreamEvent> {
    const url = `${getMannaBaseUrl()}/chat/conversations/${encodeURIComponent(conversationId)}/messages/stream`;
    const response = await openSse(url, request);
    yield* parseSseStream<ChatStreamEvent>(response);
}

/* ─── GET-based SSE (for long-lived observability streams) ──── */

/**
 * Opens a GET SSE connection with AbortController support.
 * Unlike `openSse` (POST, fire-and-forget), this is designed for
 * long-lived streams that the caller can cancel at any time.
 *
 * @param url    - Full URL including query params.
 * @param signal - AbortSignal to cancel the connection.
 */
async function openSseGet(url: string, signal: AbortSignal): Promise<Response> {
    const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'text/event-stream' },
        signal
    });

    if (!response.ok) {
        const bodyText = await response.text();
        throw new Error(getErrorMessage(response.status, response.statusText, bodyText));
    }

    return response;
}

/**
 * Connects to a GET-based SSE endpoint and yields parsed events.
 * The caller passes an `AbortController` to cleanly disconnect.
 *
 * @param url    - Full URL with query string filters.
 * @param signal - AbortSignal for cancellation.
 */
export async function* openEventStream<T extends { type: string; data: unknown }>(
    url: string,
    signal: AbortSignal
): AsyncGenerator<T> {
    const response = await openSseGet(url, signal);
    yield* parseSseStream<T>(response);
}
