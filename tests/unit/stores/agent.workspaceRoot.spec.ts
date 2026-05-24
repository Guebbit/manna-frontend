import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAgentStore } from '@/stores/agent';
import type { AgentStreamEvent } from '@/api/sseEvents';

const { runTaskStreamMock } = vi.hoisted(() => ({
    runTaskStreamMock: vi.fn<() => AsyncGenerator<AgentStreamEvent>>()
}));

vi.mock('@/utils/sse', () => ({
    runTaskStream: runTaskStreamMock
}));

describe('useAgentStore — workspaceRoot support', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        runTaskStreamMock.mockReset();
    });

    it('passes workspaceRoot through to history entry on done', async () => {
        runTaskStreamMock.mockImplementation(async function* () {
            yield {
                type: 'done',
                data: { result: 'analysis complete' }
            } as AgentStreamEvent;
        });

        const store = useAgentStore();
        const result = await store.submitTaskStream(
            'describe the codebase',
            'code',
            false,
            '/workspace/my-project'
        );

        expect(result).toBeDefined();
        expect(result?.workspaceRoot).toBe('/workspace/my-project');
        expect(result?.result).toBe('analysis complete');
    });

    it('does not set workspaceRoot when omitted', async () => {
        runTaskStreamMock.mockImplementation(async function* () {
            yield {
                type: 'done',
                data: { result: 'done' }
            } as AgentStreamEvent;
        });

        const store = useAgentStore();
        const result = await store.submitTaskStream('simple task');

        expect(result).toBeDefined();
        expect(result?.workspaceRoot).toBeUndefined();
    });

    it('passes workspaceRoot to runTaskStream parameters', async () => {
        runTaskStreamMock.mockImplementation(async function* () {
            yield {
                type: 'done',
                data: { result: 'ok' }
            } as AgentStreamEvent;
        });

        const store = useAgentStore();
        await store.submitTaskStream('task', 'code', false, '/workspace/proj');

        expect(runTaskStreamMock).toHaveBeenCalledWith(
            expect.objectContaining({ workspaceRoot: '/workspace/proj' })
        );
    });
});
