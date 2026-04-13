/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_MANNA_URL: string | undefined;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
