import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useLibraryStore } from '@/stores/library';

const mocks = vi.hoisted(() => ({
    listLibraries: vi.fn(),
    importLibrary: vi.fn(),
    searchLibrary: vi.fn(),
    exportLibrary: vi.fn()
}));

vi.mock('@/utils/api', () => ({
    libraryApi: {
        listLibraries: mocks.listLibraries,
        importLibrary: mocks.importLibrary,
        searchLibrary: mocks.searchLibrary,
        exportLibrary: mocks.exportLibrary
    }
}));

describe('useLibraryStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
        mocks.listLibraries.mockResolvedValue({
            data: {
                success: true,
                status: 200,
                message: 'ok',
                data: [{ id: 'default', name: 'Default', articleCount: 10 }]
            }
        });
        mocks.importLibrary.mockResolvedValue({
            data: {
                success: true,
                status: 200,
                message: 'imported',
                data: { imported: 2, skipped: 0, errors: [] }
            }
        });
        mocks.searchLibrary.mockResolvedValue({
            data: {
                success: true,
                status: 200,
                message: 'done',
                data: [{ id: 'a1', title: 'Article 1', score: 0.9 }]
            }
        });
        mocks.exportLibrary.mockResolvedValue({
            data: {
                success: true,
                status: 200,
                message: 'done',
                data: [{ id: 'a1', title: 'Article 1' }]
            }
        });
    });

    it('loads libraries and selects the first one', async () => {
        const store = useLibraryStore();
        await store.listLibraries();
        expect(store.libraries).toHaveLength(1);
        expect(store.selectedLibraryId).toBe('default');
    });

    it('stores import, search, and export responses', async () => {
        const store = useLibraryStore();
        await store.importIntoLibrary('default', { folder: '/docs' });
        await store.searchInLibrary('default', { query: 'test' });
        await store.exportFromLibrary('default');

        expect(store.importResponse?.data?.imported).toBe(2);
        expect(store.searchResponse?.data?.[0]?.title).toBe('Article 1');
        expect(store.exportResponse?.data?.[0]?.id).toBe('a1');
    });
});
