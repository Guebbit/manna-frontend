/**
 * @module utils/navigation
 *
 * Single source of truth for application navigation items.
 *
 * Both the sidebar and the dashboard quick-actions derive their data from
 * this list so that adding or renaming a page only requires one edit.
 * The `title` and `description` fields are i18n keys resolved at render time.
 */

/** Describes a single navigable page in the application. */
export interface INavItem {
    /** i18n key for the display label shown in the sidebar. */
    title: string;
    /** MDI icon name (e.g. `'mdi-chat'`). */
    icon: string;
    /** Vue Router path (e.g. `'/chat'`). */
    to: string;
    /** i18n key for the short description shown in the dashboard quick-actions section. */
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
        title: 'nav.dashboard',
        icon: 'mdi-view-dashboard',
        to: '/',
        description: 'nav.dashboardDesc'
    },
    { title: 'nav.chat', icon: 'mdi-chat', to: '/chat', description: 'nav.chatDesc' },
    { title: 'nav.agentTask', icon: 'mdi-robot', to: '/agent', description: 'nav.agentTaskDesc' },
    {
        title: 'nav.codeTools',
        icon: 'mdi-code-braces',
        to: '/code',
        description: 'nav.codeToolsDesc'
    },
    {
        title: 'nav.uploadAnalyze',
        icon: 'mdi-upload',
        to: '/upload',
        description: 'nav.uploadAnalyzeDesc'
    },
    {
        title: 'nav.graphBuilder',
        icon: 'mdi-graph',
        to: '/graph',
        description: 'nav.graphBuilderDesc'
    },
    { title: 'nav.swarm', icon: 'mdi-sitemap', to: '/swarm', description: 'nav.swarmDesc' },
    {
        title: 'nav.workflow',
        icon: 'mdi-list-status',
        to: '/workflow',
        description: 'nav.workflowDesc'
    },
    {
        title: 'nav.systemInfo',
        icon: 'mdi-information-outline',
        to: '/system',
        description: 'nav.systemInfoDesc'
    },
    { title: 'nav.settings', icon: 'mdi-cog', to: '/settings', description: 'nav.settingsDesc' }
] as const;
