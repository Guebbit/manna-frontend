import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';
import type {
    IAutocompleteResponse,
    ILintConventionsResponse,
    IPageReviewResponse
} from '@/api/types';
import { autocomplete, lintConventions, pageReview, ApiError } from '@/api/manna';
import { useNotificationsStore, TOAST_TYPE } from './notification';

/**
 * Pinia store managing IDE code-intelligence operations
 * (autocomplete, lint, and page review).
 */
export const useIdeStore = defineStore('ide', () => {
    const autocompleteResult = ref<IAutocompleteResponse | undefined>(undefined);
    const lintResult = ref<ILintConventionsResponse | undefined>(undefined);
    const reviewResult = ref<IPageReviewResponse | undefined>(undefined);

    const loading = reactive({
        autocomplete: false,
        lint: false,
        review: false
    });

    /**
     * Requests an AI code completion from the backend.
     *
     * @param prefix   - The code text before the cursor.
     * @param suffix   - Optional code text after the cursor.
     * @param language - Optional language identifier for context.
     */
    async function submitAutocomplete(
        prefix: string,
        suffix?: string,
        language?: string
    ): Promise<void> {
        const notificationStore = useNotificationsStore();
        loading.autocomplete = true;
        try {
            autocompleteResult.value = await autocomplete({ prefix, suffix, language });
        } catch (error: unknown) {
            if (error instanceof ApiError) {
                notificationStore.addMessage(error.message, TOAST_TYPE.DANGER, 8000);
            }
            autocompleteResult.value = undefined;
        } finally {
            loading.autocomplete = false;
        }
    }

    /**
     * Submits source code for convention-aware linting analysis.
     *
     * @param parameters - The lint request options (content, language, model, etc.).
     */
    async function submitLint(parameters: {
        content: string;
        language?: string;
        filePath?: string;
        includeLlm?: boolean;
        model?: string;
        maxFindings?: number;
    }): Promise<void> {
        const notificationStore = useNotificationsStore();
        loading.lint = true;
        try {
            lintResult.value = await lintConventions(parameters);
        } catch (error: unknown) {
            if (error instanceof ApiError) {
                notificationStore.addMessage(error.message, TOAST_TYPE.DANGER, 8000);
            }
            lintResult.value = undefined;
        } finally {
            loading.lint = false;
        }
    }

    /**
     * Submits source code for an AI-powered page-level review.
     *
     * @param parameters - The review request options (content, language, model, etc.).
     */
    async function submitReview(parameters: {
        content: string;
        language?: string;
        filePath?: string;
        projectContext?: string;
        model?: string;
    }): Promise<void> {
        const notificationStore = useNotificationsStore();
        loading.review = true;
        try {
            reviewResult.value = await pageReview(parameters);
        } catch (error: unknown) {
            if (error instanceof ApiError) {
                notificationStore.addMessage(error.message, TOAST_TYPE.DANGER, 8000);
            }
            reviewResult.value = undefined;
        } finally {
            loading.review = false;
        }
    }

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
