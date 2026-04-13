import { LGraphNode } from 'litegraph.js';

/**
 * Displays the final string result of a pipeline.
 * Category: `manna/utility`
 */
export class TextOutputNode extends LGraphNode {
    static title = 'Text Output';
    static description = 'Displays the final result of a pipeline';

    /** Last value received on the text input slot. */
    outputValue = '';

    constructor() {
        super('Text Output');
        this.addInput('text', 'string');
        this.title = 'Text Output';
        this.color = '#1b5e20';
    }

    /** Stores the connected input value for display. */
    onExecute(): void {
        const value = this.getInputData(0) as string | undefined;
        this.outputValue = value ?? '';
    }
}
