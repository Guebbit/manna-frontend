import { LGraphNode } from 'litegraph.js';

/**
 * Node that runs an allow-listed shell command via the Manna `shell` tool.
 * Category: `manna/system`
 */
export class ShellNode extends LGraphNode {
    static title = 'Shell';
    static description = 'Execute an allow-listed shell command (manna shell tool)';

    constructor() {
        super('Shell');
        this.addInput('command', 'string');
        this.addOutput('stdout', 'string');
        this.addWidget('text', 'command', '', 'command');
        this.title = 'Shell';
        this.color = '#880e4f';
    }
}
