<template>
    <!-- Shared SSE stream event timeline used by Agent, CodeChat, Swarm, Workflow views -->
    <v-card v-if="visible" class="mt-4">
        <v-card-title class="d-flex align-center">
            <v-icon start>mdi-antenna</v-icon>
            {{ resolvedTitle }}
            <v-progress-circular v-if="streaming" indeterminate size="16" class="ml-2" />
        </v-card-title>
        <v-card-subtitle v-if="subtitle">{{ subtitle }}</v-card-subtitle>
        <v-card-text>
            <v-timeline density="compact" side="end">
                <v-timeline-item
                    v-for="(event, index) in events"
                    :key="index"
                    :dot-color="colorFn(event.type)"
                    size="small"
                >
                    <slot name="event" :event="event" :index="index">
                        <!-- Default: compact chip + summary -->
                        <div class="d-flex align-center ga-2">
                            <v-chip :color="colorFn(event.type)" size="x-small" label>
                                {{ event.type }}
                            </v-chip>
                            <span class="text-body-2">{{ summaryFn(event) }}</span>
                        </div>
                    </slot>
                </v-timeline-item>
            </v-timeline>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = withDefaults(
    defineProps<{
        /** Whether the stream is currently active */
        streaming: boolean;
        /** Whether stream has finished (shows card even when not streaming) */
        finished?: boolean;
        /** Array of stream events to display */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        events: Array<{ type: string; data: any }>;
        /** Function to get timeline dot colour from event type */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        colorFn: (type: any) => string;
        /** Function to get one-line summary from event */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        summaryFn: (event: any) => string;
        /** Card title override */
        title?: string;
        /** Optional subtitle */
        subtitle?: string;
    }>(),
    {
        finished: false,
        title: undefined,
        subtitle: undefined
    }
);

const { t } = useI18n();

/** Show the card when streaming or after stream finishes */
const visible = computed(() => props.streaming || props.finished);

// Resolved card title: use prop if provided, otherwise fall back to i18n default
const resolvedTitle = computed(() => props.title ?? t('common.liveEvents'));
</script>
