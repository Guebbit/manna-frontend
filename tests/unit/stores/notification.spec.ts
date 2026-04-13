import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useNotificationStore } from '@/stores/notification';

describe('useNotificationStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('starts with no notifications', () => {
        const store = useNotificationStore();
        expect(store.notifications).toEqual([]);
    });

    it('pushes a success notification', () => {
        const store = useNotificationStore();
        store.success('It works!');
        expect(store.notifications).toHaveLength(1);
        expect(store.notifications[0].type).toBe('success');
        expect(store.notifications[0].message).toBe('It works!');
    });

    it('removes a notification by id', () => {
        const store = useNotificationStore();
        store.error('Oops');
        const id = store.notifications[0].id;
        store.remove(id);
        expect(store.notifications).toHaveLength(0);
    });
});
