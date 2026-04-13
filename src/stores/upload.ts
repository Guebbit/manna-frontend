import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';
import type { IImageClassifyResponse, ISpeechToTextResponse, IReadPdfResponse } from '@/api/types';
import { uploadImageClassify, uploadSpeechToText, uploadReadPdf, ApiError } from '@/api/manna';
import { useNotificationStore } from './notification';

/**
 * Pinia store managing file upload operations
 * (image classification, speech-to-text, and PDF reading).
 */
export const useUploadStore = defineStore('upload', () => {
    const imageClassifyResult = ref<IImageClassifyResponse | undefined>(undefined);
    const speechToTextResult = ref<ISpeechToTextResponse | undefined>(undefined);
    const readPdfResult = ref<IReadPdfResponse | undefined>(undefined);

    const loading = reactive({
        imageClassify: false,
        speechToText: false,
        readPdf: false
    });

    /**
     * Uploads an image for AI-powered classification.
     *
     * @param file   - The image file to classify.
     * @param prompt - Optional prompt to guide the classification.
     * @param model  - Optional model override.
     */
    async function classifyImage(file: File, prompt?: string, model?: string): Promise<void> {
        const notificationStore = useNotificationStore();
        loading.imageClassify = true;
        try {
            imageClassifyResult.value = await uploadImageClassify({ file, prompt, model });
        } catch (error: unknown) {
            if (error instanceof ApiError) {
                notificationStore.error(error.message);
            }
            imageClassifyResult.value = undefined;
        } finally {
            loading.imageClassify = false;
        }
    }

    /**
     * Uploads an audio file for speech-to-text transcription.
     *
     * @param file     - The audio file to transcribe.
     * @param model    - Optional model override.
     * @param language - Optional language hint for the transcription engine.
     * @param prompt   - Optional prompt to guide transcription.
     */
    async function transcribeAudio(
        file: File,
        model?: string,
        language?: string,
        prompt?: string
    ): Promise<void> {
        const notificationStore = useNotificationStore();
        loading.speechToText = true;
        try {
            speechToTextResult.value = await uploadSpeechToText({
                file,
                model,
                language,
                prompt
            });
        } catch (error: unknown) {
            if (error instanceof ApiError) {
                notificationStore.error(error.message);
            }
            speechToTextResult.value = undefined;
        } finally {
            loading.speechToText = false;
        }
    }

    /**
     * Uploads a PDF file for text extraction.
     *
     * @param file - The PDF file to read.
     */
    async function readPdf(file: File): Promise<void> {
        const notificationStore = useNotificationStore();
        loading.readPdf = true;
        try {
            readPdfResult.value = await uploadReadPdf({ file });
        } catch (error: unknown) {
            if (error instanceof ApiError) {
                notificationStore.error(error.message);
            }
            readPdfResult.value = undefined;
        } finally {
            loading.readPdf = false;
        }
    }

    return {
        imageClassifyResult,
        speechToTextResult,
        readPdfResult,
        loading,
        classifyImage,
        transcribeAudio,
        readPdf
    };
});
