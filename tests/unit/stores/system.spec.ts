import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSystemStore } from '@/stores/system';

describe('useSystemStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('starts with undefined health', () => {
        const store = useSystemStore();
        expect(store.health).toBeUndefined();
    });

    it('starts with empty models', () => {
        const store = useSystemStore();
        expect(store.models).toEqual([]);
    });

    it('has loading flags initially false', () => {
        const store = useSystemStore();
        expect(store.healthLoading).toBe(false);
        expect(store.modelsLoading).toBe(false);
    });

    it('sets healthError on failed fetch', async () => {
        const store = useSystemStore();
        // This will fail because no server is running
        await store.fetchHealth();
        expect(store.healthError).toBeDefined();
        expect(store.health).toBeUndefined();
    });
});
