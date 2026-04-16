<template>
    <div class="chat-view d-flex" style="height: calc(100vh - 100px)">
        <!-- Conversation sidebar -->
        <v-card class="mr-3 flex-shrink-0" width="260" variant="flat">
            <v-card-title class="d-flex align-center">
                <span class="text-subtitle-1">Conversations</span>
                <v-spacer />
                <v-btn icon size="small" variant="text" @click="onNewConversation">
                    <v-icon>mdi-plus</v-icon>
                </v-btn>
            </v-card-title>
            <v-divider />
            <v-list
                density="compact"
                nav
                class="overflow-y-auto"
                style="max-height: calc(100vh - 200px)"
            >
                <v-list-item
                    v-for="conv in chatStore.conversations"
                    :key="conv.id"
                    :active="conv.id === chatStore.activeConversationId"
                    rounded="xl"
                    @click="chatStore.activeConversationId = conv.id"
                >
                    <v-list-item-title class="text-truncate">
                        {{ conv.title }}
                    </v-list-item-title>
                    <template #append>
                        <v-btn
                            icon
                            size="x-small"
                            variant="text"
                            @click.stop="chatStore.deleteConversation(conv.id)"
                        >
                            <v-icon size="small">mdi-close</v-icon>
                        </v-btn>
                    </template>
                </v-list-item>
            </v-list>
            <div v-if="chatStore.conversations.length === 0" class="pa-4 text-center text-grey">
                No conversations yet
            </div>
        </v-card>

        <!-- Main chat area -->
        <v-card class="flex-grow-1 d-flex flex-column" variant="flat">
            <!-- Profile selector bar -->
            <v-card-title class="d-flex align-center ga-3 py-2">
                <v-select
                    v-model="selectedProfile"
                    :items="profileOptions"
                    density="compact"
                    variant="outlined"
                    style="max-width: 250px"
                    label="Routing profile"
                    hint="Choose how the backend routes the task: fast, reasoning, code, or default."
                    persistent-hint
                />
                <v-tooltip
                    text="Grants the agentic loop permission to modify files."
                    location="top"
                    max-width="280"
                >
                    <template #activator="{ props: tooltipProps }">
                        <v-switch
                            v-bind="tooltipProps"
                            v-model="allowWrite"
                            label="Write mode"
                            density="compact"
                            color="warning"
                            hide-details
                            class="flex-grow-0"
                        />
                    </template>
                </v-tooltip>
            </v-card-title>

            <v-divider />

            <!-- Messages -->
            <div ref="messagesContainer" class="flex-grow-1 overflow-y-auto pa-4">
                <div
                    v-if="!chatStore.activeConversation"
                    class="d-flex align-center justify-center fill-height"
                >
                    <div class="text-center text-grey">
                        <v-icon size="64" class="mb-4">mdi-chat-outline</v-icon>
                        <p class="text-h6">Start a new conversation</p>
                        <p class="text-body-2 mb-2">
                            Select a routing profile and type a message below.
                        </p>
                        <p class="text-body-2">
                            Chat uses the agent stream endpoint. The selected routing profile is
                            passed as a hint for backend model routing.
                        </p>
                    </div>
                </div>

                <template v-else>
                    <div
                        v-for="(message, index) in chatStore.activeConversation.messages"
                        :key="index"
                        class="mb-4"
                        :class="message.role === 'user' ? 'text-right' : ''"
                    >
                        <v-chip
                            :color="message.role === 'user' ? 'primary' : 'surface-variant'"
                            class="mb-1"
                            size="x-small"
                        >
                            {{ message.role === 'user' ? 'You' : 'Assistant' }}
                        </v-chip>
                        <div
                            :class="
                                message.role === 'user'
                                    ? 'ml-auto bg-primary rounded-lg pa-3'
                                    : 'mr-auto rounded-lg pa-3'
                            "
                            style="max-width: 85%; display: inline-block; text-align: left"
                        >
                            <MarkdownRenderer
                                v-if="typeof message.content === 'string'"
                                :content="
                                    message.content ||
                                    (chatStore.streaming &&
                                    index === chatStore.activeConversation.messages.length - 1
                                        ? '▊'
                                        : '')
                                "
                            />
                        </div>
                    </div>
                </template>

                <div v-if="chatStore.streaming" class="d-flex align-center ga-2 text-grey">
                    <v-progress-circular indeterminate size="16" width="2" />
                    <span class="text-caption">Thinking…</span>
                </div>
            </div>

            <v-divider />

            <!-- Input area -->
            <div class="pa-3">
                <v-textarea
                    v-model="userInput"
                    placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
                    variant="outlined"
                    rows="2"
                    auto-grow
                    max-rows="6"
                    hide-details
                    :disabled="chatStore.streaming"
                    @keydown="onKeydown"
                />
            </div>
        </v-card>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue';
import { useChatStore } from '@/stores/chat';
import type { RunRequestProfileEnum as ModelProfile } from '../../api/models';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer.vue';

const chatStore = useChatStore();

const userInput = ref('');
// Default false: write mode only has effect when model is 'manna' / agentic
const allowWrite = ref(false);
const messagesContainer = ref<HTMLElement | undefined>(undefined);

const profileOptions: ModelProfile[] = ['fast', 'reasoning', 'code', 'default'];

const selectedProfile = ref<ModelProfile>('default');

function onNewConversation(): void {
    chatStore.newConversation(selectedProfile.value);
}

function scrollToBottom(): void {
    if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
}

// Scroll when messages change
watch(
    () => {
        const conv = chatStore.activeConversation;
        if (!conv || conv.messages.length === 0) return '';
        const last: (typeof conv.messages)[number] | undefined = conv.messages.at(-1);
        if (!last) return '';
        return typeof last.content === 'string' ? last.content : '';
    },
    async () => {
        await nextTick();
        scrollToBottom();
    }
);

function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        void sendMessage();
    }
}

async function sendMessage(): Promise<void> {
    const content = userInput.value.trim();
    if (!content || chatStore.streaming) return;

    // Ensure a conversation exists with the right model
    if (!chatStore.activeConversation) {
        chatStore.newConversation(selectedProfile.value);
    }
    if (chatStore.activeConversation) {
        chatStore.activeConversation.profile = selectedProfile.value;
    }

    userInput.value = '';
    await chatStore.sendMessage(content, allowWrite.value);
}

onMounted(() => {
    if (chatStore.conversations.length === 0) {
        chatStore.newConversation(selectedProfile.value);
    }
});
</script>
