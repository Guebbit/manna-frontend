/**
 * @module stores/upload
 *
 * Pinia store for file-upload analysis operations.
 *
 * Each upload type targets a different backend tool:
 * - **Image classify** (`/upload/image-classify`) — Sends the image to a multimodal
 *   vision model (e.g. LLaVA) which describes or classifies the visual content.
 * - **Speech to text** (`/upload/speech-to-text`) — Transcribes audio using the
 *   Whisper model.  A language hint and context prompt improve accuracy.
 * - **Read PDF** (`/upload/read-pdf`) — Extracts raw text from the PDF using
 *   `pdf-parse` (no AI involved — fast and deterministic).
 */
import { defineStore } from 'pinia';

/**
 * Pinia store managing file upload operations
 * (image classification, speech-to-text, and PDF reading).
 */
export const useUploadStore = defineStore('upload', () => {
    const { getLoading, setLoading } = useCoreStore();
    const { fetchAny } = useStructureRestApi({
        getLoading,
        setLoading,
        loadingKey: 'upload'
    });

    const imageClassifyResult = ref<IImageClassifyResponse | undefined>(undefined);
    const speechToTextResult = ref<ISpeechToTextResponse | undefined>(undefined);
    const readPdfResult = ref<IReadPdfResponse | undefined>(undefined);

    const loading = reactive({
        imageClassify: computed(() => getLoading('upload-imageClassify')),
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
        const notificationStore = useNotificationsStore();
        return fetchAny(
            () =>
                uploadImageClassify({ file, prompt, model }).then((data) => {
                    imageClassifyResult.value = data;
                }),
            {
                loadingKey: '-imageClassify'
            }
        ).catch((error: unknown) => {
            if (error instanceof ApiError) {
                notificationStore.addMessage(error.message, TOAST_TYPE.DANGER, 8000);
            }
            imageClassifyResult.value = undefined;
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
    const transcribeAudio = (
        file: File,
        model?: string,
        language?: string,
        prompt?: string
    ) => {
        const notificationStore = useNotificationsStore();
        return fetchAny(
            () =>
                uploadSpeechToText({
                    file,
                    model,
                    language,
                    prompt
                }).then((data) => {
                    speechToTextResult.value = data;
                }),
            {
                loadingKey: '-speechToText'
            }
        ).catch((error: unknown) => {
            if (error instanceof ApiError) {
                notificationStore.addMessage(error.message, TOAST_TYPE.DANGER, 8000);
            }
            speechToTextResult.value = undefined;
        });
    };

    /**
     * Uploads a PDF file for text extraction.
     *
     * @param file - The PDF file to read.
     */
    const readPdf = (file: File) => {
        const notificationStore = useNotificationsStore();
        return fetchAny(
            () =>
                uploadReadPdf({ file }).then((data) => {
                    readPdfResult.value = data;
                }),
            {
                loadingKey: '-readPdf'
            }
        ).catch((error: unknown) => {
            if (error instanceof ApiError) {
                notificationStore.addMessage(error.message, TOAST_TYPE.DANGER, 8000);
            }
            readPdfResult.value = undefined;
        });
    };

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
