import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useUploadStore } from '@/stores/upload';

const mocks = vi.hoisted(() => ({
    uploadImageClassify: vi.fn(),
    uploadImageSketch: vi.fn(),
    uploadImageColorize: vi.fn(),
    uploadSpeechToText: vi.fn(),
    uploadReadPdf: vi.fn()
}));

vi.mock('@/api/manna', () => ({
    uploadImageClassify: mocks.uploadImageClassify,
    uploadImageSketch: mocks.uploadImageSketch,
    uploadImageColorize: mocks.uploadImageColorize,
    uploadSpeechToText: mocks.uploadSpeechToText,
    uploadReadPdf: mocks.uploadReadPdf
}));

describe('useUploadStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
        mocks.uploadImageClassify.mockResolvedValue({ success: true, status: 200, message: 'ok' });
        mocks.uploadImageSketch.mockResolvedValue(new Blob(['png'], { type: 'image/png' }));
        mocks.uploadImageColorize.mockResolvedValue({
            success: true,
            status: 200,
            message: 'ok',
            data: { image: 'abc', duration_ms: 12, model: 'm' }
        });
        mocks.uploadSpeechToText.mockResolvedValue({ success: true, status: 200, message: 'ok' });
        mocks.uploadReadPdf.mockResolvedValue({ success: true, status: 200, message: 'ok' });
    });

    it('stores sketch and colorize results', async () => {
        const store = useUploadStore();
        const file = new File(['test'], 'test.png', { type: 'image/png' });
        await store.sketchImage(file, undefined, undefined, 'png');
        await store.colorizeImage(file, 'color', undefined, 'json');

        expect(store.imageSketchResult).toBeInstanceOf(Blob);
        expect((store.imageColorizeResult as { data?: { image?: string } })?.data?.image).toBe(
            'abc'
        );
    });
});
