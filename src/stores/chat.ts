import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useCoreStore, useStructureRestApi } from '@guebbit/vue-toolkit';
import { handleApiError } from '@/utils/errorHandling';
import {
    listConversations,
    createConversation,
    getConversation,
    updateConversation,
    deleteChatConversation,
    addChatMessage,
    editChatMessage,
    deleteChatMessage,
    runTaskStream
} from '@/api/manna';
import type { Conversation, ChatMessage, ConversationWithMessages } from '@/api/manna';
import type {
    CreateConversationRequest,
    UpdateConversationRequest,
    CreateMessageRequest,
    UpdateMessageRequest,
    RunRequestProfileEnum as ModelProfile
} from '@api';

export const useChatStore = defineStore('chat', () => {
    const { getLoading, setLoading } = useCoreStore();
    const { loading, fetchAny } = useStructureRestApi({ getLoading, setLoading });

    const conversations = ref<Conversation[]>([]);
    const messageCache = ref<Record<string, ChatMessage[]>>({});
    const streaming = ref(false);

    const loadConversations = () =>
        fetchAny(async () => {
            conversations.value = await listConversations();
        }).catch((error: unknown) => {
            handleApiError(error, 'Failed to load conversations');
        });

    const loadConversation = (id: string) => {
        if (messageCache.value[id]) return Promise.resolve();
        return fetchAny(async () => {
            const conv: ConversationWithMessages = await getConversation(id);
            const { messages, ...meta } = conv;
            const index = conversations.value.findIndex((c) => c.id === id);
            if (index !== -1) conversations.value[index] = meta;
            messageCache.value = { ...messageCache.value, [id]: messages };
        }).catch((error: unknown) => {
            handleApiError(error, 'Failed to load conversation');
            throw error;
        });
    };

    const newConversation = (
        request: CreateConversationRequest = {}
    ): Promise<Conversation | undefined> =>
        fetchAny(async () => {
            const conv = await createConversation(request);
            conversations.value.unshift(conv);
            messageCache.value = { ...messageCache.value, [conv.id]: [] };
            return conv;
        }).catch((error: unknown) => {
            handleApiError(error, 'Failed to create conversation');
        }) as Promise<Conversation | undefined>;

    const renameConversation = (id: string, request: UpdateConversationRequest) => {
        const conv = conversations.value.find((c) => c.id === id);
        const prevTitle = conv?.title;
        if (conv && request.title !== undefined) conv.title = request.title;

        return fetchAny(async () => {
            const updated = await updateConversation(id, request);
            const index = conversations.value.findIndex((c) => c.id === id);
            if (index !== -1) conversations.value[index] = updated;
        }).catch((error: unknown) => {
            if (conv && prevTitle !== undefined) conv.title = prevTitle;
            handleApiError(error, 'Failed to rename conversation');
        });
    };

    const deleteConversation = (id: string) => {
        const index = conversations.value.findIndex((c) => c.id === id);
        const removed = index === -1 ? undefined : conversations.value.splice(index, 1)[0];

        return fetchAny(async () => {
            await deleteChatConversation(id);
            const cache = { ...messageCache.value };
            delete cache[id];
            messageCache.value = cache;
        }).catch((error: unknown) => {
            if (removed !== undefined) conversations.value.splice(index, 0, removed);
            handleApiError(error, 'Failed to delete conversation');
        });
    };

    const sendMessage = (
        conversationId: string,
        request: CreateMessageRequest
    ): Promise<ChatMessage | undefined> =>
        fetchAny(async () => {
            const message = await addChatMessage(conversationId, request);
            messageCache.value = {
                ...messageCache.value,
                [conversationId]: [...(messageCache.value[conversationId] ?? []), message]
            };
            return message;
        }).catch((error: unknown) => {
            handleApiError(error, 'Failed to send message');
        }) as Promise<ChatMessage | undefined>;

    const editMessage = (
        conversationId: string,
        messageId: string,
        request: UpdateMessageRequest
    ): Promise<ChatMessage | undefined> =>
        fetchAny(async () => {
            const updated = await editChatMessage(conversationId, messageId, request);
            const msgs = messageCache.value[conversationId];
            if (msgs) {
                const i = msgs.findIndex((m) => m.id === messageId);
                if (i !== -1) msgs[i] = updated;
            }
            return updated;
        }).catch((error: unknown) => {
            handleApiError(error, 'Failed to edit message');
        }) as Promise<ChatMessage | undefined>;

    const deleteMessage = (conversationId: string, messageId: string) => {
        const msgs = messageCache.value[conversationId];
        const messageIndex = msgs?.findIndex((m) => m.id === messageId) ?? -1;
        const removed = messageIndex === -1 ? undefined : msgs!.splice(messageIndex, 1)[0];

        return fetchAny(async () => {
            await deleteChatMessage(conversationId, messageId);
        }).catch((error: unknown) => {
            if (removed !== undefined && msgs) msgs.splice(messageIndex, 0, removed);
            handleApiError(error, 'Failed to delete message');
        });
    };

    const runWithAgent = (conversationId: string, profile: ModelProfile, allowWrite = false) => {
        const msgs = messageCache.value[conversationId] ?? [];
        const lastUserMessage = msgs.toReversed().find((m: ChatMessage) => m.role === 'user');
        if (!lastUserMessage) return Promise.resolve();

        return fetchAny(async () => {
            streaming.value = true;
            let result = '';
            try {
                const generator = runTaskStream({
                    task: lastUserMessage.content,
                    allowWrite,
                    profile
                });
                for await (const event of generator) {
                    if (event.type === 'done') result = event.data.result;
                }
                if (result) {
                    const message = await addChatMessage(conversationId, {
                        role: 'assistant',
                        content: result
                    });
                    messageCache.value = {
                        ...messageCache.value,
                        [conversationId]: [...(messageCache.value[conversationId] ?? []), message]
                    };
                }
            } finally {
                streaming.value = false;
            }
        }).catch((error: unknown) => {
            streaming.value = false;
            handleApiError(error, 'Agent run failed');
        });
    };

    return {
        conversations,
        messageCache,
        streaming,
        loading,
        loadConversations,
        loadConversation,
        newConversation,
        renameConversation,
        deleteConversation,
        sendMessage,
        editMessage,
        deleteMessage,
        runWithAgent
    };
});

export { type Conversation as IConversation, type ChatMessage as IChatMessage } from '@/api/manna';
