import { LGraphNode } from 'litegraph.js';

/**
 * Node that reads a file from disk via the Manna `read_file` tool.
 * Category: `manna/file`
 */
export class ReadFileNode extends LGraphNode {
    static title = 'Read File';
    static description = 'Read a file from disk (manna read_file tool)';

    constructor() {
        super('Read File');
        this.addInput('path', 'string');
        this.addOutput('content', 'string');
        this.addWidget('text', 'path', '', 'path');
        this.title = 'Read File';
        this.color = '#1a237e';
    }
}
