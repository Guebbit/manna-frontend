<template>
    <div class="chat-view d-flex" style="height: calc(100vh - 100px)">
        <!-- Conversation sidebar -->
        <v-card class="mr-3 flex-shrink-0 d-flex flex-column" width="260" variant="flat">
            <v-card-title class="d-flex align-center flex-shrink-0">
                <span class="text-subtitle-1">{{ t('chat.conversations') }}</span>
                <v-spacer />
                <v-btn
                    icon
                    size="small"
                    variant="text"
                    :loading="loading"
                    @click="onNewConversation"
                >
                    <v-icon>mdi-plus</v-icon>
                </v-btn>
            </v-card-title>
            <v-divider />
            <v-list
                density="compact"
                nav
                class="overflow-y-auto flex-grow-1"
                style="max-height: calc(100vh - 200px)"
            >
                <v-list-item
                    v-for="conv in conversations"
                    :key="conv.id"
                    :active="conv.id === activeId"
                    rounded="xl"
                    @click="navigateTo(conv.id)"
                >
                    <template v-if="editingConvId === conv.id">
                        <v-text-field
                            v-model="editingConvTitle"
                            density="compact"
                            variant="outlined"
                            hide-details
                            autofocus
                            class="my-1"
                            @click.stop
                            @keydown.enter.prevent="saveRename(conv.id)"
                            @keydown.escape="cancelRename"
                            @blur="saveRename(conv.id)"
                        />
                    </template>
                    <template v-else>
                        <v-list-item-title class="text-truncate">{{
                            conv.title
                        }}</v-list-item-title>
                        <v-list-item-subtitle v-if="conv.profile" class="mt-1">
                            <v-chip size="x-small" :color="profileColor(conv.profile)">
                                {{ conv.profile }}
                            </v-chip>
                        </v-list-item-subtitle>
                    </template>
                    <template #append>
                        <div class="d-flex">
                            <v-btn
                                icon
                                size="x-small"
                                variant="text"
                                @click.stop="startRename(conv)"
                            >
                                <v-icon size="small">mdi-pencil</v-icon>
                            </v-btn>
                            <v-btn
                                icon
                                size="x-small"
                                variant="text"
                                color="error"
                                @click.stop="onDeleteConversation(conv.id)"
                            >
                                <v-icon size="small">mdi-close</v-icon>
                            </v-btn>
                        </div>
                    </template>
                </v-list-item>
            </v-list>
            <div v-if="conversations.length === 0 && !loading" class="pa-4 text-center text-grey">
                {{ t('chat.noConversationsYet') }}
            </div>
        </v-card>

        <!-- Main chat area -->
        <v-card class="flex-grow-1 d-flex flex-column" variant="flat">
            <!-- Empty state -->
            <div v-if="!activeId" class="flex-grow-1 d-flex align-center justify-center">
                <div class="text-center text-grey">
                    <v-icon size="64" class="mb-4">mdi-chat-outline</v-icon>
                    <p class="text-h6">{{ t('chat.startNewConversation') }}</p>
                    <p class="text-body-2 mb-2">{{ t('chat.startNewConversationHint') }}</p>
                    <p class="text-body-2">{{ t('chat.persistedHint') }}</p>
                </div>
            </div>

            <template v-else>
                <!-- Toolbar -->
                <v-card-title class="d-flex align-center ga-3 py-2 flex-wrap">
                    <v-select
                        v-model="selectedProfile"
                        :items="profileOptions"
                        item-title="title"
                        item-value="value"
                        density="compact"
                        variant="outlined"
                        style="max-width: 220px"
                        :label="t('chat.agentProfile')"
                        hide-details
                    >
                        <template #item="{ props, item }">
                            <v-list-item v-bind="props">
                                <v-list-item-subtitle>{{
                                    item.raw.description
                                }}</v-list-item-subtitle>
                            </v-list-item>
                        </template>
                    </v-select>

                    <v-tooltip :text="t('chat.writeModeTooltip')" location="top" max-width="280">
                        <template #activator="{ props: tooltipProps }">
                            <v-switch
                                v-bind="tooltipProps"
                                v-model="allowWrite"
                                :label="t('chat.writeMode')"
                                density="compact"
                                color="warning"
                                hide-details
                                class="flex-grow-0"
                            />
                        </template>
                    </v-tooltip>

                    <v-spacer />

                    <v-btn
                        variant="outlined"
                        size="small"
                        :loading="streaming"
                        :disabled="activeMessages.length === 0 || streaming"
                        @click="onRunWithAgent"
                    >
                        <v-icon start>mdi-robot</v-icon>
                        {{ t('chat.runWithAgent') }}
                    </v-btn>
                </v-card-title>

                <v-divider />

                <!-- Messages -->
                <div ref="messagesContainer" class="flex-grow-1 overflow-y-auto pa-4">
                    <div
                        v-for="message in activeMessages"
                        :key="message.id"
                        class="mb-4"
                        :class="{
                            'd-flex flex-column align-end': message.role === 'user',
                            'd-flex flex-column align-center text-grey': message.role === 'system'
                        }"
                    >
                        <!-- System message -->
                        <template v-if="message.role === 'system'">
                            <span class="text-caption font-italic">{{ message.content }}</span>
                            <div class="d-flex ga-1 mt-1">
                                <v-btn
                                    icon
                                    size="x-small"
                                    variant="text"
                                    @click="startEditMessage(message)"
                                >
                                    <v-icon size="x-small">mdi-pencil</v-icon>
                                </v-btn>
                                <v-btn
                                    icon
                                    size="x-small"
                                    variant="text"
                                    color="error"
                                    @click="onDeleteMessage(message.id)"
                                >
                                    <v-icon size="x-small">mdi-delete</v-icon>
                                </v-btn>
                            </div>
                        </template>

                        <!-- User / assistant messages -->
                        <template v-else>
                            <v-chip
                                :color="message.role === 'user' ? 'primary' : 'surface-variant'"
                                class="mb-1"
                                size="x-small"
                            >
                                {{ message.role === 'user' ? t('chat.you') : t('chat.assistant') }}
                            </v-chip>

                            <!-- Edit mode -->
                            <div
                                v-if="editingMessageId === message.id"
                                style="max-width: 85%; width: 100%"
                            >
                                <v-textarea
                                    v-model="editingMessageContent"
                                    variant="outlined"
                                    rows="2"
                                    auto-grow
                                    hide-details
                                    autofocus
                                    @keydown.escape="cancelEditMessage"
                                />
                                <div class="d-flex ga-2 mt-1 justify-end">
                                    <v-btn size="x-small" variant="text" @click="cancelEditMessage">
                                        {{ t('common.cancel') }}
                                    </v-btn>
                                    <v-btn
                                        size="x-small"
                                        color="primary"
                                        @click="saveEditMessage(message.id)"
                                    >
                                        {{ t('common.save') }}
                                    </v-btn>
                                </div>
                            </div>

                            <!-- Display mode -->
                            <div
                                v-else
                                :class="
                                    message.role === 'user'
                                        ? 'ml-auto bg-primary rounded-lg pa-3'
                                        : 'mr-auto rounded-lg pa-3'
                                "
                                style="max-width: 85%; display: inline-block; text-align: left"
                            >
                                <MarkdownRenderer :content="message.content" />
                                <div class="d-flex ga-1 mt-1 justify-end">
                                    <v-btn
                                        icon
                                        size="x-small"
                                        variant="text"
                                        @click="startEditMessage(message)"
                                    >
                                        <v-icon size="x-small">mdi-pencil</v-icon>
                                    </v-btn>
                                    <v-btn
                                        icon
                                        size="x-small"
                                        variant="text"
                                        color="error"
                                        @click="onDeleteMessage(message.id)"
                                    >
                                        <v-icon size="x-small">mdi-delete</v-icon>
                                    </v-btn>
                                </div>
                            </div>
                        </template>
                    </div>

                    <div
                        v-if="activeMessages.length === 0 && !loading"
                        class="d-flex align-center justify-center fill-height text-grey"
                    >
                        <span class="text-body-2">{{ t('chat.noMessagesYet') }}</span>
                    </div>

                    <div v-if="streaming" class="d-flex align-center ga-2 text-grey mt-2">
                        <v-progress-circular indeterminate size="16" width="2" />
                        <span class="text-caption">{{ t('common.agentRunning') }}</span>
                    </div>
                </div>

                <v-divider />

                <!-- Input -->
                <div class="pa-3">
                    <v-textarea
                        v-model="userInput"
                        :placeholder="t('chat.inputPlaceholder')"
                        variant="outlined"
                        rows="2"
                        auto-grow
                        max-rows="6"
                        hide-details
                        :disabled="streaming"
                        @keydown="onKeydown"
                    />
                </div>
            </template>
        </v-card>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useChatStore } from '@/stores/chat';
