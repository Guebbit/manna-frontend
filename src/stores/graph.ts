/**
 * @module stores/graph
 *
 * Pinia store for the visual LiteGraph pipeline builder.
 *
 * The store serialises the live `LGraph` instance to a JSON snapshot using
 * LiteGraph's own `graph.serialize()` method and sends the JSON to the Manna
 * `/run` endpoint as a task description.
 *
 * Currently the graph JSON is embedded in a natural-language prompt so the
 * agent can interpret and execute the pipeline.  When the backend adds a
 * dedicated `POST /run/graph` endpoint this store should be updated to target
 * that route instead for more structured execution.
 */
import { defineStore } from 'pinia';

/** Serialised LiteGraph graph payload. */
export type IGraphData = serializedLGraph;

/** State shape managed by the graph store. */
export interface IGraphState {
    /** The most recently serialised LiteGraph JSON, or `undefined` if none. */
    graphData: IGraphData | undefined;
    /** Whether a graph execution request is in flight. */
    isExecuting: boolean;
    /** The result string returned by the last execution, or `undefined`. */
    executionResult: string | undefined;
}

/**
 * Pinia store for visual graph builder state, serialisation and remote execution.
 */
export const useGraphStore = defineStore('graph', () => {
    const graphData = ref<IGraphData | undefined>(undefined);
    const isExecuting = ref(false);
    const executionResult = ref<string | undefined>(undefined);

    /**
     * Serialises the given `LGraph` instance to JSON and persists it in the store.
     *
     * @param graph - The live LiteGraph instance to serialise.
     */
    function saveGraph(graph: LGraph): void {
        graphData.value = graph.serialize() as IGraphData;
    }

    /**
     * Deserialises the provided JSON into the given `LGraph` instance.
     *
     * @param graph - The live LiteGraph instance to configure.
     * @param data  - Previously serialised graph JSON.
     */
    function loadGraph(graph: LGraph, data: IGraphData): void {
        graph.configure(data);
        graphData.value = data;
    }

    /**
     * POSTs the serialised graph JSON to the Manna `/run` endpoint as a task
     * description and stores the execution result.
     *
     * When a dedicated `POST /run/graph` backend endpoint is available this
     * function should be updated to target that endpoint instead.
     *
     * @param graphJson  - Serialised LiteGraph JSON to execute.
     * @param allowWrite - Whether to permit write operations (default `false`).
     * @returns The execution result string, or `undefined` on failure.
     */
    async function executeGraph(
        graphJson: IGraphData,
        allowWrite = false,
    ): Promise<string | undefined> {
        const notificationStore = useNotificationsStore();
        isExecuting.value = true;
        executionResult.value = undefined;

        try {
            const task = `Execute the following LiteGraph pipeline:\n${JSON.stringify(graphJson)}`;
            const response = await runTask({ task, allowWrite });
            executionResult.value = response.result;
            return response.result;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Graph execution failed';
            notificationStore.addMessage(message, TOAST_TYPE.DANGER);
            return undefined;
        } finally {
            isExecuting.value = false;
        }
    }

    return { graphData, isExecuting, executionResult, saveGraph, loadGraph, executeGraph };
});
