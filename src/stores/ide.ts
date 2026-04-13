import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';
import type {
    IAutocompleteResponse,
    ILintConventionsResponse,
    IPageReviewResponse
} from '@/api/types';
import { autocomplete, lintConventions, pageReview, ApiError } from '@/api/manna';
import { useNotificationStore } from './notification';

export const useIdeStore = defineStore('ide', () => {
    const autocompleteResult = ref<IAutocompleteResponse | undefined>(undefined);
    const lintResult = ref<ILintConventionsResponse | undefined>(undefined);
    const reviewResult = ref<IPageReviewResponse | undefined>(undefined);

    const loading = reactive({
        autocomplete: false,
        lint: false,
        review: false
    });

    async function submitAutocomplete(
        prefix: string,
        suffix?: string,
        language?: string
    ): Promise<void> {
        const notificationStore = useNotificationStore();
        loading.autocomplete = true;
        try {
            autocompleteResult.value = await autocomplete({ prefix, suffix, language });
        } catch (error: unknown) {
            if (error instanceof ApiError) {
                notificationStore.error(error.message);
            }
            autocompleteResult.value = undefined;
        } finally {
            loading.autocomplete = false;
        }
    }

    async function submitLint(parameters: {
        content: string;
        language?: string;
        filePath?: string;
        includeLlm?: boolean;
        model?: string;
        maxFindings?: number;
    }): Promise<void> {
        const notificationStore = useNotificationStore();
        loading.lint = true;
        try {
            lintResult.value = await lintConventions(parameters);
        } catch (error: unknown) {
            if (error instanceof ApiError) {
                notificationStore.error(error.message);
            }
            lintResult.value = undefined;
        } finally {
            loading.lint = false;
        }
    }

    async function submitReview(parameters: {
        content: string;
        language?: string;
        filePath?: string;
        projectContext?: string;
        model?: string;
    }): Promise<void> {
        const notificationStore = useNotificationStore();
        loading.review = true;
        try {
            reviewResult.value = await pageReview(parameters);
        } catch (error: unknown) {
            if (error instanceof ApiError) {
                notificationStore.error(error.message);
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
