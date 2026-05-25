import { Configuration } from '@api/configuration';
import {
    ChatApi,
    CoreApi,
    HistoryApi,
    IdeApi,
    InfoApi,
    LibraryApi,
    SwarmApi,
    UploadApi,
    WorkflowApi
} from '@api/api';
import httpClient from '@/utils/http';

/**
 * Shared OpenAPI configuration.
 * basePath is intentionally empty — the request interceptor in http.ts prepends
 * getMannaBaseUrl() at call time so runtime settings changes take effect immediately.
 */
const apiConfig = new Configuration({ basePath: '' });

export const chatApi = new ChatApi(apiConfig, '', httpClient);
export const coreApi = new CoreApi(apiConfig, '', httpClient);
export const historyApi = new HistoryApi(apiConfig, '', httpClient);
export const ideApi = new IdeApi(apiConfig, '', httpClient);
export const infoApi = new InfoApi(apiConfig, '', httpClient);
export const libraryApi = new LibraryApi(apiConfig, '', httpClient);
export const swarmApi = new SwarmApi(apiConfig, '', httpClient);
export const uploadApi = new UploadApi(apiConfig, '', httpClient);
export const workflowApi = new WorkflowApi(apiConfig, '', httpClient);
