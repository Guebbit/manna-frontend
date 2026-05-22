import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useChatStore } from '@/stores/chat';
import type { Conversation, ChatMessage } from '@api';
import type { ChatStreamEvent } from '@/api/sseEvents';

/** Helper that yields a sequence of SSE events from an array. */
async function* mockChatStream(events: ChatStreamEvent[]): AsyncGenerator<ChatStreamEvent> {
    for (const event of events) {
        yield event;
    }
}

const mockUserMessage: ChatMessage = {
    id: 'msg-user',
    conversationId: 'conv-1',
    role: 'user',
    content: 'Hello',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
};

const mockAssistantMessage: ChatMessage = {
    id: 'msg-asst',
    conversationId: 'conv-1',
    role: 'assistant',
    content: 'Hi there!',
    createdAt: '2026-01-01T00:00:01.000Z',
    updatedAt: '2026-01-01T00:00:01.000Z'
};

vi.mock('@/utils/api', async (importOriginal) => {
    const original = await importOriginal<typeof import('@/utils/api')>();
    return {
        ...original,
        chatApi: {
            listConversations: vi.fn().mockResolvedValue({ data: { data: { conversations: [] } } }),
            createConversation: vi
                .fn()
                .mockImplementation((req: { createConversationRequest?: { title?: string } }) =>
                    Promise.resolve({
                        data: {
                            data: {
                                conversation: {
                                    id: 'new-id',
                                    title:
                                        req.createConversationRequest?.title ?? 'New conversation',
                                    profile: undefined,
                                    createdAt: '2026-01-01T00:00:00.000Z',
                                    updatedAt: '2026-01-01T00:00:00.000Z'
                                } satisfies Conversation
                            }
                        }
                    })
                ),
            getConversation: vi.fn().mockResolvedValue({
                data: {
                    data: {
                        conversation: {
                            id: 'new-id',
                            title: 'New conversation',
                            profile: undefined,
                            createdAt: '2026-01-01T00:00:00.000Z',
                            updatedAt: '2026-01-01T00:00:00.000Z',
                            messages: []
                        }
                    }
                }
            }),
            updateConversation: vi
                .fn()
                .mockImplementation(
                    (req: {
                        conversationId: string;
                        updateConversationRequest: { title?: string };
                    }) =>
                        Promise.resolve({
                            data: {
                                data: {
                                    conversation: {
                                        id: req.conversationId,
                                        title: req.updateConversationRequest.title ?? '',
                                        profile: undefined,
                                        createdAt: '2026-01-01T00:00:00.000Z',
                                        updatedAt: '2026-01-01T00:00:00.000Z'
                                    } satisfies Conversation
                                }
                            }
                        })
                ),
            deleteConversation: vi.fn().mockImplementation(() => Promise.resolve({ data: {} })),
            createMessage: vi
                .fn()
                .mockResolvedValue({ data: { data: { message: {} as ChatMessage } } }),
            updateMessage: vi
                .fn()
                .mockResolvedValue({ data: { data: { message: {} as ChatMessage } } }),
            deleteMessage: vi.fn().mockImplementation(() => Promise.resolve({ data: {} }))
        }
    };
});

vi.mock('@/utils/sse', async (importOriginal) => {
    const original = await importOriginal<typeof import('@/utils/sse')>();
    return {
        ...original,
        runTaskStream: vi.fn(),
        sendChatMessageStream: vi.fn()
    };
});

describe('useChatStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
    });

    it('starts with no conversations', () => {
        const store = useChatStore();
        expect(store.conversations).toEqual([]);
    });

    it('creates a new conversation and adds it to the list', async () => {
        const store = useChatStore();
        const conv = await store.newConversation({ title: 'My chat' });
        expect(conv).toBeDefined();
        expect(store.conversations).toHaveLength(1);
        expect(store.conversations[0].id).toBe('new-id');
    });

    it('deletes a conversation from the list', async () => {
        const store = useChatStore();
        await store.newConversation({});
        expect(store.conversations).toHaveLength(1);
        await store.deleteConversation('new-id');
        expect(store.conversations).toHaveLength(0);
    });

    it('renames a conversation optimistically', async () => {
        const store = useChatStore();
        await store.newConversation({});
        await store.renameConversation('new-id', { title: 'Renamed' });
        expect(store.conversations[0].title).toBe('Renamed');
    });

    describe('sendMessage (user role → SSE stream)', () => {
        it('appends the user message and assistant reply from SSE events', async () => {
            const { sendChatMessageStream } = await import('@/utils/sse');
            vi.mocked(sendChatMessageStream).mockImplementation(() =>
                mockChatStream([
                    { type: 'message', data: mockUserMessage },
                    { type: 'reply', data: { message: mockAssistantMessage } }
                ])
            );

            const store = useChatStore();
            // Prime the cache with an empty messages array for the conversation.
            store.messageCache['conv-1'] = [];

            const result = await store.sendMessage('conv-1', { role: 'user', content: 'Hello' });

            expect(result).toEqual(mockUserMessage);
            expect(store.messageCache['conv-1']).toHaveLength(2);
            expect(store.messageCache['conv-1'][0]).toEqual(mockUserMessage);
            expect(store.messageCache['conv-1'][1]).toEqual(mockAssistantMessage);
            expect(store.streaming).toBe(false);
        });

        it('clears streaming flag and returns undefined on stream error', async () => {
            const { sendChatMessageStream } = await import('@/utils/sse');
            vi.mocked(sendChatMessageStream).mockImplementation(async function* () {
                throw new Error('Network failure');
            });

            const store = useChatStore();
            store.messageCache['conv-1'] = [];

            const result = await store.sendMessage('conv-1', { role: 'user', content: 'Oops' });

            expect(result).toBeUndefined();
            expect(store.streaming).toBe(false);
        });

        it('uses the generated JSON client for non-user roles', async () => {
            const { chatApi } = await import('@/utils/api');
            const { sendChatMessageStream } = await import('@/utils/sse');

            const store = useChatStore();
            store.messageCache['conv-1'] = [];

            await store.sendMessage('conv-1', { role: 'assistant', content: 'Hello' });

            expect(vi.mocked(chatApi.createMessage)).toHaveBeenCalledOnce();
            expect(vi.mocked(sendChatMessageStream)).not.toHaveBeenCalled();
        });
    });
});
