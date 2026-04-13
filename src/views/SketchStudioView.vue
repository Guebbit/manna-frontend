<template>
    <div>
        <h1 class="text-h4 mb-6">Sketch Studio</h1>

        <v-alert v-if="sketchStore.comingSoon" type="info" variant="tonal" class="mb-4">
            <v-icon start>mdi-information</v-icon>
            Sketch endpoints are not available yet — merge PR #19 to enable them.
        </v-alert>

        <v-tabs v-model="activeTab" color="primary">
            <v-tab value="ink">Ink Only</v-tab>
            <v-tab value="inkAndColor">Ink &amp; Color</v-tab>
        </v-tabs>

        <v-tabs-window v-model="activeTab" class="mt-4">
            <!-- Ink Only Tab -->
            <v-tabs-window-item value="ink">
                <v-card>
                    <v-card-text>
                        <FileDropZone
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            label="Drop a sketch image here"
                            hint="PNG, JPG, WEBP, GIF — max 10 MB"
                            @file="onInkFile"
                        />
                        <div v-if="inkFile" class="mt-3">
                            <v-img
                                :src="inkPreview"
                                max-height="200"
                                max-width="300"
                                class="rounded mb-2"
                            />
                            <p class="text-caption">{{ inkFile.name }}</p>
                        </div>
                        <v-text-field
                            v-model="inkModel"
                            label="Model override (optional)"
                            variant="outlined"
                            density="compact"
                            class="mt-3"
                        />
                    </v-card-text>
                    <v-card-actions>
                        <v-btn
                            color="primary"
                            :loading="sketchStore.loading.ink"
                            :disabled="!inkFile"
                            @click="submitInk"
                        >
                            <v-icon start>mdi-draw</v-icon>
                            Process Ink
                        </v-btn>
                    </v-card-actions>
                </v-card>

                <v-card v-if="sketchStore.inkResult" class="mt-4">
                    <v-card-title class="d-flex align-center">
                        Inking Description
                        <v-spacer />
                        <CopyButton :text="sketchStore.inkResult.inkingDescription" />
                    </v-card-title>
                    <v-card-text>
                        <MarkdownRenderer :content="sketchStore.inkResult.inkingDescription" />
                    </v-card-text>
                </v-card>
            </v-tabs-window-item>

            <!-- Ink & Color Tab -->
            <v-tabs-window-item value="inkAndColor">
                <v-card>
                    <v-card-text>
                        <FileDropZone
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            label="Drop a sketch image here"
                            hint="PNG, JPG, WEBP, GIF — max 10 MB"
                            @file="onColorFile"
                        />
                        <div v-if="colorFile" class="mt-3">
                            <v-img
                                :src="colorPreview"
                                max-height="200"
                                max-width="300"
                                class="rounded mb-2"
                            />
                            <p class="text-caption">{{ colorFile.name }}</p>
                        </div>
                        <v-row class="mt-2">
                            <v-col cols="12" sm="6">
                                <v-radio-group v-model="sketchState" label="Sketch state" inline>
                                    <v-radio label="Auto-detect" value="auto" />
                                    <v-radio label="It's a sketch" value="sketch" />
                                    <v-radio label="Already inked" value="inked" />
                                </v-radio-group>
                            </v-col>
                            <v-col cols="12" sm="6">
                                <v-text-field
                                    v-model="colorModel"
                                    label="Model override (optional)"
                                    variant="outlined"
                                    density="compact"
                                />
                            </v-col>
                        </v-row>
                    </v-card-text>
                    <v-card-actions>
                        <v-btn
                            color="primary"
                            :loading="sketchStore.loading.inkAndColor"
                            :disabled="!colorFile"
                            @click="submitColor"
                        >
                            <v-icon start>mdi-palette</v-icon>
                            Process Ink &amp; Color
                        </v-btn>
                    </v-card-actions>
                </v-card>

                <v-card v-if="sketchStore.inkAndColorResult" class="mt-4">
                    <v-card-title class="d-flex align-center">
                        Colorization Description
                        <v-chip size="small" class="ml-2">
                            State: {{ sketchStore.inkAndColorResult.detectedState }}
                        </v-chip>
                        <v-spacer />
                        <CopyButton :text="sketchStore.inkAndColorResult.colorizationDescription" />
                    </v-card-title>
                    <v-card-text>
                        <MarkdownRenderer
                            :content="sketchStore.inkAndColorResult.colorizationDescription"
                        />
                    </v-card-text>
                </v-card>
            </v-tabs-window-item>
        </v-tabs-window>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useSketchStore } from '@/stores/sketch';
import type { SketchState } from '@/api/types';
import FileDropZone from '@/components/shared/FileDropZone.vue';
import CopyButton from '@/components/shared/CopyButton.vue';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer.vue';

const sketchStore = useSketchStore();
const activeTab = ref('ink');

// Ink
const inkFile = ref<File | undefined>(undefined);
const inkPreview = ref('');
const inkModel = ref('');

// Color
const colorFile = ref<File | undefined>(undefined);
const colorPreview = ref('');
const colorModel = ref('');
const sketchState = ref<SketchState | 'auto'>('auto');

function onInkFile(file: File): void {
    inkFile.value = file;
    inkPreview.value = URL.createObjectURL(file);
}

function onColorFile(file: File): void {
    colorFile.value = file;
    colorPreview.value = URL.createObjectURL(file);
}

function submitInk(): void {
    if (!inkFile.value) return;
    void sketchStore.submitInk(inkFile.value, inkModel.value || undefined);
}

function submitColor(): void {
    if (!colorFile.value) return;
    const state = sketchState.value === 'auto' ? undefined : sketchState.value;
    void sketchStore.submitInkAndColor(colorFile.value, colorModel.value || undefined, state);
}
</script>
