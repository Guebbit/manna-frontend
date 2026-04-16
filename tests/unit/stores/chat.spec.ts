import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useChatStore } from '@/stores/chat';

describe('useChatStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('starts with no conversations', () => {
        const store = useChatStore();
        expect(store.conversations).toEqual([]);
        expect(store.activeConversationId).toBeUndefined();
    });

    it('creates a new conversation', () => {
        const store = useChatStore();
        const id = store.newConversation('default');
        expect(store.conversations).toHaveLength(1);
        expect(store.activeConversationId).toBe(id);
        expect(store.conversations[0].profile).toBe('default');
    });

    it('deletes a conversation', () => {
        const store = useChatStore();
        const id = store.newConversation('default');
        store.deleteConversation(id);
        expect(store.conversations).toHaveLength(0);
    });

    it('switches active when current is deleted', () => {
        const store = useChatStore();
        store.newConversation('default');
        const id2 = store.newConversation('fast');
        store.deleteConversation(id2);
        expect(store.activeConversationId).toBe(store.conversations[0]?.id);
    });
});
