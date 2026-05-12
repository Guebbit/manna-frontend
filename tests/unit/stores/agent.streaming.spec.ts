import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAgentStore } from '@/stores/agent';
import type { AgentStreamEvent } from '@/api/sseEvents';

const { runTaskStreamMock } = vi.hoisted(() => ({
    runTaskStreamMock: vi.fn<() => AsyncGenerator<AgentStreamEvent>>()
}));

vi.mock('@/api/manna', async () => {
    const actual = await vi.importActual<typeof import('@/api/manna')>('@/api/manna');
    return {
        ...actual,
        runTaskStream: runTaskStreamMock
    };
});

describe('useAgentStore streaming', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        runTaskStreamMock.mockReset();
    });

    it('stops stream processing on hard_stop events', async () => {
        runTaskStreamMock.mockImplementation(async function* () {
            yield {
                type: 'hard_stop',
                data: { step: 0, code: 'E_PATH_OUTSIDE_ROOT', reason: 'Path is outside root' }
            };
        });

        const store = useAgentStore();
        const result = await store.submitTaskStream('test task');

        expect(result).toBeUndefined();
        expect(store.streaming).toBe(false);
        expect(store.taskHistory).toEqual([]);
        expect(store.streamEvents).toHaveLength(1);
        expect(store.streamEvents[0]).toMatchObject({
            type: 'hard_stop',
            data: { code: 'E_PATH_OUTSIDE_ROOT' }
        });
    });
});
