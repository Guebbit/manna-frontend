<template>
    <div>
        <h1 class="text-h4 mb-2">{{ t('library.title') }}</h1>
        <p class="text-body-2 text-grey mb-6">{{ t('library.subtitle') }}</p>

        <v-row>
            <v-col cols="12" md="4">
                <v-card>
                    <v-card-title class="d-flex align-center">
                        {{ t('library.libraries') }}
                        <v-chip class="ml-2" size="small" color="primary">
                            {{ libraryStore.libraries.length }}
                        </v-chip>
                        <v-spacer />
                        <v-btn
                            icon
                            size="small"
                            variant="text"
                            :loading="libraryStore.loading.list"
                            @click="libraryStore.listLibraries()"
                        >
                            <v-icon>mdi-refresh</v-icon>
                        </v-btn>
                    </v-card-title>
                    <v-card-text>
                        <v-alert
                            v-if="libraryStore.error"
                            type="error"
                            variant="tonal"
                            density="compact"
                            class="mb-3"
                        >
                            {{ libraryStore.error }}
                        </v-alert>

                        <v-list v-if="libraryStore.libraries.length > 0" density="compact">
                            <v-list-item
                                v-for="entry in libraryStore.libraries"
                                :key="entry.id"
                                :active="entry.id === libraryStore.selectedLibraryId"
                                @click="libraryStore.selectedLibraryId = entry.id ?? ''"
                            >
                                <v-list-item-title>{{ entry.name ?? entry.id }}</v-list-item-title>
                                <v-list-item-subtitle>
                                    {{
                                        t('library.articleCount', {
                                            n: entry.articleCount ?? 0
                                        })
                                    }}
                                </v-list-item-subtitle>
                            </v-list-item>
                        </v-list>
                        <p v-else class="text-caption text-grey">{{ t('library.noLibraries') }}</p>
                    </v-card-text>
                </v-card>
            </v-col>

            <v-col cols="12" md="8">
                <v-card>
                    <v-card-title>{{ t('library.importTitle') }}</v-card-title>
                    <v-card-text>
                        <v-btn-toggle
                            v-model="importMode"
                            mandatory
                            variant="outlined"
                            class="mb-4"
                        >
                            <v-btn value="folder">{{ t('library.importModeFolder') }}</v-btn>
                            <v-btn value="pdfs">{{ t('library.importModePdfs') }}</v-btn>
                        </v-btn-toggle>

                        <div v-if="importMode === 'folder'">
                            <v-text-field
                                v-model="folderPath"
                                :label="t('library.folderPath')"
                                variant="outlined"
                                density="compact"
                            />
                        </div>

                        <div v-else>
                            <div
                                v-for="(pdf, index) in pdfEntries"
                                :key="index"
                                class="d-flex ga-2 align-center mb-2"
                            >
                                <v-text-field
                                    v-model="pdf.path"
                                    :label="t('library.pdfPath')"
                                    variant="outlined"
                                    density="compact"
                                    hide-details
                                />
                                <v-text-field
                                    v-model.number="pdf.year"
                                    :label="t('library.year')"
                                    type="number"
                                    variant="outlined"
                                    density="compact"
                                    hide-details
                                    style="max-width: 130px"
                                />
                                <v-text-field
                                    v-model="pdf.month"
                                    :label="t('library.month')"
                                    variant="outlined"
                                    density="compact"
                                    hide-details
                                    style="max-width: 150px"
                                />
                                <v-btn icon variant="text" color="error" @click="removePdf(index)">
                                    <v-icon>mdi-delete</v-icon>
                                </v-btn>
                            </div>
                            <v-btn variant="text" prepend-icon="mdi-plus" @click="addPdf">
                                {{ t('library.addPdf') }}
                            </v-btn>
                        </div>
                    </v-card-text>
                    <v-card-actions>
                        <v-btn
                            color="primary"
                            :disabled="!canImport"
                            :loading="libraryStore.loading.import"
                            @click="submitImport"
                        >
                            <v-icon start>mdi-database-import</v-icon>
                            {{ t('library.importAction') }}
                        </v-btn>
                    </v-card-actions>
                </v-card>

                <v-card class="mt-4">
                    <v-card-title>{{ t('library.searchTitle') }}</v-card-title>
                    <v-card-text>
                        <v-text-field
                            v-model="searchQuery"
                            :label="t('library.searchQuery')"
                            variant="outlined"
                            density="compact"
                        />
                        <v-row>
                            <v-col cols="12" sm="4">
                                <v-text-field
                                    v-model.number="searchTopK"
                                    :label="t('library.topK')"
                                    type="number"
                                    variant="outlined"
                                    density="compact"
                                />
                            </v-col>
                            <v-col cols="12" sm="4">
                                <v-text-field
                                    v-model.number="searchYear"
                                    :label="t('library.year')"
                                    type="number"
                                    variant="outlined"
                                    density="compact"
                                />
                            </v-col>
                            <v-col cols="12" sm="4">
                                <v-text-field
                                    v-model="searchMonth"
                                    :label="t('library.month')"
                                    variant="outlined"
                                    density="compact"
                                />
                            </v-col>
                        </v-row>
                    </v-card-text>
                    <v-card-actions>
                        <v-btn
                            color="primary"
                            :disabled="!canSearch"
                            :loading="libraryStore.loading.search"
                            @click="submitSearch"
                        >
                            <v-icon start>mdi-magnify</v-icon>
                            {{ t('library.searchAction') }}
                        </v-btn>
                        <v-spacer />
                        <v-btn
                            color="secondary"
                            :disabled="!libraryStore.selectedLibraryId"
                            :loading="libraryStore.loading.export"
                            @click="submitExport"
                        >
                            <v-icon start>mdi-export</v-icon>
                            {{ t('library.exportAction') }}
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>
        </v-row>

        <v-card v-if="libraryStore.importResponse" class="mt-4">
            <v-card-title>{{ t('library.importResult') }}</v-card-title>
            <v-card-text>
                <p>{{ libraryStore.importResponse.message }}</p>
                <p class="text-caption">
                    {{
                        t('library.imported', {
                            n: libraryStore.importResponse.data?.imported ?? 0
                        })
                    }}
                    ·
                    {{
                        t('library.skipped', { n: libraryStore.importResponse.data?.skipped ?? 0 })
                    }}
                </p>
                <v-list
                    v-if="(libraryStore.importResponse.data?.errors?.length ?? 0) > 0"
                    density="compact"
                >
                    <v-list-item
                        v-for="entry in libraryStore.importResponse.data?.errors ?? []"
                        :key="entry"
                        :title="entry"
                    />
                </v-list>
            </v-card-text>
        </v-card>

        <v-card v-if="libraryStore.searchResponse" class="mt-4">
            <v-card-title>
                {{
                    t('library.searchResult', {
                        n: libraryStore.searchResponse.data?.length ?? 0
                    })
                }}
            </v-card-title>
            <v-card-text>
                <v-table density="compact">
                    <thead>
                        <tr>
                            <th>{{ t('library.score') }}</th>
                            <th>{{ t('library.titleCol') }}</th>
                            <th>{{ t('library.source') }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="article in libraryStore.searchResponse.data ?? []"
                            :key="article.id"
                        >
                            <td>{{ article.score?.toFixed(3) ?? '—' }}</td>
                            <td>
                                <div class="text-body-2">{{ article.title }}</div>
                                <div class="text-caption text-grey">{{ article.summary }}</div>
                            </td>
                            <td class="text-caption">
                                {{ article.year ?? '—' }} {{ article.month ?? '' }}
                                <br />
                                {{ article.pdfPath ?? '—' }}
                            </td>
                        </tr>
                    </tbody>
                </v-table>
            </v-card-text>
        </v-card>

        <v-card v-if="libraryStore.exportResponse" class="mt-4">
            <v-card-title>
                {{
                    t('library.exportResult', {
                        n: libraryStore.exportResponse.data?.length ?? 0
                    })
                }}
            </v-card-title>
            <v-card-text>
                <p class="text-caption mb-2">
                    {{
                        t('library.exportTimestamp', {
                            value: formatDate(new Date().toISOString())
                        })
                    }}
                </p>
                <pre class="result-pre">{{ formattedExport }}</pre>
            </v-card-text>
        </v-card>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ImportRequest, PdfEntry, SearchRequest } from '@api';
