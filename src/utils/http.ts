import axios from 'axios';
import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { getMannaBaseUrl } from '@/config';

const httpClient = axios.create({
    headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'Content-Type': 'application/json',
        Accept: 'application/json'
    },
    timeout: Number.parseInt(import.meta.env.VITE_AXIOS_TIMEOUT ?? '30000')
});

/**
 * Request interceptor: dynamically prepends the manna base URL so that
 * runtime settings changes (localStorage override) are picked up per-request.
 */
export const onRequest = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    if (config.url && !config.url.startsWith('http')) {
        config.url = getMannaBaseUrl() + config.url;
    }
    return config;
};

/**
 * Response success interceptor: pass-through (preserves AxiosResponse typing).
 */
export const onResponseSuccess = (response: AxiosResponse): AxiosResponse => response;

/**
 * Response error interceptor: forward AxiosErrors so stores can inspect
 * `error.response.status` and `error.response.data` via `handleApiError`.
 */
export const onResponseReject = (error: AxiosError): Promise<never> => Promise.reject(error);

httpClient.interceptors.request.use(onRequest);
httpClient.interceptors.response.use(onResponseSuccess, onResponseReject);

export default httpClient;
