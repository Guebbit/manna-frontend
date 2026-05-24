import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useCoreStore, useStructureRestApi } from '@guebbit/vue-toolkit';
import { handleApiError } from '@/utils/errorHandling';
import { chatApi } from '@/utils/api';
import { runTaskStream, sendChatMessageStream } from '@/utils/sse';
import { useNotificationsStore, TOAST_TYPE } from './notification';
import type {
    Conversation,
    ChatMessage,
    ConversationWithMessages,
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
        fetchAny(() =>
            chatApi.listConversations().then(({ data }) => {
                conversations.value = data.data?.conversations ?? [];
            })
        ).catch((error: unknown) => {
            handleApiError(error, 'Failed to load conversations');
        });

    const loadConversation = (id: string) => {
        if (messageCache.value[id]) return Promise.resolve();
        return fetchAny(() =>
            chatApi.getConversation({ conversationId: id }).then(({ data }) => {
                const conv: ConversationWithMessages | undefined = data.data?.conversation;
                if (!conv) throw new Error('No conversation in response');
                const { messages, ...meta } = conv;
                const index = conversations.value.findIndex((c) => c.id === id);
                if (index !== -1) conversations.value[index] = meta;
                messageCache.value = { ...messageCache.value, [id]: messages };
            })
        ).catch((error: unknown) => {
            handleApiError(error, 'Failed to load conversation');
            throw error;
        });
    };

    const newConversation = (
        request: CreateConversationRequest = {}
    ): Promise<Conversation | undefined> =>
        fetchAny(() =>
            chatApi.createConversation({ createConversationRequest: request }).then(({ data }) => {
                const conv = data.data?.conversation;
                if (!conv) throw new Error('No conversation in response');
                conversations.value.unshift(conv);
                messageCache.value = { ...messageCache.value, [conv.id]: [] };
                return conv;
            })
        ).catch((error: unknown) => {
            handleApiError(error, 'Failed to create conversation');
        }) as Promise<Conversation | undefined>;

    const renameConversation = (id: string, request: UpdateConversationRequest) => {
        const conv = conversations.value.find((c) => c.id === id);
        const prevTitle = conv?.title;
        if (conv && request.title !== undefined) conv.title = request.title;

        return fetchAny(() =>
            chatApi
                .updateConversation({ conversationId: id, updateConversationRequest: request })
                .then(({ data }) => {
                    const updated = data.data?.conversation;
                    if (!updated) throw new Error('No conversation in response');
                    const index = conversations.value.findIndex((c) => c.id === id);
                    if (index !== -1) conversations.value[index] = updated;
                })
        ).catch((error: unknown) => {
            if (conv && prevTitle !== undefined) conv.title = prevTitle;
            handleApiError(error, 'Failed to rename conversation');
        });
    };

    const deleteConversation = (id: string) => {
        const index = conversations.value.findIndex((c) => c.id === id);
        const removed = index === -1 ? undefined : conversations.value.splice(index, 1)[0];

        return fetchAny(() =>
            chatApi.deleteConversation({ conversationId: id }).then(() => {
                const cache = { ...messageCache.value };
                delete cache[id];
                messageCache.value = cache;
            })
        ).catch((error: unknown) => {
            if (removed !== undefined) conversations.value.splice(index, 0, removed);
            handleApiError(error, 'Failed to delete conversation');
        });
    };

    const sendMessage = (
        conversationId: string,
        request: CreateMessageRequest
    ): Promise<ChatMessage | undefined> => {
        // User messages trigger the SSE streaming endpoint so the assistant reply
        // is streamed back in real time. Non-user roles (assistant / system) use
        // the standard JSON endpoint instead.
        if (request.role !== 'user') {
            return fetchAny(() =>
                chatApi
                    .createMessage({ conversationId, createMessageRequest: request })
                    .then(({ data }) => {
                        const message = data.data?.message;
                        if (!message) throw new Error('No message in response');
                        messageCache.value = {
                            ...messageCache.value,
                            [conversationId]: [
                                ...(messageCache.value[conversationId] ?? []),
                                message
                            ]
                        };
                        return message;
                    })
            ).catch((error: unknown) => {
                handleApiError(error, 'Failed to send message');
            }) as Promise<ChatMessage | undefined>;
        }

        // SSE path for user messages — streams `message` then `reply` events.
        return fetchAny(async () => {
            streaming.value = true;
            let userMessage: ChatMessage | undefined;
            try {
                const generator = sendChatMessageStream(conversationId, request);
                for await (const event of generator) {
                    switch (event.type) {
                        case 'message': {
                            // Immediately append the saved user message to the cache.
                            userMessage = event.data;
                            messageCache.value = {
                                ...messageCache.value,
                                [conversationId]: [
                                    ...(messageCache.value[conversationId] ?? []),
                                    event.data
                                ]
                            };
                            break;
                        }
                        case 'reply': {
                            // Append the assistant reply once the model finishes.
                            messageCache.value = {
                                ...messageCache.value,
                                [conversationId]: [
                                    ...(messageCache.value[conversationId] ?? []),
                                    event.data.message
                                ]
                            };
                            break;
                        }
                        case 'error': {
                            useNotificationsStore().addMessage(event.data.error, TOAST_TYPE.DANGER);
                            break;
                        }
                    }
                }
            } finally {
                streaming.value = false;
            }
            return userMessage;
        }).catch((error: unknown) => {
            streaming.value = false;
            handleApiError(error, 'Failed to send message');
        }) as Promise<ChatMessage | undefined>;
    };

    const editMessage = (
        conversationId: string,
        messageId: string,
        request: UpdateMessageRequest
    ): Promise<ChatMessage | undefined> =>
        fetchAny(() =>
            chatApi
                .updateMessage({ conversationId, messageId, updateMessageRequest: request })
                .then(({ data }) => {
                    const updated = data.data?.message;
                    if (!updated) throw new Error('No message in response');
                    const msgs = messageCache.value[conversationId];
                    if (msgs) {
                        const i = msgs.findIndex((m) => m.id === messageId);
                        if (i !== -1) msgs[i] = updated;
                    }
                    return updated;
                })
        ).catch((error: unknown) => {
            handleApiError(error, 'Failed to edit message');
        }) as Promise<ChatMessage | undefined>;

    const deleteMessage = (conversationId: string, messageId: string) => {
        const msgs = messageCache.value[conversationId];
        const messageIndex = msgs?.findIndex((m) => m.id === messageId) ?? -1;
        const removed = messageIndex === -1 ? undefined : msgs!.splice(messageIndex, 1)[0];

        return fetchAny(() => chatApi.deleteMessage({ conversationId, messageId })).catch(
            (error: unknown) => {
                if (removed !== undefined && msgs) msgs.splice(messageIndex, 0, removed);
                handleApiError(error, 'Failed to delete message');
            }
        );
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
                    const { data } = await chatApi.createMessage({
                        conversationId,
                        createMessageRequest: {
                            role: 'assistant',
                            content: result
                        }
                    });
                    const message = data.data?.message;
                    if (!message) return;
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

export { type Conversation as IConversation, type ChatMessage as IChatMessage } from '@api';
