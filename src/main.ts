/**
 * @module main
 *
 * Application entry point.
 *
 * Wires together Vue 3, Pinia, Vue Router, and Vuetify, then mounts the root
 * component onto `#app`.  The Vuetify theme defaults to dark mode with Manna's
 * brand colours (deep-purple primary, blue secondary).
 */
import { createApp } from 'vue';
import { createPinia } from 'pinia';

// Vuetify
import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

import App from './App.vue';
import router from './router';

const vuetify = createVuetify({
    components,
    directives,
    theme: {
        defaultTheme: 'dark',
        themes: {
            dark: {
                dark: true,
                colors: {
                    primary: '#7C4DFF',
                    secondary: '#448AFF',
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    'surface-variant': '#2A2A2A'
                }
            },
            light: {
                dark: false,
                colors: {
                    primary: '#7C4DFF',
                    secondary: '#448AFF'
                }
            }
        }
    }
});

createApp(App).use(createPinia()).use(router).use(vuetify).mount('#app');
