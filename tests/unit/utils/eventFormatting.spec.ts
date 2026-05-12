import { describe, expect, it } from 'vitest';
import {
    agentEventColor,
    agentEventSummary,
    swarmEventColor,
    swarmEventSummary
} from '@/utils/eventFormatting';
import type { AgentStreamEvent, SwarmStreamEvent } from '@/api/sseEvents';

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

    it('formats swarm hard_stop events', () => {
        const event: SwarmStreamEvent = {
            type: 'hard_stop',
            data: { step: 1, code: 'E_CONSECUTIVE_ERRORS', reason: 'Error budget exceeded' }
        };

        expect(swarmEventColor(event.type)).toBe('error');
        expect(swarmEventSummary(event)).toBe(
            'Hard stop (E_CONSECUTIVE_ERRORS): Error budget exceeded'
        );
    });
});
