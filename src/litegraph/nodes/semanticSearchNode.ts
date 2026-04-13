import { LGraphNode } from 'litegraph.js';

/**
 * Node that performs a semantic/vector search via the Manna `semantic_search` tool.
 * Category: `manna/search`
 */
export class SemanticSearchNode extends LGraphNode {
    static title = 'Semantic Search';
    static description = 'Embed a query and search files (manna semantic_search tool)';

    constructor() {
        super('Semantic Search');
        this.addInput('query', 'string');
        this.addOutput('results', 'string');
        this.addWidget('text', 'query', '', 'query');
        this.title = 'Semantic Search';
        this.color = '#004d40';
    }
}
