import { defineStore } from 'pinia';
import { computed, reactive, ref } from 'vue';
import { useCoreStore, useStructureRestApi } from '@guebbit/vue-toolkit';
import type {
    ExportLibrary200Response,
    ImportLibrary200Response,
    ImportRequest,
    LibraryInfo,
    SearchLibrary200Response,
    SearchRequest
} from '@api';
import {
    exportLibrary,
    importLibrary,
    listLibraries as listLibrariesRequest,
    searchLibrary
} from '@/api/manna';
import { handleApiError } from '@/utils/errorHandling';

/**
 * Pinia store for library ingestion/search/export workflows.
 */
export const useLibraryStore = defineStore('library', () => {
    const { getLoading, setLoading } = useCoreStore();
    const { fetchAny } = useStructureRestApi({
        getLoading,
        setLoading,
        loadingKey: 'library'
    });

    const libraries = ref<LibraryInfo[]>([]);
    const selectedLibraryId = ref<string>('');
    const importResponse = ref<ImportLibrary200Response | undefined>(undefined);
    const searchResponse = ref<SearchLibrary200Response | undefined>(undefined);
    const exportResponse = ref<ExportLibrary200Response | undefined>(undefined);
    const error = ref<string | undefined>(undefined);

    const loading = reactive({
        list: computed(() => getLoading('library-list')),
        import: computed(() => getLoading('library-import')),
        search: computed(() => getLoading('library-search')),
        export: computed(() => getLoading('library-export'))
    });

    const listLibraries = () => {
        return fetchAny(
            () =>
                listLibrariesRequest().then((response) => {
                    libraries.value = response.data ?? [];
                    const current = selectedLibraryId.value;
                    if (!current || !libraries.value.some((entry) => entry.id === current)) {
                        selectedLibraryId.value = libraries.value[0]?.id ?? '';
                    }
                    error.value = undefined;
                }),
            {
                loadingKey: '-list'
            }
        ).catch((caughtError: unknown) => {
            handleApiError(caughtError, 'Failed to load libraries');
            error.value =
                caughtError instanceof Error ? caughtError.message : 'Failed to load libraries';
            libraries.value = [];
        });
    };

    const importIntoLibrary = (libraryId: string, request: ImportRequest) => {
        return fetchAny(
            () =>
                importLibrary(libraryId, request).then((response) => {
                    importResponse.value = response;
                    error.value = undefined;
                }),
            {
                loadingKey: '-import'
            }
        ).catch((caughtError: unknown) => {
            handleApiError(caughtError, 'Library import failed');
            error.value =
                caughtError instanceof Error ? caughtError.message : 'Library import failed';
            importResponse.value = undefined;
        });
    };

    const searchInLibrary = (libraryId: string, request: SearchRequest) => {
        return fetchAny(
            () =>
                searchLibrary(libraryId, request).then((response) => {
                    searchResponse.value = response;
                    error.value = undefined;
                }),
            {
                loadingKey: '-search'
            }
        ).catch((caughtError: unknown) => {
            handleApiError(caughtError, 'Library search failed');
            error.value =
                caughtError instanceof Error ? caughtError.message : 'Library search failed';
            searchResponse.value = undefined;
        });
    };

    const exportFromLibrary = (libraryId: string) => {
        return fetchAny(
            () =>
                exportLibrary(libraryId).then((response) => {
                    exportResponse.value = response;
                    error.value = undefined;
                }),
            {
                loadingKey: '-export'
            }
        ).catch((caughtError: unknown) => {
            handleApiError(caughtError, 'Library export failed');
            error.value =
                caughtError instanceof Error ? caughtError.message : 'Library export failed';
            exportResponse.value = undefined;
        });
    };

    return {
        libraries,
        selectedLibraryId,
        importResponse,
        searchResponse,
        exportResponse,
        error,
        loading,
        listLibraries,
        importIntoLibrary,
        searchInLibrary,
        exportFromLibrary
    };
});
