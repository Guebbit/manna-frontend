import { LiteGraph } from 'litegraph.js';

/** Background fill colour for the canvas in dark mode. */
export const CANVAS_BG_COLOR = '#1e1e2e';

/** Grid line colour used on the canvas background. */
export const CANVAS_GRID_COLOR = '#2a2a3a';

/** Default node body colour aligned with Vuetify surface-variant. */
export const NODE_BODY_COLOR = '#2d2d3f';

/** Node title-bar colour matching Vuetify primary. */
export const NODE_TITLE_COLOR = '#1565c0';

/** Node title text colour. */
export const NODE_TITLE_TEXT_COLOR = '#e0e0e0';

/** Link / connection line colour. */
export const LINK_COLOR = '#42a5f5';

/** Selected node highlight colour. */
export const NODE_SELECTED_TITLE_COLOR = '#1976d2';

/**
 * Configures global LiteGraph settings for a Vuetify dark-theme appearance.
 * Call this once before mounting any LGraphCanvas.
 */
export function setupLiteGraph(): void {
    LiteGraph.NODE_DEFAULT_COLOR = NODE_BODY_COLOR;
    LiteGraph.NODE_DEFAULT_BGCOLOR = NODE_BODY_COLOR;
    LiteGraph.NODE_TITLE_COLOR = NODE_TITLE_TEXT_COLOR;
    LiteGraph.LINK_COLOR = LINK_COLOR;
    LiteGraph.EVENT_LINK_COLOR = '#e91e63';
    LiteGraph.CANVAS_GRID_SIZE = 20;
}
