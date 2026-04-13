<template>
    <div>
        <h1 class="text-h4 mb-6">Code Tools</h1>

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
                        />
                        <v-textarea
                            v-model="autoPrefix"
                            label="Code prefix (before cursor)"
                            variant="outlined"
                            rows="6"
                            class="code-textarea"
                        />
                        <v-textarea
                            v-model="autoSuffix"
                            label="Code suffix (after cursor)"
                            variant="outlined"
                            rows="3"
                            class="code-textarea"
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
                        <CopyButton :text="ideStore.autocompleteResult.completion" />
                        <v-chip size="small" class="ml-2">
                            {{ ideStore.autocompleteResult.latencyMs }}ms
                        </v-chip>
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
                                    v-model="lintFilePath"
                                    label="File path (optional)"
                                    variant="outlined"
                                    density="compact"
                                />
                            </v-col>
                        </v-row>
                        <v-textarea
                            v-model="lintContent"
                            label="Code to lint"
                            variant="outlined"
                            rows="8"
                            class="code-textarea"
                        />
                        <v-row class="mt-1">
                            <v-col cols="auto">
                                <v-switch
                                    v-model="lintIncludeLlm"
                                    label="Include LLM analysis"
                                    density="compact"
                                    hide-details
                                />
                            </v-col>
                            <v-col cols="12" sm="4">
                                <v-slider
                                    v-model="lintMaxFindings"
                                    label="Max findings"
                                    :min="1"
                                    :max="200"
                                    :step="1"
                                    thumb-label
                                />
                            </v-col>
                        </v-row>
                    </v-card-text>
                    <v-card-actions>
                        <v-btn
                            color="primary"
                            :loading="ideStore.loading.lint"
                            :disabled="!lintContent.trim()"
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
                            {{ ideStore.lintResult.summary.errors }} errors
                        </v-chip>
                        <v-chip size="small" color="warning" class="ml-1">
                            {{ ideStore.lintResult.summary.warnings }} warnings
                        </v-chip>
                        <v-chip size="small" color="info" class="ml-1">
                            {{ ideStore.lintResult.summary.infos }} info
                        </v-chip>
                    </v-card-title>
                    <v-card-text>
                        <v-table density="compact">
                            <thead>
                                <tr>
                                    <th>Severity</th>
                                    <th>Source</th>
                                    <th>Message</th>
                                    <th>Line</th>
                                    <th>Rule</th>
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
                                    <td>{{ finding.source }}</td>
                                    <td>{{ finding.message }}</td>
                                    <td>{{ finding.line ?? '–' }}</td>
                                    <td class="text-caption">{{ finding.rule ?? '–' }}</td>
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
                                    v-model="reviewFilePath"
                                    label="File path (optional)"
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
                            v-model="reviewContent"
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
                        />
                    </v-card-text>
                    <v-card-actions>
                        <v-btn
                            color="primary"
                            :loading="ideStore.loading.review"
                            :disabled="!reviewContent.trim()"
                            @click="submitReview"
                        >
                            <v-icon start>mdi-file-search</v-icon>
                            Review
                        </v-btn>
                    </v-card-actions>
                </v-card>

                <!-- Review Results -->
                <div v-if="ideStore.reviewResult" class="mt-4">
                    <v-expansion-panels>
                        <v-expansion-panel v-for="(category, key) in reviewCategories" :key="key">
                            <v-expansion-panel-title>
                                <v-icon start>{{ category.icon }}</v-icon>
                                {{ category.label }}
                                <v-chip size="x-small" class="ml-2">
                                    {{ category.items.length }}
                                </v-chip>
                            </v-expansion-panel-title>
                            <v-expansion-panel-text>
                                <v-card
                                    v-for="(suggestion, sIndex) in category.items"
                                    :key="sIndex"
                                    class="mb-2"
                                    variant="outlined"
                                >
                                    <v-card-title class="text-subtitle-2 d-flex align-center">
                                        {{ suggestion.title }}
                                        <v-spacer />
                                        <v-chip
                                            size="x-small"
                                            :color="priorityColor(suggestion.priority)"
                                        >
                                            {{ suggestion.priority }}
                                        </v-chip>
                                    </v-card-title>
                                    <v-card-text class="text-body-2">
                                        {{ suggestion.detail }}
                                    </v-card-text>
                                </v-card>
                                <p v-if="category.items.length === 0" class="text-grey">
                                    No suggestions in this category.
                                </p>
                            </v-expansion-panel-text>
                        </v-expansion-panel>
                    </v-expansion-panels>
                </div>
            </v-tabs-window-item>
        </v-tabs-window>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useIdeStore } from '@/stores/ide';
import type { ICategorizedSuggestion } from '@/api/types';
import CopyButton from '@/components/shared/CopyButton.vue';

const ideStore = useIdeStore();

const activeTab = ref('autocomplete');

// Autocomplete
const autoPrefix = ref('');
const autoSuffix = ref('');
const autoLanguage = ref('typescript');

// Lint
const lintContent = ref('');
const lintLanguage = ref('typescript');
const lintFilePath = ref('');
const lintIncludeLlm = ref(true);
const lintMaxFindings = ref(80);

// Review
const reviewContent = ref('');
const reviewLanguage = ref('typescript');
const reviewFilePath = ref('');
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
        content: lintContent.value,
        language: lintLanguage.value || undefined,
        filePath: lintFilePath.value || undefined,
        includeLlm: lintIncludeLlm.value,
        maxFindings: lintMaxFindings.value
    });
}

function submitReview(): void {
    void ideStore.submitReview({
        content: reviewContent.value,
        language: reviewLanguage.value || undefined,
        filePath: reviewFilePath.value || undefined,
        projectContext: reviewProjectContext.value || undefined,
        model: reviewModel.value || undefined
    });
}

function severityColor(severity: string): string {
    const map: Record<string, string> = { error: 'error', warning: 'warning', info: 'info' };
    return map[severity] ?? 'grey';
}

function priorityColor(priority: string): string {
    const map: Record<string, string> = { high: 'error', medium: 'warning', low: 'success' };
    return map[priority] ?? 'grey';
}

const reviewCategories = computed(() => {
    const categories = ideStore.reviewResult?.categories;
    if (!categories) return [];
    return [
        {
            key: 'correctness',
            label: 'Correctness',
            icon: 'mdi-check-circle',
            items: categories.correctness as ICategorizedSuggestion[]
        },
        {
            key: 'maintainability',
            label: 'Maintainability',
            icon: 'mdi-wrench',
            items: categories.maintainability as ICategorizedSuggestion[]
        },
        {
            key: 'standards',
            label: 'Standards',
            icon: 'mdi-book-open-variant',
            items: categories.standards as ICategorizedSuggestion[]
        },
        {
            key: 'enhancements',
            label: 'Enhancements',
            icon: 'mdi-lightbulb',
            items: categories.enhancements as ICategorizedSuggestion[]
        }
    ];
});
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
