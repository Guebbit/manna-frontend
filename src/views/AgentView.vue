<template>
    <div>
        <h1 class="text-h4 mb-6">Agent Task</h1>

        <v-row>
            <v-col cols="12" md="7">
                <v-card>
                    <v-card-title>Submit a Task</v-card-title>
                    <v-card-text>
                        <v-textarea
                            v-model="taskInput"
                            label="Task description"
                            placeholder="Describe what you want the agent to do…"
                            variant="outlined"
                            rows="4"
                            auto-grow
                        />

                        <v-row class="mt-2">
                            <v-col cols="12" sm="6">
                                <v-select
                                    v-model="selectedProfile"
                                    :items="profileOptions"
                                    label="Model profile"
                                    variant="outlined"
                                    density="compact"
                                />
                            </v-col>
                            <v-col cols="12" sm="6" class="d-flex align-center">
                                <v-switch
                                    v-model="allowWrite"
                                    label="Allow write operations"
                                    color="warning"
                                    density="compact"
                                    hide-details
                                />
                            </v-col>
                        </v-row>
                    </v-card-text>
                    <v-card-actions>
                        <v-btn
                            color="primary"
                            :loading="agentStore.loading"
                            :disabled="!taskInput.trim()"
                            @click="submit"
                        >
                            <v-icon start>mdi-play</v-icon>
                            Run Task
                        </v-btn>
                    </v-card-actions>
                </v-card>

                <!-- Result -->
                <v-card v-if="latestResult" class="mt-4">
                    <v-card-title class="d-flex align-center">
                        Result
                        <v-spacer />
                        <CopyButton :text="latestResult.result" />
                    </v-card-title>
                    <v-card-text>
                        <MarkdownRenderer :content="latestResult.result" />
                    </v-card-text>
                </v-card>
            </v-col>

            <!-- Task History -->
            <v-col cols="12" md="5">
                <v-card>
                    <v-card-title>Task History</v-card-title>
                    <v-card-text v-if="agentStore.taskHistory.length === 0" class="text-grey">
                        No tasks yet. Submit your first task!
                    </v-card-text>
                    <v-list v-else density="compact">
                        <v-list-item
                            v-for="entry in agentStore.taskHistory"
                            :key="entry.id"
                            :active="latestResult?.id === entry.id"
                            rounded="xl"
                            @click="latestResult = entry"
                        >
                            <v-list-item-title class="text-truncate">
                                {{ entry.task }}
                            </v-list-item-title>
                            <v-list-item-subtitle class="text-caption">
                                {{ formatTime(entry.timestamp) }}
                                <v-chip v-if="entry.profile" size="x-small" class="ml-1">
                                    {{ entry.profile }}
                                </v-chip>
                            </v-list-item-subtitle>
                        </v-list-item>
                    </v-list>
                </v-card>
            </v-col>
        </v-row>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useAgentStore, type ITaskHistoryEntry } from '@/stores/agent';
import type { ModelProfile } from '@/api/types';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer.vue';
import CopyButton from '@/components/shared/CopyButton.vue';

const agentStore = useAgentStore();

const taskInput = ref('');
const selectedProfile = ref<ModelProfile | 'auto'>('auto');
const allowWrite = ref(false);
const latestResult = ref<ITaskHistoryEntry | undefined>(undefined);

const profileOptions = [
    { title: 'Auto (router decides)', value: 'auto' },
    { title: 'Fast', value: 'fast' },
    { title: 'Reasoning', value: 'reasoning' },
    { title: 'Code', value: 'code' },
    { title: 'Default', value: 'default' }
];

// Auto-select latest result when history changes
watch(
    () => agentStore.taskHistory.length,
    () => {
        if (!latestResult.value && agentStore.taskHistory.length > 0) {
            latestResult.value = agentStore.taskHistory[0];
        }
    }
);

async function submit(): Promise<void> {
    const task = taskInput.value.trim();
    if (!task) return;

    const profile = selectedProfile.value === 'auto' ? undefined : selectedProfile.value;
    const result = await agentStore.submitTask(task, profile, allowWrite.value);
    if (result) {
        latestResult.value = result;
        taskInput.value = '';
    }
}

function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString();
}
</script>
