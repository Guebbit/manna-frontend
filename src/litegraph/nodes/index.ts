import { LiteGraph } from 'litegraph.js';
import { ReadFileNode } from './readFileNode';
import { WriteFileNode } from './writeFileNode';
import { ShellNode } from './shellNode';
import { SemanticSearchNode } from './semanticSearchNode';
import { BrowserFetchNode } from './browserFetchNode';
import { LlmGenerateNode } from './llmGenerateNode';
import { TextInputNode } from './textInputNode';
import { TextOutputNode } from './textOutputNode';

/** Tracks whether nodes have already been registered to avoid duplicate registration. */
let nodesRegistered = false;

/**
 * Registers all Manna custom node types with LiteGraph.
 * Safe to call multiple times — registration runs only once.
 */
export function registerMannaNodes(): void {
    if (nodesRegistered) {
        return;
    }
    LiteGraph.registerNodeType('manna/read_file', ReadFileNode);
    LiteGraph.registerNodeType('manna/write_file', WriteFileNode);
    LiteGraph.registerNodeType('manna/shell', ShellNode);
    LiteGraph.registerNodeType('manna/semantic_search', SemanticSearchNode);
    LiteGraph.registerNodeType('manna/browser_fetch', BrowserFetchNode);
    LiteGraph.registerNodeType('manna/llm_generate', LlmGenerateNode);
    LiteGraph.registerNodeType('manna/text_input', TextInputNode);
    LiteGraph.registerNodeType('manna/text_output', TextOutputNode);
    nodesRegistered = true;
}
