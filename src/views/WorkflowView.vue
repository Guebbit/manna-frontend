<template>
    <div>
        <h1 class="text-h4 mb-6">{{ t('workflow.title') }}</h1>

        <v-row>
            <v-col cols="12" md="7">
                <v-card>
                    <v-card-title>{{ t('workflow.buildWorkflow') }}</v-card-title>
                    <v-card-text>
                        <!-- Step list -->
                        <div
                            v-for="(step, index) in steps"
                            :key="index"
                            class="d-flex align-center ga-2 mb-2"
                        >
                            <v-text-field
                                v-model="steps[index]"
                                :label="t('workflow.step', { n: index + 1 })"
                                variant="outlined"
                                density="compact"
                                hide-details
                                class="flex-grow-1"
                            />
                            <v-btn
                                icon
                                size="small"
                                variant="text"
                                color="error"
                                :disabled="steps.length <= 1"
                                @click="removeStep(index)"
                            >
                                <v-icon>mdi-minus-circle</v-icon>
                            </v-btn>
                        </div>

                        <v-btn
                            variant="tonal"
                            size="small"
                            class="mb-4"
                            :disabled="steps.length >= 50"
                            @click="addStep"
                        >
                            <v-icon start>mdi-plus</v-icon>
                            {{ t('workflow.addStep') }}
                        </v-btn>

                        <v-row class="mt-2">
                            <v-col cols="12" sm="4">
                                <v-select
                                    v-model="selectedProfile"
                                    :items="profileOptions"
                                    :label="t('workflow.modelProfile')"
                                    variant="outlined"
                                    density="compact"
                                />
                            </v-col>
                            <v-col cols="12" sm="4">
                                <v-select
                                    v-model="selectedCarry"
                                    :items="carryOptions"
                                    :label="t('workflow.contextCarry')"
                                    variant="outlined"
                                    density="compact"
                                />
                            </v-col>
                            <v-col cols="12" sm="4">
                                <v-text-field
                                    v-model.number="maxStepsPerStep"
                                    :label="t('workflow.maxStepsPerStep')"
                                    type="number"
                                    variant="outlined"
                                    density="compact"
                                    min="1"
                                    max="100"
                                    :placeholder="t('workflow.maxStepsPlaceholder')"
                                    clearable
                                />
                            </v-col>
                        </v-row>

                        <v-switch
                            v-model="allowWrite"
                            :label="t('workflow.allowWrite')"
                            color="warning"
                            density="compact"
                            hide-details
                        />
                    </v-card-text>
                    <v-card-actions>
                        <v-btn
                            color="primary"
                            :loading="workflowStore.loading && !workflowStore.streaming"
                            :disabled="!hasValidSteps || workflowStore.streaming"
                            @click="submitJson"
                        >
                            <v-icon start>mdi-list-status</v-icon>
                            {{ t('workflow.runWorkflow') }}
                        </v-btn>
                        <v-btn
                            color="secondary"
                            :loading="workflowStore.streaming"
                            :disabled="
                                !hasValidSteps ||
                                (workflowStore.loading && !workflowStore.streaming)
                            "
                            @click="submitStream"
                        >
                            <v-icon start>mdi-antenna</v-icon>
                            {{ t('workflow.runWorkflowStream') }}
                        </v-btn>
                    </v-card-actions>
                </v-card>

                <!-- Stream Event Feed -->
                <v-card v-if="workflowStore.streaming || streamFinished" class="mt-4">
                    <v-card-title class="d-flex align-center">
                        <v-icon start>mdi-antenna</v-icon>
                        {{ t('common.liveEvents') }}
                        <v-progress-circular
                            v-if="workflowStore.streaming"
                            indeterminate
                            size="16"
                            class="ml-2"
                        />
                    </v-card-title>
                    <v-card-text>
                        <v-timeline density="compact" side="end">
                            <v-timeline-item
                                v-for="(event, index) in workflowStore.streamEvents"
                                :key="index"
                                :dot-color="workflowEventColor(event.type)"
                                size="small"
                            >
                                <div class="d-flex align-center ga-2">
                                    <v-chip
                                        :color="workflowEventColor(event.type)"
                                        size="x-small"
                                        label
                                    >
                                        {{ event.type }}
                                    </v-chip>
                                    <span class="text-body-2">{{
                                        workflowEventSummary(event)
                                    }}</span>
                                </div>
                            </v-timeline-item>
                        </v-timeline>
                    </v-card-text>
                </v-card>

                <!-- JSON Result -->
                <v-card v-if="latestResult" class="mt-4">
                    <v-card-title class="d-flex align-center">
                        {{ t('common.result') }}
                        <v-spacer />
                        <v-chip
                            size="small"
                            :color="latestResult.allSucceeded ? 'success' : 'error'"
                            class="mr-2"
                        >
                            {{
                                latestResult.allSucceeded
                                    ? t('workflow.allSucceeded')
                                    : t('workflow.someFailed')
                            }}
                        </v-chip>
                        <v-chip size="small" color="secondary">
                            {{ formatDuration(latestResult.totalDurationMs) }}
                        </v-chip>
                    </v-card-title>
                    <v-card-text>
                        <v-expansion-panels>
                            <v-expansion-panel
                                v-for="step in latestResult.response.steps"
                                :key="step.index"
                            >
                                <v-expansion-panel-title>
                                    <div class="d-flex align-center ga-2">
                                        <v-icon
                                            :color="step.success ? 'success' : 'error'"
                                            size="small"
                                        >
                                            {{
                                                step.success
                                                    ? 'mdi-check-circle'
                                                    : 'mdi-close-circle'
                                            }}
                                        </v-icon>
                                        <span class="text-caption text-grey mr-1">
                                            #{{ (step.index ?? 0) + 1 }}
                                        </span>
                                        <span class="text-truncate">{{ step.task }}</span>
                                        <v-chip size="x-small" variant="outlined" class="ml-auto">
                                            {{ formatDuration(step.durationMs ?? 0) }}
                                        </v-chip>
                                    </div>
                                </v-expansion-panel-title>
                                <v-expansion-panel-text>
                                    <p v-if="step.error" class="text-error">{{ step.error }}</p>
                                    <MarkdownRenderer v-else :content="step.result ?? ''" />
                                </v-expansion-panel-text>
                            </v-expansion-panel>
                        </v-expansion-panels>
                    </v-card-text>
                </v-card>
            </v-col>

            <!-- History Sidebar -->
            <v-col cols="12" md="5">
                <v-card>
                    <v-card-title>{{ t('workflow.workflowHistory') }}</v-card-title>
                    <v-card-text
                        v-if="workflowStore.workflowHistory.length === 0"
                        class="text-grey"
                    >
                        {{ t('workflow.noWorkflowsYet') }}
                    </v-card-text>
                    <v-list v-else density="compact">
                        <v-list-item
                            v-for="entry in workflowStore.workflowHistory"
                            :key="entry.id"
                            :active="latestResult?.id === entry.id"
                            rounded="xl"
                            @click="latestResult = entry"
                        >
                            <v-list-item-title class="text-truncate">
                                {{ entry.steps[0] ?? t('workflow.emptyWorkflow') }}
                                <span v-if="entry.steps.length > 1" class="text-grey">
                                    {{ t('workflow.moreSteps', { n: entry.steps.length - 1 }) }}
                                </span>
                            </v-list-item-title>
                            <v-list-item-subtitle class="text-caption">
                                {{ formatTime(entry.timestamp) }}
                                <v-chip v-if="entry.profile" size="x-small" class="ml-1">
                                    {{ entry.profile }}
                                </v-chip>
                                <v-chip
                                    size="x-small"
                                    class="ml-1"
                                    :color="entry.allSucceeded ? 'success' : 'error'"
                                >
                                    {{ t('workflow.stepCount', entry.steps.length) }}
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
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useWorkflowStore, type IWorkflowHistoryEntry } from '@/stores/workflow';
import type {
    WorkflowRequestCarryEnum as WorkflowCarryMode,
    WorkflowRequestProfileEnum as ModelProfile
} from '@api/api';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer.vue';
import { useProfileOptions } from '@/utils/constants';
import { formatTime, formatDuration } from '@/utils/formatting';
import { workflowEventColor, workflowEventSummary } from '@/utils/eventFormatting';

