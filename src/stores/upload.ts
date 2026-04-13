import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';
import type { IImageClassifyResponse, ISpeechToTextResponse, IReadPdfResponse } from '@/api/types';
import { uploadImageClassify, uploadSpeechToText, uploadReadPdf, ApiError } from '@/api/manna';
import { useNotificationStore } from './notification';

export const useUploadStore = defineStore('upload', () => {
    const imageClassifyResult = ref<IImageClassifyResponse | undefined>(undefined);
    const speechToTextResult = ref<ISpeechToTextResponse | undefined>(undefined);
    const readPdfResult = ref<IReadPdfResponse | undefined>(undefined);

    const loading = reactive({
        imageClassify: false,
        speechToText: false,
        readPdf: false
    });

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
