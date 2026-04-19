import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';
import vuetify from 'vite-plugin-vuetify';

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        vuetify({ autoImport: true }),
        vueDevTools({
            // open webstorm instead of vscode when using the __devtools__
            launchEditor: 'webstorm'
        })
    ],
    resolve: {
        alias: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            '@': fileURLToPath(new URL('src', import.meta.url)),
            // eslint-disable-next-line @typescript-eslint/naming-convention
            '@types': fileURLToPath(new URL('src/types', import.meta.url)),
            // eslint-disable-next-line @typescript-eslint/naming-convention
            '@api': fileURLToPath(new URL('api', import.meta.url))
        }
    }
});
