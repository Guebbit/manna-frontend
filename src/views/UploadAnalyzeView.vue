<template>
    <div>
        <h1 class="text-h4 mb-2">Upload &amp; Analyze</h1>
        <p class="text-body-2 text-grey mb-6">
            Upload files for AI-powered analysis: classify images with a vision model,
            transcribe audio with Whisper, or extract text from PDFs (fast and deterministic).
        </p>

        <v-tabs v-model="activeTab" color="primary">
            <v-tab value="image">Image Classify</v-tab>
            <v-tab value="speech">Speech to Text</v-tab>
            <v-tab value="pdf">Read PDF</v-tab>
        </v-tabs>

        <v-tabs-window v-model="activeTab" class="mt-4">
            <!-- Image Classify Tab -->
            <v-tabs-window-item value="image">
                <v-card>
                    <v-card-text>
                        <FileDropZone
                            accept="image/*"
                            label="Drop an image here or click to browse"
                            hint="PNG, JPG, WEBP, GIF — max 50 MB"
                            @file="onImageFile"
                        />
                        <div v-if="imageFile" class="mt-3">
                            <v-img
                                :src="imagePreview"
                                max-height="200"
                                max-width="300"
                                class="rounded mb-2"
                            />
                            <p class="text-caption">
                                {{ imageFile.name }} ({{ formatFileSize(imageFile.size) }})
                            </p>
                        </div>
                        <v-text-field
                            v-model="imagePrompt"
                            label="Custom prompt (optional)"
                            variant="outlined"
                            density="compact"
                            class="mt-3"
                            hint="Override the default prompt. E.g. 'Describe all text visible in this image' or 'Is this a cat or a dog?'."
                            persistent-hint
                        />
                        <v-text-field
                            v-model="imageModel"
                            label="Model override (optional)"
                            variant="outlined"
                            density="compact"
                            hint="Leave empty to use the default vision model. Specify an Ollama multimodal model name to override (e.g. llava:13b)."
                            persistent-hint
                        />
                    </v-card-text>
                    <v-card-actions>
                        <v-btn
                            color="primary"
                            :loading="uploadStore.loading.imageClassify"
                            :disabled="!imageFile"
                            @click="submitImage"
                        >
                            <v-icon start>mdi-image-search</v-icon>
                            Classify
                        </v-btn>
                    </v-card-actions>
                </v-card>

                <v-card v-if="uploadStore.imageClassifyResult" class="mt-4">
                    <v-card-title class="d-flex align-center">
                        Result
                        <v-spacer />
                        <CopyButton :text="uploadStore.imageClassifyResult.response" />
                        <v-chip size="small" class="ml-2">
                            {{ uploadStore.imageClassifyResult.model }}
                        </v-chip>
                    </v-card-title>
                    <v-card-text>
                        <MarkdownRenderer :content="uploadStore.imageClassifyResult.response" />
                    </v-card-text>
                </v-card>
            </v-tabs-window-item>

            <!-- Speech to Text Tab -->
            <v-tabs-window-item value="speech">
                <v-card>
                    <v-card-text>
                        <FileDropZone
                            accept="audio/*"
                            label="Drop an audio file here or click to browse"
                            hint="WAV, MP3, OGG, etc. — max 50 MB"
                            @file="onAudioFile"
                        />
                        <div v-if="audioFile" class="mt-3">
                            <audio controls :src="audioPreview" class="mb-2" />
                            <p class="text-caption">
                                {{ audioFile.name }} ({{ formatFileSize(audioFile.size) }})
                            </p>
                        </div>
                        <v-row class="mt-2">
                            <v-col cols="12" sm="4">
                                <v-text-field
                                    v-model="sttLanguage"
                                    label="Language hint (e.g. en, it)"
                                    variant="outlined"
                                    density="compact"
                                    hint="ISO 639-1 code (e.g. 'en', 'it', 'de'). Helps Whisper produce more accurate transcriptions."
                                    persistent-hint
                                />
                            </v-col>
                            <v-col cols="12" sm="4">
                                <v-text-field
                                    v-model="sttModel"
                                    label="Model override"
                                    variant="outlined"
                                    density="compact"
                                />
                            </v-col>
                            <v-col cols="12" sm="4">
                                <v-text-field
                                    v-model="sttPrompt"
                                    label="Context prompt"
                                    variant="outlined"
                                    density="compact"
                                    hint="Provide domain-specific vocabulary or context to improve accuracy (e.g. technical terms, proper nouns)."
                                    persistent-hint
                                />
                            </v-col>
                        </v-row>
                    </v-card-text>
                    <v-card-actions>
                        <v-btn
                            color="primary"
                            :loading="uploadStore.loading.speechToText"
                            :disabled="!audioFile"
                            @click="submitAudio"
                        >
                            <v-icon start>mdi-microphone</v-icon>
                            Transcribe
                        </v-btn>
                    </v-card-actions>
                </v-card>

                <v-card v-if="uploadStore.speechToTextResult" class="mt-4">
                    <v-card-title class="d-flex align-center">
                        Transcription
                        <v-spacer />
                        <CopyButton :text="uploadStore.speechToTextResult.text" />
                    </v-card-title>
                    <v-card-text>
                        <pre class="result-pre">{{ uploadStore.speechToTextResult.text }}</pre>
                    </v-card-text>
                </v-card>
            </v-tabs-window-item>

            <!-- Read PDF Tab -->
            <v-tabs-window-item value="pdf">
                <v-card>
                    <v-card-text>
                        <FileDropZone
                            accept="application/pdf"
                            label="Drop a PDF file here or click to browse"
                            hint="PDF files — max 50 MB. Text is extracted without AI — fast and deterministic."
                            @file="onPdfFile"
                        />
                        <div v-if="pdfFile" class="mt-3">
                            <v-icon class="mr-1">mdi-file-pdf-box</v-icon>
                            <span>{{ pdfFile.name }} ({{ formatFileSize(pdfFile.size) }})</span>
                        </div>
                    </v-card-text>
                    <v-card-actions>
                        <v-btn
                            color="primary"
                            :loading="uploadStore.loading.readPdf"
                            :disabled="!pdfFile"
                            @click="submitPdf"
                        >
                            <v-icon start>mdi-file-document-outline</v-icon>
                            Extract Text
                        </v-btn>
                    </v-card-actions>
                </v-card>

                <v-card v-if="uploadStore.readPdfResult" class="mt-4">
                    <v-card-title class="d-flex align-center">
                        PDF Content
                        <v-chip size="small" class="ml-2" color="primary">
                            {{ uploadStore.readPdfResult.pageCount }} page{{
                                uploadStore.readPdfResult.pageCount === 1 ? '' : 's'
                            }}
                        </v-chip>
                        <v-spacer />
                        <CopyButton :text="uploadStore.readPdfResult.text" />
                    </v-card-title>
                    <v-card-text>
                        <pre class="result-pre" style="max-height: 500px; overflow-y: auto">{{
                            uploadStore.readPdfResult.text
                        }}</pre>
                    </v-card-text>
                </v-card>
            </v-tabs-window-item>
        </v-tabs-window>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useUploadStore } from '@/stores/upload';
