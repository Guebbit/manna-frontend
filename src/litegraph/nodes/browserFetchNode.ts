import { LGraphNode } from 'litegraph.js';

/**
 * Node that fetches a web page via the Manna `browser_fetch` tool.
 * Category: `manna/web`
 */
export class BrowserFetchNode extends LGraphNode {
    static title = 'Browser Fetch';
    static description = 'Fetch a web page via Playwright (manna browser_fetch tool)';

    constructor() {
        super('Browser Fetch');
        this.addInput('url', 'string');
        this.addOutput('content', 'string');
        this.addWidget('text', 'url', '', 'url');
        this.title = 'Browser Fetch';
        this.color = '#0d47a1';
    }
}
