import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAgentStore } from '@/stores/agent';

describe('useAgentStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('starts with empty task history', () => {
        const store = useAgentStore();
        expect(store.taskHistory).toEqual([]);
        expect(store.loading).toBe(false);
    });

    it('handles submit failure gracefully', async () => {
        const store = useAgentStore();
        // Will fail - no server running
        const result = await store.submitTask('test task');
        expect(result).toBeUndefined();
        expect(store.loading).toBe(false);
    });
});
