import { defineStore } from 'pinia';
import { ref } from 'vue';
import { v4 as uuidv4 } from 'uuid';

/** A toast notification displayed to the user. */
export interface INotification {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timeout: number;
}

/**
 * Pinia store managing in-app toast notifications.
 * Provides typed convenience methods for each severity level.
 */
export const useNotificationStore = defineStore('notification', () => {
    const notifications = ref<INotification[]>([]);

    /**
     * Pushes a new notification onto the stack.
     *
     * @param type    - The severity level of the notification.
     * @param message - The human-readable message to display.
     * @param timeout - Auto-dismiss delay in milliseconds (default `5000`).
     */
    function push(type: INotification['type'], message: string, timeout = 5000): void {
        const id = uuidv4();
        notifications.value.push({ id, type, message, timeout });
    }

    /**
     * Removes a notification by its unique identifier.
     *
     * @param id - The notification ID to remove.
     */
    function remove(id: string): void {
        const index = notifications.value.findIndex((n) => n.id === id);
        if (index !== -1) notifications.value.splice(index, 1);
    }

    /** Pushes a success notification with the default timeout. */
    function success(message: string): void {
        push('success', message);
    }
    /** Pushes an error notification with an extended 8 000 ms timeout. */
    function error(message: string): void {
        push('error', message, 8000);
    }
    /** Pushes a warning notification with the default timeout. */
    function warning(message: string): void {
        push('warning', message);
    }
    /** Pushes an informational notification with the default timeout. */
    function info(message: string): void {
        push('info', message);
    }

    return { notifications, push, remove, success, error, warning, info };
});
