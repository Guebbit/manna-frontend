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
                    name: 'chat',
                    component: () => import('@/views/ChatView.vue')
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
                    path: 'upload',
                    name: 'upload',
                    component: () => import('@/views/UploadAnalyzeView.vue')
                },
                {
                    path: 'sketch',
                    name: 'sketch',
                    component: () => import('@/views/SketchStudioView.vue')
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
