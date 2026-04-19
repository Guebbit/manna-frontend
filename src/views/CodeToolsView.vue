<template>
    <div>
        <h1 class="text-h4 mb-2">{{ t('codeTools.title') }}</h1>
        <p class="text-body-2 text-grey mb-6">{{ t('codeTools.subtitle') }}</p>

        <v-tabs v-model="activeTab" color="primary">
            <v-tab value="autocomplete">{{ t('codeTools.tabAutocomplete') }}</v-tab>
            <v-tab value="lint">{{ t('codeTools.tabLint') }}</v-tab>
            <v-tab value="review">{{ t('codeTools.tabReview') }}</v-tab>
        </v-tabs>

        <v-tabs-window v-model="activeTab" class="mt-4">
            <!-- Autocomplete Tab -->
            <v-tabs-window-item value="autocomplete">
                <v-card>
                    <v-card-text>
                        <v-select
                            v-model="autoLanguage"
                            :items="languages"
                            :label="t('codeTools.language')"
                            variant="outlined"
                            density="compact"
                            class="mb-3"
                            :hint="t('codeTools.languageHint')"
                            persistent-hint
                        />
                        <v-textarea
                            v-model="autoPrefix"
                            :label="t('codeTools.codePrefix')"
                            variant="outlined"
                            rows="6"
                            class="code-textarea"
                            :hint="t('codeTools.codePrefixHint')"
                            persistent-hint
                        />
                        <v-textarea
                            v-model="autoSuffix"
                            :label="t('codeTools.codeSuffix')"
                            variant="outlined"
                            rows="3"
                            class="code-textarea"
                            :hint="t('codeTools.codeSuffixHint')"
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
                            {{ t('codeTools.complete') }}
                        </v-btn>
                    </v-card-actions>
                </v-card>

                <v-card v-if="ideStore.autocompleteResult" class="mt-4">
                    <v-card-title class="d-flex align-center">
                        {{ t('codeTools.completion') }}
                        <v-spacer />
                        <CopyButton :text="ideStore.autocompleteResult.completion ?? ''" />
                        <v-tooltip :text="t('codeTools.completionTooltip')" location="top">
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
                                    :label="t('codeTools.language')"
                                    variant="outlined"
                                    density="compact"
                                />
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field
                                    v-model="lintFilename"
                                    :label="t('codeTools.filename')"
                                    variant="outlined"
                                    density="compact"
                                />
                            </v-col>
                        </v-row>
                        <v-textarea
                            v-model="lintCode"
                            :label="t('codeTools.codeToLint')"
                            variant="outlined"
                            rows="8"
                            class="code-textarea"
                        />
                        <v-row class="mt-1">
                            <v-col cols="auto">
                                <v-tooltip
                                    :text="t('codeTools.includeLlmTooltip')"
                                    location="top"
                                    max-width="320"
                                >
                                    <template #activator="{ props: tooltipProps }">
                                        <v-switch
                                            v-bind="tooltipProps"
                                            v-model="lintIncludeLlm"
                                            :label="t('codeTools.includeLlm')"
                                            density="compact"
                                            hide-details
                                        />
                                    </template>
                                </v-tooltip>
                            </v-col>
                            <v-col cols="12" sm="4">
                                <v-slider
                                    v-model="lintMaxFindings"
                                    :label="t('codeTools.maxFindings')"
                                    :min="1"
                                    :max="200"
                                    :step="1"
                                    thumb-label
                                    :hint="t('codeTools.maxFindingsHint')"
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
                            {{ t('codeTools.lint') }}
                        </v-btn>
                    </v-card-actions>
                </v-card>

                <!-- Lint Results -->
                <v-card v-if="ideStore.lintResult" class="mt-4">
                    <v-card-title>
                        {{ t('common.findings') }}
                        <v-chip size="small" color="error" class="ml-2">
                            {{
                                t('codeTools.errorsCount', {
                                    n: ideStore.lintResult.summary?.errors ?? 0
                                })
                            }}
                        </v-chip>
                        <v-chip size="small" color="warning" class="ml-1">
                            {{
                                t('codeTools.warningsCount', {
                                    n: ideStore.lintResult.summary?.warnings ?? 0
                                })
                            }}
                        </v-chip>
                        <v-chip size="small" color="info" class="ml-1">
                            {{
                                t('codeTools.infoCount', {
                                    n: ideStore.lintResult.summary?.infos ?? 0
                                })
                            }}
                        </v-chip>
                    </v-card-title>
                    <v-card-text>
                        <v-table density="compact">
                            <thead>
                                <tr>
                                    <th>{{ t('codeTools.severity') }}</th>
                                    <th>{{ t('codeTools.message') }}</th>
                                    <th>{{ t('codeTools.line') }}</th>
                                    <th>{{ t('codeTools.rule') }}</th>
                                    <th>{{ t('codeTools.suggestion') }}</th>
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
                                    <td>{{ finding.line ?? '\u2013' }}</td>
                                    <td class="text-caption">{{ finding.rule ?? '\u2013' }}</td>
                                    <td>\u2013</td>
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
                                    :label="t('codeTools.language')"
                                    variant="outlined"
                                    density="compact"
                                />
                            </v-col>
                            <v-col cols="12" sm="4">
                                <v-text-field
                                    v-model="reviewFilename"
                                    :label="t('codeTools.filename')"
                                    variant="outlined"
                                    density="compact"
                                />
                            </v-col>
                            <v-col cols="12" sm="4">
                                <v-text-field
                                    v-model="reviewModel"
                                    :label="t('codeTools.modelOverride')"
                                    variant="outlined"
                                    density="compact"
                                />
                            </v-col>
                        </v-row>
                        <v-textarea
                            v-model="reviewCode"
                            :label="t('codeTools.codeToReview')"
                            variant="outlined"
                            rows="8"
                            class="code-textarea"
                        />
                        <v-textarea
                            v-model="reviewProjectContext"
                            :label="t('codeTools.projectContext')"
                            variant="outlined"
                            rows="2"
                            :hint="t('codeTools.projectContextHint')"
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
                            {{ t('codeTools.review') }}
                        </v-btn>
                    </v-card-actions>
                </v-card>

                <!-- Review Results -->
                <v-card v-if="ideStore.reviewResult" class="mt-4">
                    <v-card-title>
                        {{ t('common.findings') }}
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
                        <p v-else class="text-grey">{{ t('codeTools.noFindingsReturned') }}</p>
                    </v-card-text>
                </v-card>
            </v-tabs-window-item>
        </v-tabs-window>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useIdeStore } from '@/stores/ide';
import CopyButton from '@/components/shared/CopyButton.vue';

const { t } = useI18n();
const ideStore = useIdeStore();

const activeTab = ref('autocomplete');

const autoPrefix = ref('');
const autoSuffix = ref('');
const autoLanguage = ref('typescript');

const lintCode = ref('');
const lintLanguage = ref('typescript');
const lintFilename = ref('');
const lintIncludeLlm = ref(true);
const lintMaxFindings = ref(80);

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
