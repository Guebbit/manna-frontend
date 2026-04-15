/**
 * @module stores/chat
 *
 * Pinia store for OpenAI-compatible chat conversations.
 *
 * The chat system mirrors the OpenAI `/v1/chat/completions` interface.  Model
 * selection determines the routing path on the backend:
 * - `'manna'` (and `'manna-*'` variants) — routed through the full agentic loop,
 *   giving the model access to all 18 registered tools (file ops, web search, etc.).
 * - Any other identifier (e.g. `'llama3.1:8b'`) — direct Ollama inference with no
 *   tool access, for lower latency plain-chat use cases.
 *
 * Messages are streamed via SSE so the UI updates token-by-token.
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { useCoreStore, useStructureRestApi } from '@guebbit/vue-toolkit';
import type { IOpenAiChatMessage } from '@/api/types';
import { streamChat } from '@/api/manna';
import { useNotificationsStore } from '@guebbit/vue-toolkit';
import { handleApiError } from '@/utils/errorHandling';

/** A single chat conversation with its messages and metadata. */
export interface IConversation {
    id: string;
    title: string;
    messages: IOpenAiChatMessage[];
    model: string;
    createdAt: string;
}

/**
 * Pinia store managing chat conversations and streaming message delivery.
 */
export const useChatStore = defineStore('chat', () => {
    const { getLoading, setLoading } = useCoreStore();
    const { loading, fetchAny } = useStructureRestApi({
        getLoading,
        setLoading
    });

    const conversations = ref<IConversation[]>([]);
    const activeConversationId = ref<string | undefined>(undefined);
    const streaming = ref(false);

    const activeConversation = computed(() =>
        conversations.value.find((c) => c.id === activeConversationId.value)
    );

    /**
     * Creates a new conversation, adds it to the top of the list, and activates it.
     *
     * @param model - The model identifier to use for this conversation (default `'manna'`).
     * @returns The UUID of the newly created conversation.
     */
    function newConversation(model = 'manna'): string {
        const id = uuidv4();
        conversations.value.unshift({
            id,
            title: 'New conversation',
            messages: [],
            model,
            createdAt: new Date().toISOString()
        });
        activeConversationId.value = id;
        return id;
    }

    /**
     * Removes a conversation by ID and switches the active conversation if needed.
     *
     * @param id - The UUID of the conversation to delete.
     */
    function deleteConversation(id: string): void {
        const index = conversations.value.findIndex((c) => c.id === id);
        if (index === -1) return;
        conversations.value.splice(index, 1);
        if (activeConversationId.value === id) {
            activeConversationId.value = conversations.value[0]?.id;
        }
    }

    /**
     * Sends a user message and streams the assistant reply into the active conversation.
     * Creates a new conversation if none is active.
     *
     * @param content    - The user's plain-text message.
     * @param allowWrite - When `true`, grants the backend write-access to the filesystem.
     * @returns Resolves when the full assistant reply has been received.
     */
    const sendMessage = (content: string, allowWrite = false) => {
        const notificationStore = useNotificationsStore();
        let conversationReference = activeConversation.value;

        if (!conversationReference) {
            const id = newConversation();
            conversationReference = conversations.value.find((c) => c.id === id);
        }
        if (!conversationReference) return Promise.resolve();

        // Set title from first message
        if (conversationReference.messages.length === 0) {
            conversationReference.title =
                content.length > 60 ? content.slice(0, 60) + '…' : content;
        }

        conversationReference.messages.push({ role: 'user', content });

        // Add an empty assistant placeholder before streaming so the UI renders
        // the typing cursor immediately without waiting for the first token
        const assistantIndex = conversationReference.messages.length;
        conversationReference.messages.push({ role: 'assistant', content: '' });

        // Capture reference for use inside async callback
        const conversation = conversationReference;

        return fetchAny(async () => {
            streaming.value = true;
            try {
                const generator = streamChat({
                    model: conversation.model,
                    messages: conversation.messages.slice(0, -1),
                    allowWrite
                });

                for await (const chunk of generator) {
                    const message = conversation.messages[assistantIndex];
                    if (message && typeof message.content === 'string') {
                        message.content += chunk;
                    }
                }
            } catch (error: unknown) {
                conversation.messages.splice(assistantIndex, 1);
                throw error;
            } finally {
                streaming.value = false;
            }
        }).catch((error: unknown) => {
            handleApiError(error, 'Failed to send message');
        });
    };

    return {
        conversations,
        activeConversationId,
        streaming,
        loading,
        activeConversation,
        newConversation,
        deleteConversation,
        sendMessage
    };
});
