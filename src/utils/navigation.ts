/**
 * @module utils/navigation
 *
 * Single source of truth for application navigation items.
 *
 * Both the sidebar and the dashboard quick-actions derive their data from
 * this list so that adding or renaming a page only requires one edit.
 */

/** Describes a single navigable page in the application. */
export interface INavItem {
    /** Display label shown in the sidebar. */
    title: string;
    /** MDI icon name (e.g. `'mdi-chat'`). */
    icon: string;
    /** Vue Router path (e.g. `'/chat'`). */
    to: string;
    /** Short description shown in the dashboard quick-actions section. */
    description: string;
}

/**
 * Complete ordered list of navigable application pages.
 *
 * The sidebar renders all entries; the dashboard renders all entries
 * except the first (Dashboard itself) and last (Settings).
 */
export const NAV_ITEMS: readonly INavItem[] = [
    {
        title: 'Dashboard',
        icon: 'mdi-view-dashboard',
        to: '/',
        description: 'Overview of system health, models, and quick navigation.'
    },
    {
        title: 'Chat',
        icon: 'mdi-chat',
        to: '/chat',
        description:
            "OpenAI-compatible chat. Use the 'manna' model for tool-enabled agentic conversations."
    },
    {
        title: 'Agent Task',
        icon: 'mdi-robot',
        to: '/agent',
        description:
            'Autonomous task execution. The agent reasons step-by-step and calls tools to complete your request.'
    },
    {
        title: 'Code Tools',
        icon: 'mdi-code-braces',
        to: '/code',
        description: 'Fast IDE tools: code completion, lint analysis, and AI-powered page review.'
    },
    {
        title: 'Upload & Analyze',
        icon: 'mdi-upload',
        to: '/upload',
        description:
            'Classify images, transcribe audio, or extract text from PDFs using specialised AI models.'
    },
    {
        title: 'Graph Builder',
        icon: 'mdi-graph',
        to: '/graph',
        description:
            'Build visual pipelines with a node graph editor and execute them on the backend.'
    },
    {
        title: 'Swarm',
        icon: 'mdi-sitemap',
        to: '/swarm',
        description:
            'Break a complex task into subtasks, run them across multiple agents in parallel, and synthesise the results.'
    },
    {
        title: 'Workflow',
        icon: 'mdi-list-status',
        to: '/workflow',
        description:
            'Define and execute multi-step pipelines with conditional logic, branching, and sequential or parallel task orchestration.'
    },
    {
        title: 'System Info',
        icon: 'mdi-information-outline',
        to: '/system',
        description: 'View routing profiles, loaded Ollama models, and the complete API reference.'
    },
    {
        title: 'Settings',
        icon: 'mdi-cog',
        to: '/settings',
        description: 'Configure backend URL, default model profile, and write-mode defaults.'
    }
] as const;
