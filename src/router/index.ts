import { createRouter, createWebHashHistory } from 'vue-router';
import AppLayout from '@/layouts/AppLayout.vue';

const router = createRouter({
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            component: AppLayout,
            children: [
                {
                    path: '',
                    name: 'dashboard',
                    component: () => import('@/views/DashboardView.vue')
                },
                {
                    path: 'chat',
                    children: [
                        {
                            path: '',
                            redirect: { name: 'chat-conversations' }
                        },
                        {
                            path: 'conversations',
                            name: 'chat-conversations',
                            component: () => import('@/views/ChatView.vue')
                        },
                        {
                            path: 'conversations/:id',
                            name: 'chat-conversation',
                            component: () => import('@/views/ChatView.vue')
                        }
                    ]
                },
                {
                    path: 'agent',
                    name: 'agent',
                    component: () => import('@/views/AgentView.vue')
                },
                {
                    path: 'code',
                    name: 'code',
                    component: () => import('@/views/CodeToolsView.vue')
                },
                {
                    path: 'code-chat',
                    name: 'code-chat',
                    component: () => import('@/views/CodeChatView.vue')
                },
                {
                    path: 'code-index',
                    name: 'code-index',
                    component: () => import('@/views/CodeIndexView.vue')
                },
                {
                    path: 'upload',
                    name: 'upload',
                    component: () => import('@/views/UploadAnalyzeView.vue')
                },
                {
                    path: 'library',
                    name: 'library',
                    component: () => import('@/views/LibraryView.vue')
                },

                {
                    path: 'graph',
                    name: 'graph-builder',
                    component: () => import('@/views/GraphBuilderView.vue')
                },
                {
                    path: 'workflow',
                    name: 'workflow',
                    component: () => import('@/views/WorkflowView.vue')
                },
                {
                    path: 'system',
                    name: 'system-info',
                    component: () => import('@/views/SystemInfoView.vue')
                },
                {
                    path: 'observability',
                    name: 'observability',
                    component: () => import('@/views/ObservabilityView.vue')
                },
                {
                    path: 'settings',
                    name: 'settings',
                    component: () => import('@/views/SettingsView.vue')
                }
            ]
        },
        {
            path: '/:pathMatch(.*)*',
            name: 'error',
            component: () => import('@/views/ErrorView.vue')
        }
    ]
});

export default router;
