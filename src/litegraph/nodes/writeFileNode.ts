import { LGraphNode } from 'litegraph.js';

/**
 * Node that writes a file to disk via the Manna `write_file` tool.
 * Category: `manna/file`
 */
export class WriteFileNode extends LGraphNode {
    static title = 'Write File';
    static description = 'Write a file to disk (manna write_file tool)';

    constructor() {
        super('Write File');
        this.addInput('path', 'string');
        this.addInput('content', 'string');
        this.addOutput('result', 'string');
        this.addWidget('text', 'path', '', 'path');
        this.title = 'Write File';
        this.color = '#1a237e';
    }
}
