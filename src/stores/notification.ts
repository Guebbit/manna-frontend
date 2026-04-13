import { defineStore } from 'pinia';
import { ref } from 'vue';
import { v4 as uuidv4 } from 'uuid';

export interface INotification {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timeout: number;
}

export const useNotificationStore = defineStore('notification', () => {
    const notifications = ref<INotification[]>([]);

    function push(type: INotification['type'], message: string, timeout = 5000): void {
        const id = uuidv4();
        notifications.value.push({ id, type, message, timeout });
    }

    function remove(id: string): void {
        const index = notifications.value.findIndex((n) => n.id === id);
        if (index !== -1) notifications.value.splice(index, 1);
    }

    function success(message: string): void {
        push('success', message);
    }
    function error(message: string): void {
        push('error', message, 8000);
    }
    function warning(message: string): void {
        push('warning', message);
    }
    function info(message: string): void {
        push('info', message);
    }

    return { notifications, push, remove, success, error, warning, info };
});
