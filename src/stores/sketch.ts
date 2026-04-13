import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';
import type { IInkResponse, IInkAndColorResponse, SketchState } from '@/api/types';
import { inkSketch, inkAndColor, ApiError } from '@/api/manna';
import { useNotificationStore } from './notification';

export const useSketchStore = defineStore('sketch', () => {
    const inkResult = ref<IInkResponse | undefined>(undefined);
    const inkAndColorResult = ref<IInkAndColorResponse | undefined>(undefined);
    const comingSoon = ref(false);

    const loading = reactive({
        ink: false,
        inkAndColor: false
    });

    async function submitInk(image: File, model?: string): Promise<void> {
        const notificationStore = useNotificationStore();
        loading.ink = true;
        comingSoon.value = false;
        try {
            inkResult.value = await inkSketch({ image, model });
        } catch (error: unknown) {
            if (error instanceof ApiError && error.status === 404) {
                comingSoon.value = true;
            } else if (error instanceof ApiError) {
                notificationStore.error(error.message);
            }
            inkResult.value = undefined;
        } finally {
            loading.ink = false;
        }
    }

    async function submitInkAndColor(
        image: File,
        model?: string,
        sketchState?: SketchState
    ): Promise<void> {
        const notificationStore = useNotificationStore();
        loading.inkAndColor = true;
        comingSoon.value = false;
        try {
            inkAndColorResult.value = await inkAndColor({ image, model, sketchState });
        } catch (error: unknown) {
            if (error instanceof ApiError && error.status === 404) {
                comingSoon.value = true;
            } else if (error instanceof ApiError) {
                notificationStore.error(error.message);
            }
            inkAndColorResult.value = undefined;
        } finally {
            loading.inkAndColor = false;
        }
    }

    return {
        inkResult,
        inkAndColorResult,
        comingSoon,
        loading,
        submitInk,
        submitInkAndColor
    };
});
