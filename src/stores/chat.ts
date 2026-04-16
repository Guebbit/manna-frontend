/**
 * @module stores/chat
 *
 * Pinia store for agent-backed chat conversations.
 *
 * Messages are streamed from `POST /run/stream`. Each user message is submitted as
 * an agent task and the assistant answer is finalized on the `done` event.
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { useCoreStore, useStructureRestApi } from '@guebbit/vue-toolkit';
import type { RunRequestProfileEnum as ModelProfile } from '../../api/models';
import { runTaskStream } from '@/api/manna';
import { handleApiError } from '@/utils/errorHandling';

/** A single local chat message. */
export interface IChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

/** A single chat conversation with its messages and metadata. */
export interface IConversation {
    id: string;
    title: string;
    messages: IChatMessage[];
    profile?: ModelProfile;
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
     * @param profile - Optional routing profile hint for this conversation.
     * @returns The UUID of the newly created conversation.
     */
    function newConversation(profile?: ModelProfile): string {
        const id = uuidv4();
        conversations.value.unshift({
            id,
            title: 'New conversation',
            messages: [],
            profile,
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
        let conversationReference = activeConversation.value;

        if (!conversationReference) {
            const id = newConversation();
            conversationReference = conversations.value.find((c) => c.id === id);
        }
        if (!conversationReference) return Promise.resolve();

        if (conversationReference.messages.length === 0) {
            conversationReference.title =
                content.length > 60 ? content.slice(0, 60) + '…' : content;
        }

        conversationReference.messages.push({ role: 'user', content });

        const assistantIndex = conversationReference.messages.length;
        conversationReference.messages.push({ role: 'assistant', content: '' });

        const conversation = conversationReference;

        return fetchAny(async () => {
            streaming.value = true;
            try {
                const generator = runTaskStream({
                    task: content,
                    allowWrite,
                    profile: conversation.profile
                });

                for await (const event of generator) {
                    if (event.type === 'done') {
                        const message = conversation.messages[assistantIndex];
                        if (message) {
                            message.content = event.data.result;
                        }
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
