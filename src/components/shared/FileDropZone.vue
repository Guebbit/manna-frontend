<template>
    <div
        class="file-drop-zone"
        :class="{ 'file-drop-zone--active': isDragging }"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="onDrop"
        @click="openFilePicker"
    >
        <input ref="fileInput" type="file" :accept="accept" hidden @change="onFileSelect" />
        <v-icon size="48" color="grey">mdi-cloud-upload-outline</v-icon>
        <p class="mt-2 text-body-1 text-grey">
            {{ label || 'Drop a file here or click to browse' }}
        </p>
        <p v-if="hint" class="text-caption text-grey-darken-1">{{ hint }}</p>
    </div>
</template>

<script setup lang="ts">
/**
 * FileDropZone — a drag-and-drop + click-to-browse file picker.
 *
 * Emits a single `file` event with the selected `File` object.  Supports both
 * drag-and-drop and the native file picker (click to open).  The `accept` prop
 * is forwarded directly to the hidden `<input type="file">`.
 *
 * @prop accept - MIME type or extension filter for the file picker (e.g. `'image/*'`).
 * @prop label  - Primary label text shown in the drop zone.
 * @prop hint   - Secondary hint text shown below the label.
 *
 * @emits file - Emitted with the chosen `File` when the user selects or drops a file.
 */
import { ref } from 'vue';

defineProps<{
    accept?: string;
    label?: string;
    hint?: string;
}>();

const emit = defineEmits<{
    file: [file: File];
}>();

const isDragging = ref(false);
const fileInput = ref<HTMLInputElement | undefined>(undefined);

function openFilePicker(): void {
    fileInput.value?.click();
}

function onDrop(event: DragEvent): void {
    isDragging.value = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
        emit('file', files[0]);
    }
}

function onFileSelect(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (files && files.length > 0) {
        emit('file', files[0]);
    }
    // Reset so the same file can be re-selected
    target.value = '';
}
</script>

<style scoped>
.file-drop-zone {
    border: 2px dashed rgba(var(--v-theme-on-surface), 0.25);
    border-radius: 12px;
    padding: 32px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
}

.file-drop-zone:hover,
.file-drop-zone--active {
    border-color: rgb(var(--v-theme-primary));
    background: rgba(var(--v-theme-primary), 0.04);
}
</style>