import FileDropZone from '@/components/shared/FileDropZone.vue';
import CopyButton from '@/components/shared/CopyButton.vue';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer.vue';
import { formatFileSize } from '@/utils/formatting';

const uploadStore = useUploadStore();
const activeTab = ref('image');

// Image
const imageFile = ref<File | undefined>(undefined);
const imagePreview = ref('');
const imagePrompt = ref('');
const imageModel = ref('');

// Audio
const audioFile = ref<File | undefined>(undefined);
const audioPreview = ref('');
const sttLanguage = ref('');
const sttModel = ref('');
const sttPrompt = ref('');

// PDF
const pdfFile = ref<File | undefined>(undefined);

function onImageFile(file: File): void {
    imageFile.value = file;
    imagePreview.value = URL.createObjectURL(file);
}

function onAudioFile(file: File): void {
    audioFile.value = file;
    audioPreview.value = URL.createObjectURL(file);
}

function onPdfFile(file: File): void {
    pdfFile.value = file;
}

function submitImage(): void {
    if (!imageFile.value) return;
    void uploadStore.classifyImage(
        imageFile.value,
        imagePrompt.value || undefined,
        imageModel.value || undefined
    );
}

function submitAudio(): void {
    if (!audioFile.value) return;
    void uploadStore.transcribeAudio(
        audioFile.value,
        sttModel.value || undefined,
        sttLanguage.value || undefined,
        sttPrompt.value || undefined
    );
}

function submitPdf(): void {
    if (!pdfFile.value) return;
    void uploadStore.readPdf(pdfFile.value);
}
</script>

<style scoped>
.result-pre {
    background: #1e1e1e;
    border-radius: 8px;
    padding: 16px;
    overflow-x: auto;
    font-family: 'Fira Code', 'Cascadia Code', monospace;
    font-size: 0.875rem;
    white-space: pre-wrap;
}
</style>
