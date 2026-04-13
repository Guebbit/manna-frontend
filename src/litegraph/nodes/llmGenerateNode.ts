import { LGraphNode } from 'litegraph.js';

/** Available LLM profile options. */
const PROFILE_OPTIONS = ['default', 'fast', 'reasoning', 'code'] as const;

/**
 * Node that calls the Manna LLM with a prompt and a profile selector widget.
 * Category: `manna/llm`
 */
export class LlmGenerateNode extends LGraphNode {
    static title = 'LLM Generate';
    static description = 'Call the Manna LLM with a prompt and profile selection';

    constructor() {
        super('LLM Generate');
        this.addInput('prompt', 'string');
        this.addOutput('response', 'string');
        this.addWidget('text', 'prompt', '', 'prompt');
        this.addWidget('combo', 'profile', 'default', 'profile', {
            values: [...PROFILE_OPTIONS],
        });
        this.title = 'LLM Generate';
        this.color = '#4a148c';
    }
}
