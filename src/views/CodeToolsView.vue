<template>
    <div>
        <h1 class="text-h4 mb-2">Code Tools</h1>
        <p class="text-body-2 text-grey mb-6">
            Direct IDE endpoints — fast, single-purpose code intelligence. These bypass the agent
            loop for lower latency, calling specialised models directly.
        </p>

        <v-tabs v-model="activeTab" color="primary">
            <v-tab value="autocomplete">Autocomplete</v-tab>
            <v-tab value="lint">Lint &amp; Conventions</v-tab>
            <v-tab value="review">Page Review</v-tab>
        </v-tabs>

        <v-tabs-window v-model="activeTab" class="mt-4">
            <!-- Autocomplete Tab -->
            <v-tabs-window-item value="autocomplete">
                <v-card>
                    <v-card-text>
                        <v-select
                            v-model="autoLanguage"
                            :items="languages"
                            label="Language"
                            variant="outlined"
                            density="compact"
                            class="mb-3"
                            hint="Helps the model produce syntax-correct completions for your language."
                            persistent-hint
                        />
                        <v-textarea
                            v-model="autoPrefix"
                            label="Code prefix (before cursor)"
                            variant="outlined"
                            rows="6"
                            class="code-textarea"
                            hint="The code before your cursor position. The model continues writing from here."
                            persistent-hint
                        />
                        <v-textarea
                            v-model="autoSuffix"
                            label="Code suffix (after cursor)"
                            variant="outlined"
                            rows="3"
                            class="code-textarea"
                            hint="The code after your cursor. Enables fill-in-the-middle (FIM) mode for better context-aware completions."
                            persistent-hint
                        />
                    </v-card-text>
                    <v-card-actions>
                        <v-btn
                            color="primary"
                            :loading="ideStore.loading.autocomplete"
                            :disabled="!autoPrefix.trim()"
                            @click="submitAutocomplete"
                        >
                            <v-icon start>mdi-lightning-bolt</v-icon>
                            Complete
                        </v-btn>
                    </v-card-actions>
                </v-card>

                <v-card v-if="ideStore.autocompleteResult" class="mt-4">
                    <v-card-title class="d-flex align-center">
                        Completion
                        <v-spacer />
                        <CopyButton :text="ideStore.autocompleteResult.completion ?? ''" />
                        <v-tooltip
                            text="Round-trip time including model inference. Powered by a fast code-specialised model."
                            location="top"
                        >
                            <template #activator="{ props: tooltipProps }">
                                <v-chip v-bind="tooltipProps" size="small" class="ml-2">
                                    {{ ideStore.autocompleteResult.latencyMs }}ms
                                </v-chip>
                            </template>
                        </v-tooltip>
                    </v-card-title>
                    <v-card-text>
                        <pre class="completion-result">{{
                            ideStore.autocompleteResult.completion
                        }}</pre>
                    </v-card-text>
                </v-card>
            </v-tabs-window-item>

            <!-- Lint Tab -->
            <v-tabs-window-item value="lint">
                <v-card>
                    <v-card-text>
                        <v-row>
                            <v-col cols="12" sm="6">
                                <v-select
                                    v-model="lintLanguage"
                                    :items="languages"
                                    label="Language"
                                    variant="outlined"
                                    density="compact"
                                />
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field
                                    v-model="lintFilename"
                                    label="Filename (optional)"
                                    variant="outlined"
                                    density="compact"
                                />
                            </v-col>
                        </v-row>
                        <v-textarea
                            v-model="lintCode"
                            label="Code to lint"
                            variant="outlined"
                            rows="8"
                            class="code-textarea"
                        />
                        <v-row class="mt-1">
                            <v-col cols="auto">
                                <v-tooltip
                                    text="When off, only deterministic TypeScript/convention rules run (fastest). When on, an AI model also reviews the code for style, bugs, and best practices."
                                    location="top"
                                    max-width="320"
                                >
                                    <template #activator="{ props: tooltipProps }">
                                        <v-switch
                                            v-bind="tooltipProps"
                                            v-model="lintIncludeLlm"
                                            label="Include LLM analysis"
                                            density="compact"
                                            hide-details
                                        />
                                    </template>
                                </v-tooltip>
                            </v-col>
                            <v-col cols="12" sm="4">
                                <v-slider
                                    v-model="lintMaxFindings"
                                    label="Max findings"
                                    :min="1"
                                    :max="200"
                                    :step="1"
                                    thumb-label
                                    hint="Cap the number of reported issues. Useful for large files."
                                    persistent-hint
                                />
                            </v-col>
                        </v-row>
                    </v-card-text>
                    <v-card-actions>
                        <v-btn
                            color="primary"
                            :loading="ideStore.loading.lint"
                            :disabled="!lintCode.trim()"
                            @click="submitLint"
                        >
                            <v-icon start>mdi-magnify</v-icon>
                            Lint
                        </v-btn>
                    </v-card-actions>
                </v-card>

                <!-- Lint Results -->
                <v-card v-if="ideStore.lintResult" class="mt-4">
                    <v-card-title>
                        Findings
                        <v-chip size="small" color="error" class="ml-2">
                            {{ ideStore.lintResult.summary?.errors ?? 0 }} errors
                        </v-chip>
                        <v-chip size="small" color="warning" class="ml-1">
                            {{ ideStore.lintResult.summary?.warnings ?? 0 }} warnings
                        </v-chip>
                        <v-chip size="small" color="info" class="ml-1">
                            {{ ideStore.lintResult.summary?.infos ?? 0 }} info
                        </v-chip>
                    </v-card-title>
                    <v-card-text>
                        <v-table density="compact">
                            <thead>
                                <tr>
                                    <th>Severity</th>
                                    <th>Message</th>
                                    <th>Line</th>
                                    <th>Rule</th>
                                    <th>Suggestion</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="(finding, index) in ideStore.lintResult.findings"
                                    :key="index"
                                >
                                    <td>
                                        <v-chip
                                            size="x-small"
                                            :color="severityColor(finding.severity)"
                                        >
                                            {{ finding.severity }}
                                        </v-chip>
                                    </td>
                                    <td>{{ finding.message }}</td>
                                    <td>{{ finding.line ?? '–' }}</td>
                                    <td class="text-caption">{{ finding.rule ?? '–' }}</td>
                                    <td>{{ finding.suggestion ?? '–' }}</td>
                                </tr>
                            </tbody>
                        </v-table>
                    </v-card-text>
                </v-card>
            </v-tabs-window-item>

            <!-- Page Review Tab -->
            <v-tabs-window-item value="review">
                <v-card>
                    <v-card-text>
                        <v-row>
                            <v-col cols="12" sm="4">
                                <v-select
                                    v-model="reviewLanguage"
                                    :items="languages"
                                    label="Language"
                                    variant="outlined"
                                    density="compact"
                                />
                            </v-col>
                            <v-col cols="12" sm="4">
                                <v-text-field
                                    v-model="reviewFilename"
                                    label="Filename (optional)"
                                    variant="outlined"
                                    density="compact"
                                />
                            </v-col>
                            <v-col cols="12" sm="4">
                                <v-text-field
                                    v-model="reviewModel"
                                    label="Model override (optional)"
                                    variant="outlined"
                                    density="compact"
                                />
                            </v-col>
                        </v-row>
                        <v-textarea
                            v-model="reviewCode"
                            label="Code to review"
                            variant="outlined"
                            rows="8"
                            class="code-textarea"
                        />
                        <v-textarea
                            v-model="reviewProjectContext"
                            label="Project context (optional)"
                            variant="outlined"
                            rows="2"
                            hint="Describe your project briefly (e.g. 'Vue 3 SPA with Pinia stores') so the reviewer gives more relevant, targeted suggestions."
                            persistent-hint
                        />
                    </v-card-text>
                    <v-card-actions>
                        <v-btn
                            color="primary"
                            :loading="ideStore.loading.review"
                            :disabled="!reviewCode.trim()"
                            @click="submitReview"
                        >
                            <v-icon start>mdi-file-search</v-icon>
                            Review
                        </v-btn>
                    </v-card-actions>
                </v-card>

                <!-- Review Results -->
                <v-card v-if="ideStore.reviewResult" class="mt-4">
                    <v-card-title>
                        Findings
                        <v-chip size="x-small" class="ml-2">
                            {{ ideStore.reviewResult.findings?.length ?? 0 }}
                        </v-chip>
                    </v-card-title>
                    <v-card-text>
                        <v-list
                            v-if="(ideStore.reviewResult.findings?.length ?? 0) > 0"
                            density="compact"
                        >
                            <v-list-item
                                v-for="(finding, index) in ideStore.reviewResult.findings"
                                :key="index"
                            >
                                <v-list-item-title class="text-body-2">
                                    {{
                                        typeof finding === 'string'
                                            ? finding
                                            : JSON.stringify(finding)
                                    }}
                                </v-list-item-title>
                            </v-list-item>
                        </v-list>
                        <p v-else class="text-grey">No findings returned.</p>
                    </v-card-text>
                </v-card>
            </v-tabs-window-item>
        </v-tabs-window>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useIdeStore } from '@/stores/ide';
