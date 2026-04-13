/// <reference types="vite/client" />
/// <reference lib="es2022.array" />

interface ImportMetaEnv {
    readonly VITE_MANNA_URL: string | undefined;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