import type {
    Conversation,
    ChatMessage,
    RunRequestProfileEnum as ModelProfile,
    ConversationProfileEnum
} from '@api/api';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer.vue';

const { t } = useI18n();

const route = useRoute();
const router = useRouter();
const chatStore = useChatStore();
const { conversations, messageCache, streaming, loading } = storeToRefs(chatStore);
const {
    loadConversations,
    loadConversation,
    newConversation,
    renameConversation,
    deleteConversation,
    sendMessage,
    editMessage,
    deleteMessage,
    runWithAgent
} = chatStore;

const messagesContainer = ref<HTMLElement | undefined>(undefined);
const userInput = ref('');
const allowWrite = ref(false);

// Sidebar rename state
const editingConvId = ref<string | undefined>(undefined);
const editingConvTitle = ref<string>('');

// Message edit state
const editingMessageId = ref<string | undefined>(undefined);
const editingMessageContent = ref('');

type ModelProfileOption = {
    value: ModelProfile;
    title: string;
    description: string;
};

const profileOptions: ModelProfileOption[] = [
    { value: 'fast', title: t('profiles.fast'), description: t('profiles.descriptions.fast') },
    {
        value: 'reasoning',
        title: t('profiles.reasoning'),
        description: t('profiles.descriptions.reasoning')
    },
    { value: 'code', title: t('profiles.code'), description: t('profiles.descriptions.code') },
    {
        value: 'default',
        title: t('profiles.default'),
        description: t('profiles.descriptions.default')
    }
];