const { t } = useI18n();
const workflowStore = useWorkflowStore();
const profileOptions = useProfileOptions();

const steps = ref<string[]>(['']);
const selectedProfile = ref<ModelProfile | 'auto'>('auto');
const selectedCarry = ref<WorkflowCarryMode>('summary');
const allowWrite = ref(false);
const maxStepsPerStep = ref<number | undefined>(undefined);
const latestResult = ref<IWorkflowHistoryEntry | undefined>(undefined);
const streamFinished = ref(false);

const hasValidSteps = computed(() => steps.value.some((s) => s.trim().length > 0));

const carryOptions = computed(() => [
    { title: t('workflow.carryOptions.summary'), value: 'summary' },
    { title: t('workflow.carryOptions.full'), value: 'full' },
    { title: t('workflow.carryOptions.none'), value: 'none' }
]);

watch(
    () => workflowStore.workflowHistory.length,
    () => {
        if (!latestResult.value && workflowStore.workflowHistory.length > 0) {
            latestResult.value = workflowStore.workflowHistory[0];
        }
    }
);

function addStep(): void {
    if (steps.value.length < 50) {
        steps.value.push('');
    }
}

function removeStep(index: number): void {
    if (steps.value.length > 1) {
        steps.value.splice(index, 1);
    }
}

function submitJson(): void {
    const validSteps = steps.value.map((s) => s.trim()).filter((s) => s.length > 0);
    if (validSteps.length === 0) return;

    streamFinished.value = false;
    const profile = selectedProfile.value === 'auto' ? undefined : selectedProfile.value;
    workflowStore
        .submitWorkflow(
            validSteps,
            selectedCarry.value,
            profile,
            allowWrite.value,
            maxStepsPerStep.value
        )
        .then((result) => {
            if (result) {
                latestResult.value = result;
                steps.value = [''];
            }
        });
}

function submitStream(): void {
    const validSteps = steps.value.map((s) => s.trim()).filter((s) => s.length > 0);
    if (validSteps.length === 0) return;

    streamFinished.value = false;
    const profile = selectedProfile.value === 'auto' ? undefined : selectedProfile.value;
    workflowStore
        .submitWorkflowStream(
            validSteps,
            selectedCarry.value,
            profile,
            allowWrite.value,
            maxStepsPerStep.value
        )
        .then((result) => {
            streamFinished.value = true;
            if (result) {
                latestResult.value = result;
                steps.value = [''];
            }
        });
}
</script>
