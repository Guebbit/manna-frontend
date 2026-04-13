import { LGraphNode } from 'litegraph.js';

/**
 * Constant text value node — lets the user type a static string that
 * flows into downstream nodes.
 * Category: `manna/utility`
 */
export class TextInputNode extends LGraphNode {
    static title = 'Text Input';
    static description = 'A constant text string value';

    constructor() {
        super('Text Input');
        this.addOutput('text', 'string');
        this.addWidget('text', 'value', '', 'value');
        this.title = 'Text Input';
        this.color = '#37474f';
    }
}