const selectedProfile = ref<ModelProfile>('default');

const activeId = computed(() => route.params.id as string | undefined);

const activeConversation = computed(() => conversations.value.find((c) => c.id === activeId.value));

const activeMessages = computed(() =>
    activeId.value ? (messageCache.value[activeId.value] ?? []) : []
);

function profileColor(profile: string): string {
    if (profile === 'fast') return 'success';
    if (profile === 'reasoning') return 'warning';
    if (profile === 'code') return 'info';
    return 'default';
}

function navigateTo(id: string): void {
    void router.push({ name: 'chat-conversation', params: { id } });
}

async function onNewConversation(): Promise<void> {
    const profile =
        selectedProfile.value === 'default'
            ? undefined
            : (selectedProfile.value as ConversationProfileEnum);
    const conv = await newConversation({ profile });
    if (conv) navigateTo(conv.id);
}

// Sidebar rename
function startRename(conv: Conversation): void {
    editingConvId.value = conv.id;
    editingConvTitle.value = conv.title;
}

async function saveRename(id: string): Promise<void> {
    if (!editingConvId.value) return;
    const title = editingConvTitle.value.trim();
    editingConvId.value = undefined;
    if (title) await renameConversation(id, { title });
}

function cancelRename(): void {
    editingConvId.value = undefined;
}

async function onDeleteConversation(id: string): Promise<void> {
    if (!confirm(t('chat.deleteConversationConfirm'))) return;
    await deleteConversation(id);
    if (activeId.value === id) {
        void router.push({ name: 'chat-conversations' });
    }
}

// Message edit
function startEditMessage(message: ChatMessage): void {
    editingMessageId.value = message.id;
    editingMessageContent.value = message.content;
}

function cancelEditMessage(): void {
    editingMessageId.value = undefined;
}

async function saveEditMessage(messageId: string): Promise<void> {
    if (!activeId.value || !editingMessageContent.value.trim()) return;
    await editMessage(activeId.value, messageId, { content: editingMessageContent.value.trim() });
    editingMessageId.value = undefined;
}

async function onDeleteMessage(messageId: string): Promise<void> {
    if (!activeId.value || !confirm(t('chat.deleteMessageConfirm'))) return;
    await deleteMessage(activeId.value, messageId);
}

async function onRunWithAgent(): Promise<void> {
    if (!activeId.value) return;
    const convProfile = activeConversation.value?.profile as ModelProfile | undefined;
    await runWithAgent(activeId.value, convProfile ?? selectedProfile.value, allowWrite.value);
}

function scrollToBottom(): void {
    if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
}

watch(
    () => activeMessages.value.at(-1)?.content,
    async () => {
        await nextTick();
        scrollToBottom();
    }
);

function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        void onSend();
    }
}

async function onSend(): Promise<void> {
    const content = userInput.value.trim();
    if (!content || streaming.value || !activeId.value) return;
    userInput.value = '';
    await sendMessage(activeId.value, { role: 'user', content });
}

// Load conversations list + active conversation messages when route changes
watch(
    activeId,
    async (id) => {
        if (id) await loadConversation(id);
    },
    { immediate: true }
);

onMounted(async () => {
    await loadConversations();
});
</script>
