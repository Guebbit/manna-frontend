import { describe, expect, it } from 'vitest';
import { agentEventColor, agentEventSummary } from '@/utils/eventFormatting';
import type { AgentStreamEvent } from '@/api/sseEvents';

describe('eventFormatting hard_stop support', () => {
    it('formats agent hard_stop events', () => {
        const event: AgentStreamEvent = {
            type: 'hard_stop',
            data: { step: 2, code: 'E_PERMISSION_DENIED', reason: 'Write access disabled' }
        };

        expect(agentEventColor(event.type)).toBe('error');
        expect(agentEventSummary(event)).toBe(
            'Hard stop (E_PERMISSION_DENIED): Write access disabled'
        );
    });
});
