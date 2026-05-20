/**
 * @module stores/ide
 *
 * Pinia store for the three direct IDE code-intelligence endpoints.
 *
 * Unlike the agent and swarm stores, these endpoints bypass the agentic loop
 * entirely and call specialised backend routes directly:
 * - `/autocomplete`     — Fill-in-the-middle code completion (code-specialised model).
 * - `/lint-conventions` — Deterministic linting + optional LLM review pass.
 * - `/page-review`      — Holistic AI-powered review of an entire source file.
 *
 * The direct-to-model approach gives lower latency at the cost of not having tool
 * access.  These endpoints are optimised for interactive IDE-style use cases.
 */
import { defineStore } from 'pinia';
import { computed, reactive, ref } from 'vue';
import { useCoreStore, useStructureRestApi } from '@guebbit/vue-toolkit';
import type { AutocompleteResponse, LintResponse, PageReviewResponse } from '@api';
import { ideApi } from '@/utils/api';
import { handleApiError } from '@/utils/errorHandling';

/**
 * Pinia store managing IDE code-intelligence operations
 * (autocomplete, lint, and page review).
 */
export const useIdeStore = defineStore('ide', () => {
    const { getLoading, setLoading } = useCoreStore();
    const { fetchAny } = useStructureRestApi({
        getLoading,
        setLoading,
        loadingKey: 'ide'
    });

    const autocompleteResult = ref<AutocompleteResponse | undefined>(undefined);
    const lintResult = ref<LintResponse | undefined>(undefined);
    const reviewResult = ref<PageReviewResponse | undefined>(undefined);

    const loading = reactive({
        autocomplete: computed(() => getLoading('ide-autocomplete')),
        lint: computed(() => getLoading('ide-lint')),
        review: computed(() => getLoading('ide-review'))
    });

    /**
     * Requests an AI code completion from the backend.
     *
     * @param prefix   - The code text before the cursor.
     * @param suffix   - Optional code text after the cursor.
     * @param language - Optional language identifier for context.
     */
    const submitAutocomplete = (prefix: string, suffix?: string, language?: string) => {
        return fetchAny(
            () =>
                ideApi
                    .postAutocomplete({ autocompleteRequest: { prefix, suffix, language } })
                    .then(({ data }) => {
                        autocompleteResult.value = data.data;
                    }),
            {
                lastUpdateKey: 'autocomplete',
                loadingKey: '-autocomplete'
            }
        ).catch((error: unknown) => {
            handleApiError(error, 'Autocomplete failed');
            autocompleteResult.value = undefined;
        });
    };

    /**
     * Submits source code for convention-aware linting analysis.
     *
     * @param parameters - The lint request options (code, language, model, etc.).
     */
    const submitLint = (parameters: {
        code: string;
        language?: string;
        filename?: string;
        includeLlm?: boolean;
        model?: string;
        maxFindings?: number;
    }) => {
        return fetchAny(
            () =>
                ideApi
                    .postLintConventions({ lintConventionsRequest: parameters })
                    .then(({ data }) => {
                        lintResult.value = data.data;
                    }),
            {
                lastUpdateKey: 'lint',
                loadingKey: '-lint'
            }
        ).catch((error: unknown) => {
            handleApiError(error, 'Lint analysis failed');
            lintResult.value = undefined;
        });
    };

    /**
     * Submits source code for an AI-powered page-level review.
     *
     * @param parameters - The review request options (code, language, model, etc.).
     */
    const submitReview = (parameters: {
        code: string;
        language?: string;
        filename?: string;
        projectContext?: string;
        model?: string;
    }) => {
        return fetchAny(
            () =>
                ideApi.postPageReview({ pageReviewRequest: parameters }).then(({ data }) => {
                    reviewResult.value = data.data;
                }),
            {
                lastUpdateKey: 'review',
                loadingKey: '-review'
            }
        ).catch((error: unknown) => {
            handleApiError(error, 'Page review failed');
            reviewResult.value = undefined;
        });
    };

    return {
        autocompleteResult,
        lintResult,
        reviewResult,
        loading,
        submitAutocomplete,
        submitLint,
        submitReview
    };
});
