<template>
    <div>
        <h1 class="text-h4 mb-2">{{ t('upload.title') }}</h1>
        <p class="text-body-2 text-grey mb-6">{{ t('upload.subtitle') }}</p>

        <v-tabs v-model="activeTab" color="primary">
            <v-tab value="image">{{ t('upload.tabImage') }}</v-tab>
            <v-tab value="speech">{{ t('upload.tabSpeech') }}</v-tab>
            <v-tab value="pdf">{{ t('upload.tabPdf') }}</v-tab>
        </v-tabs>

        <v-tabs-window v-model="activeTab" class="mt-4">
            <!-- Image Classify Tab -->
            <v-tabs-window-item value="image">
                <v-card>
                    <v-card-text>
                        <FileDropZone
                            accept="image/*"
                            :label="t('upload.imageDropLabel')"
                            :hint="t('upload.imageDropHint')"
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
                            :label="t('upload.customPrompt')"
                            variant="outlined"
                            density="compact"
                            class="mt-3"
                            :hint="t('upload.customPromptHint')"
                            persistent-hint
                        />
                        <v-text-field
                            v-model="imageModel"
                            :label="t('upload.imageModelOverride')"
                            variant="outlined"
                            density="compact"
                            :hint="t('upload.imageModelHint')"
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
                            {{ t('upload.classify') }}
                        </v-btn>
                    </v-card-actions>
                </v-card>

                <v-card v-if="uploadStore.imageClassifyResult" class="mt-4">
                    <v-card-title class="d-flex align-center">
                        {{ t('common.result') }}
                        <v-spacer />
                        <CopyButton :text="uploadStore.imageClassifyResult.data?.response ?? ''" />
                    </v-card-title>
                    <v-card-text>
                        <MarkdownRenderer
                            :content="uploadStore.imageClassifyResult.data?.response ?? ''"
                        />
                    </v-card-text>
                </v-card>
            </v-tabs-window-item>

            <!-- Speech to Text Tab -->
            <v-tabs-window-item value="speech">
                <v-card>
                    <v-card-text>
                        <FileDropZone
                            accept="audio/*"
                            :label="t('upload.audioDropLabel')"
                            :hint="t('upload.audioDropHint')"
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
                                    :label="t('upload.languageHint')"
                                    variant="outlined"
                                    density="compact"
                                    :hint="t('upload.languageHintDesc')"
                                    persistent-hint
                                />
                            </v-col>
                            <v-col cols="12" sm="4">
                                <v-text-field
                                    v-model="sttModel"
                                    :label="t('upload.sttModelOverride')"
                                    variant="outlined"
                                    density="compact"
                                />
                            </v-col>
                            <v-col cols="12" sm="4">
                                <v-text-field
                                    v-model="sttPrompt"
                                    :label="t('upload.contextPrompt')"
                                    variant="outlined"
                                    density="compact"
                                    :hint="t('upload.contextPromptHint')"
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
                            {{ t('upload.transcribe') }}
                        </v-btn>
                    </v-card-actions>
                </v-card>

                <v-card v-if="uploadStore.speechToTextResult" class="mt-4">
                    <v-card-title class="d-flex align-center">
                        {{ t('upload.transcription') }}
                        <v-spacer />
                        <CopyButton :text="uploadStore.speechToTextResult.data?.text ?? ''" />
                    </v-card-title>
                    <v-card-text>
                        <pre class="result-pre">{{
                            uploadStore.speechToTextResult.data?.text
                        }}</pre>
                    </v-card-text>
                </v-card>
            </v-tabs-window-item>

            <!-- Read PDF Tab -->
            <v-tabs-window-item value="pdf">
                <v-card>
                    <v-card-text>
                        <FileDropZone
                            accept="application/pdf"
                            :label="t('upload.pdfDropLabel')"
                            :hint="t('upload.pdfDropHint')"
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
                            {{ t('upload.extractText') }}
                        </v-btn>
                    </v-card-actions>
                </v-card>

                <v-card v-if="uploadStore.readPdfResult" class="mt-4">
                    <v-card-title class="d-flex align-center">
                        {{ t('upload.pdfContent') }}
                        <v-chip size="small" class="ml-2" color="primary">
                            {{
                                t(
                                    'upload.pageCount',
                                    uploadStore.readPdfResult.data?.pageCount ?? 0
                                )
                            }}
                        </v-chip>
                        <v-spacer />
                        <CopyButton :text="uploadStore.readPdfResult.data?.text ?? ''" />
                    </v-card-title>
                    <v-card-text>
                        <pre class="result-pre" style="max-height: 500px; overflow-y: auto">{{
                            uploadStore.readPdfResult.data?.text
                        }}</pre>
                    </v-card-text>
                </v-card>
            </v-tabs-window-item>
        </v-tabs-window>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUploadStore } from '@/stores/upload';
import FileDropZone from '@/components/shared/FileDropZone.vue';
import CopyButton from '@/components/shared/CopyButton.vue';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer.vue';
import { formatFileSize } from '@/utils/formatting';

const { t } = useI18n();
const uploadStore = useUploadStore();
const activeTab = ref('image');

const imageFile = ref<File | undefined>(undefined);
const imagePreview = ref('');
const imagePrompt = ref('');
const imageModel = ref('');

const audioFile = ref<File | undefined>(undefined);
const audioPreview = ref('');
const sttLanguage = ref('');
const sttModel = ref('');
const sttPrompt = ref('');

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