import { useLibraryStore } from '@/stores/library';

const { t } = useI18n();
const libraryStore = useLibraryStore();

const importMode = ref<'folder' | 'pdfs'>('folder');
const folderPath = ref('');
const pdfEntries = ref<PdfEntry[]>([{ path: '' }]);

const searchQuery = ref('');
const searchTopK = ref<number | undefined>(5);
const searchYear = ref<number | undefined>(undefined);
const searchMonth = ref('');

const canImport = computed(() => {
    if (!libraryStore.selectedLibraryId) return false;
    if (importMode.value === 'folder') return folderPath.value.trim().length > 0;
    return pdfEntries.value.some((entry) => entry.path.trim().length > 0);
});

const canSearch = computed(
    () => libraryStore.selectedLibraryId.length > 0 && searchQuery.value.trim().length > 0
);

const formattedExport = computed(() =>
    JSON.stringify(libraryStore.exportResponse?.data ?? [], undefined, 2)
);

function addPdf(): void {
    pdfEntries.value.push({ path: '' });
}

function removePdf(index: number): void {
    pdfEntries.value.splice(index, 1);
    if (pdfEntries.value.length === 0) {
        pdfEntries.value.push({ path: '' });
    }
}

function submitImport(): void {
    if (!libraryStore.selectedLibraryId) return;

    const request: ImportRequest =
        importMode.value === 'folder'
            ? { folder: folderPath.value.trim() }
            : {
                  pdfs: pdfEntries.value
                      .filter((entry) => entry.path.trim().length > 0)
                      .map((entry) => ({
                          path: entry.path.trim(),
                          year: entry.year,
                          month: entry.month?.trim() ? entry.month.trim() : undefined
                      }))
              };

    void libraryStore.importIntoLibrary(libraryStore.selectedLibraryId, request).then(() => {
        void libraryStore.listLibraries();
    });
}

function submitSearch(): void {
    if (!libraryStore.selectedLibraryId || !searchQuery.value.trim()) return;

    const request: SearchRequest = {
        query: searchQuery.value.trim(),
        topK: searchTopK.value,
        filters:
            searchYear.value || searchMonth.value.trim()
                ? {
                      year: searchYear.value,
                      month: searchMonth.value.trim() || undefined
                  }
                : undefined
    };

    void libraryStore.searchInLibrary(libraryStore.selectedLibraryId, request);
}

function submitExport(): void {
    if (!libraryStore.selectedLibraryId) return;
    void libraryStore.exportFromLibrary(libraryStore.selectedLibraryId);
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleString();
}

onMounted(() => {
    void libraryStore.listLibraries();
});
</script>

<style scoped>
.result-pre {
    background: #1e1e1e;
    border-radius: 8px;
    padding: 16px;
    overflow-x: auto;
    font-family: 'Fira Code', 'Cascadia Code', monospace;
    font-size: 0.8rem;
    white-space: pre-wrap;
    max-height: 400px;
}
</style>
