import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useChatStore } from '@/stores/chat';
import type { Conversation, ChatMessage } from '@/api/manna';

vi.mock('@/api/manna', async (importOriginal) => {
    const original = await importOriginal<typeof import('@/api/manna')>();
    return {
        ...original,
        listConversations: vi.fn().mockResolvedValue([]),
        createConversation: vi.fn().mockImplementation((req: { title?: string }) =>
            Promise.resolve({
                id: 'new-id',
                title: req.title ?? 'New conversation',
                profile: undefined,
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z'
            } satisfies Conversation)
        ),
        getConversation: vi.fn().mockResolvedValue({
            id: 'new-id',
            title: 'New conversation',
            profile: undefined,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
            messages: []
        }),
        updateConversation: vi.fn().mockImplementation((id: string, req: { title?: string }) =>
            Promise.resolve({
                id,
                title: req.title ?? '',
                profile: undefined,
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z'
            } satisfies Conversation)
        ),
        deleteChatConversation: vi.fn().mockImplementation(() => Promise.resolve()),
        addChatMessage: vi.fn().mockResolvedValue({} as ChatMessage),
        editChatMessage: vi.fn().mockResolvedValue({} as ChatMessage),
        deleteChatMessage: vi.fn().mockImplementation(() => Promise.resolve())
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
