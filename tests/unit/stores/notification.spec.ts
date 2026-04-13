import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useNotificationsStore, TOAST_TYPE } from '@/stores/notification';

describe('useNotificationsStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('starts with no messages', () => {
        const store = useNotificationsStore();
        expect(store.messages).toEqual([]);
    });

    it('adds a success message', () => {
        const store = useNotificationsStore();
        store.addMessage('It works!', TOAST_TYPE.SUCCESS);
        expect(store.messages).toHaveLength(1);
        expect(store.messages[0].type).toBe(TOAST_TYPE.SUCCESS);
        expect(store.messages[0].message).toBe('It works!');
    });

    it('hides a message by id', () => {
        const store = useNotificationsStore();
        store.addMessage('Oops', TOAST_TYPE.DANGER);
        const id = store.messages[0].id;
        store.hideMessage(id);
        expect(store.messages).toHaveLength(0);
    });
});
