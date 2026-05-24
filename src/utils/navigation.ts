/**
 * @module utils/navigation
 *
 * Single source of truth for application navigation items.
 *
 * Both the sidebar and the dashboard quick-actions derive their data from
 * this list so that adding or renaming a page only requires one edit.
 * The `title` and `description` fields are i18n keys resolved at render time.
 */

import type { RouteLocationRaw } from 'vue-router';

/** Describes a single navigable page in the application. */
export interface INavItem {
    /** i18n key for the display label shown in the sidebar. */
    title: string;
    /** MDI icon name (e.g. `'mdi-chat'`). */
    icon: string;
    /** Vue Router named-route location — ensures correct hash-mode URL generation. */
    to: RouteLocationRaw;
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
        to: { name: 'dashboard' },
        description: 'nav.dashboardDesc'
    },
    {
        title: 'nav.chat',
        icon: 'mdi-chat',
        to: { name: 'chat-conversations' },
        description: 'nav.chatDesc'
    },
    {
        title: 'nav.agentTask',
        icon: 'mdi-robot',
        to: { name: 'agent' },
        description: 'nav.agentTaskDesc'
    },
    {
        title: 'nav.codeTools',
        icon: 'mdi-code-braces',
        to: { name: 'code' },
        description: 'nav.codeToolsDesc'
    },
    {
        title: 'nav.codeChat',
        icon: 'mdi-code-tags',
        to: { name: 'code-chat' },
        description: 'nav.codeChatDesc'
    },
    {
        title: 'nav.codeIndex',
        icon: 'mdi-text-search',
        to: { name: 'code-index' },
        description: 'nav.codeIndexDesc'
    },
    {
        title: 'nav.uploadAnalyze',
        icon: 'mdi-upload',
        to: { name: 'upload' },
        description: 'nav.uploadAnalyzeDesc'
    },
    {
        title: 'nav.library',
        icon: 'mdi-bookshelf',
        to: { name: 'library' },
        description: 'nav.libraryDesc'
    },
    {
        title: 'nav.graphBuilder',
        icon: 'mdi-graph',
        to: { name: 'graph-builder' },
        description: 'nav.graphBuilderDesc'
    },
    {
        title: 'nav.swarm',
        icon: 'mdi-sitemap',
        to: { name: 'swarm' },
        description: 'nav.swarmDesc'
    },
    {
        title: 'nav.workflow',
        icon: 'mdi-list-status',
        to: { name: 'workflow' },
        description: 'nav.workflowDesc'
    },
    {
        title: 'nav.systemInfo',
        icon: 'mdi-information-outline',
        to: { name: 'system-info' },
        description: 'nav.systemInfoDesc'
    },
    {
        title: 'nav.settings',
        icon: 'mdi-cog',
        to: { name: 'settings' },
        description: 'nav.settingsDesc'
    }
];
