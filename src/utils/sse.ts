import type { RunRequest, SwarmRequest, WorkflowRequest } from '@api';
import { getMannaBaseUrl } from '@/config';
import type { AgentStreamEvent, SwarmStreamEvent, WorkflowStreamEvent } from '@/api/sseEvents';

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