import CopyButton from '@/components/shared/CopyButton.vue';

const ideStore = useIdeStore();

const activeTab = ref('autocomplete');

// Autocomplete
const autoPrefix = ref('');
const autoSuffix = ref('');
const autoLanguage = ref('typescript');

// Lint
const lintCode = ref('');
const lintLanguage = ref('typescript');
const lintFilename = ref('');
const lintIncludeLlm = ref(true);
const lintMaxFindings = ref(80);

// Review
const reviewCode = ref('');
const reviewLanguage = ref('typescript');
const reviewFilename = ref('');
const reviewProjectContext = ref('');
const reviewModel = ref('');

const languages = [
    'typescript',
    'javascript',
    'python',
    'go',
    'rust',
    'java',
    'c',
    'cpp',
    'csharp',
    'html',
    'css',
    'scss',
    'json',
    'yaml',
    'markdown'
];

function submitAutocomplete(): void {
    void ideStore.submitAutocomplete(
        autoPrefix.value,
        autoSuffix.value || undefined,
        autoLanguage.value
    );
}

function submitLint(): void {
    void ideStore.submitLint({
        code: lintCode.value,
        language: lintLanguage.value || undefined,
        filename: lintFilename.value || undefined,
        includeLlm: lintIncludeLlm.value,
        maxFindings: lintMaxFindings.value
    });
}

function submitReview(): void {
    void ideStore.submitReview({
        code: reviewCode.value,
        language: reviewLanguage.value || undefined,
        filename: reviewFilename.value || undefined,
        projectContext: reviewProjectContext.value || undefined,
        model: reviewModel.value || undefined
    });
}

function severityColor(severity = ''): string {
    const map: Record<string, string> = { error: 'error', warning: 'warning', info: 'info' };
    return map[severity] ?? 'grey';
}
</script>

<style scoped>
.code-textarea :deep(textarea) {
    font-family: 'Fira Code', 'Cascadia Code', monospace;
    font-size: 0.875rem;
}

.completion-result {
    background: #1e1e1e;
    border-radius: 8px;
    padding: 16px;
    overflow-x: auto;
    font-family: 'Fira Code', 'Cascadia Code', monospace;
    font-size: 0.875rem;
    white-space: pre-wrap;
}
</style>
