import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useChatStore } from '@/stores/chat';
import type { Conversation, ChatMessage } from '@api';

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
        runTaskStream: vi.fn()
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
});
