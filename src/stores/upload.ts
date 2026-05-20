/**
 * @module stores/upload
 *
 * Pinia store for file-upload analysis operations.
 *
 * Each upload type targets a different backend tool:
 * - **Image classify** (`/upload/image-classify`) — Sends the image to a multimodal
 *   vision model (e.g. LLaVA) which describes or classifies the visual content.
 * - **Image sketch** (`/upload/image-sketch`) — Generates a sketch/line-art version
 *   of the uploaded image using the image processor service.
 * - **Image colorize** (`/upload/image-colorize`) — Colorizes an uploaded image via
 *   the image processor service.
 * - **Speech to text** (`/upload/speech-to-text`) — Transcribes audio using the
 *   Whisper model.  A language hint and context prompt improve accuracy.
 * - **Read PDF** (`/upload/read-pdf`) — Extracts raw text from the PDF using
 *   `pdf-parse` (no AI involved — fast and deterministic).
 */
import { defineStore } from 'pinia';
import { computed, reactive, ref } from 'vue';
import { useCoreStore, useStructureRestApi } from '@guebbit/vue-toolkit';
import type {
    UploadImageClassify200Response,
    UploadImageSketch200Response,
    UploadReadPdf200Response,
    UploadSpeechToText200Response
} from '@api';
import { uploadApi } from '@/utils/api';
import { handleApiError } from '@/utils/errorHandling';

export type UploadImageProcessorResponseType = 'json' | 'png';

/**
 * Pinia store managing file upload operations
 * (classification, sketch/colorize transforms, speech-to-text, and PDF reading).
 */
export const useUploadStore = defineStore('upload', () => {
    const { getLoading, setLoading } = useCoreStore();
    const { fetchAny } = useStructureRestApi({
        getLoading,
        setLoading,
        loadingKey: 'upload'
    });

    const imageClassifyResult = ref<UploadImageClassify200Response | undefined>(undefined);
    const imageSketchResult = ref<UploadImageSketch200Response | Blob | undefined>(undefined);
    const imageColorizeResult = ref<UploadImageSketch200Response | Blob | undefined>(undefined);
    const speechToTextResult = ref<UploadSpeechToText200Response | undefined>(undefined);
    const readPdfResult = ref<UploadReadPdf200Response | undefined>(undefined);

    const loading = reactive({
        imageClassify: computed(() => getLoading('upload-imageClassify')),
        imageSketch: computed(() => getLoading('upload-imageSketch')),
        imageColorize: computed(() => getLoading('upload-imageColorize')),
        speechToText: computed(() => getLoading('upload-speechToText')),
        readPdf: computed(() => getLoading('upload-readPdf'))
    });

    /**
     * Uploads an image for AI-powered classification.
     *
     * @param file   - The image file to classify.
     * @param prompt - Optional prompt to guide the classification.
     * @param model  - Optional model override.
     */
    const classifyImage = (file: File, prompt?: string, model?: string) => {
        return fetchAny(
            () =>
                uploadApi.uploadImageClassify({ file, prompt, model }).then(({ data }) => {
                    imageClassifyResult.value = data;
                }),
            {
                loadingKey: '-imageClassify'
            }
        ).catch((error: unknown) => {
            handleApiError(error, 'Image classification failed');
            imageClassifyResult.value = undefined;
        });
    };

    /**
     * Uploads an image for sketch generation.
     *
     * @param file         - The source image.
     * @param prompt       - Optional positive prompt.
     * @param negativePrompt - Optional negative prompt.
     * @param responseType - `'json'` for envelope or `'png'` for binary image output.
     */
    const sketchImage = (
        file: File,
        prompt?: string,
        negativePrompt?: string,
        responseType: UploadImageProcessorResponseType = 'json'
    ) => {
        return fetchAny(
            () =>
                uploadApi
                    .uploadImageSketch(
                        { file, prompt, negativePrompt },
                        responseType === 'png'
                            ? { headers: { Accept: 'image/png' }, responseType: 'blob' }
                            : undefined
                    )
                    .then(({ data }) => {
                        imageSketchResult.value = data;
                    }),
            {
                loadingKey: '-imageSketch'
            }
        ).catch((error: unknown) => {
            handleApiError(error, 'Image sketch failed');
            imageSketchResult.value = undefined;
        });
    };

    /**
     * Uploads an image for colorization.
     *
     * @param file         - The source image.
     * @param prompt       - Optional positive prompt.
     * @param negativePrompt - Optional negative prompt.
     * @param responseType - `'json'` for envelope or `'png'` for binary image output.
     */
    const colorizeImage = (
        file: File,
        prompt?: string,
        negativePrompt?: string,
        responseType: UploadImageProcessorResponseType = 'json'
    ) => {
        return fetchAny(
            () =>
                uploadApi
                    .uploadImageColorize(
                        { file, prompt, negativePrompt },
                        responseType === 'png'
                            ? { headers: { Accept: 'image/png' }, responseType: 'blob' }
                            : undefined
                    )
                    .then(({ data }) => {
                        imageColorizeResult.value = data;
                    }),
            {
                loadingKey: '-imageColorize'
            }
        ).catch((error: unknown) => {
            handleApiError(error, 'Image colorize failed');
            imageColorizeResult.value = undefined;
        });
    };

    /**
     * Uploads an audio file for speech-to-text transcription.
     *
     * @param file     - The audio file to transcribe.
     * @param model    - Optional model override.
     * @param language - Optional language hint for the transcription engine.
     * @param prompt   - Optional prompt to guide transcription.
     */
    const transcribeAudio = (file: File, model?: string, language?: string, prompt?: string) => {
        return fetchAny(
            () =>
                uploadApi
                    .uploadSpeechToText({
                        file,
                        model,
                        language,
                        prompt
                    })
                    .then(({ data }) => {
                        speechToTextResult.value = data;
                    }),
            {
                loadingKey: '-speechToText'
            }
        ).catch((error: unknown) => {
            handleApiError(error, 'Speech transcription failed');
            speechToTextResult.value = undefined;
        });
    };

    /**
     * Uploads a PDF file for text extraction.
     *
     * @param file - The PDF file to read.
     */
    const readPdf = (file: File) => {
        return fetchAny(
            () =>
                uploadApi.uploadReadPdf({ file }).then(({ data }) => {
                    readPdfResult.value = data;
                }),
            {
                loadingKey: '-readPdf'
            }
        ).catch((error: unknown) => {
            handleApiError(error, 'PDF extraction failed');
            readPdfResult.value = undefined;
        });
    };

    return {
        imageClassifyResult,
        imageSketchResult,
        imageColorizeResult,
        speechToTextResult,
        readPdfResult,
        loading,
        classifyImage,
        sketchImage,
        colorizeImage,
        transcribeAudio,
        readPdf
    };
});
