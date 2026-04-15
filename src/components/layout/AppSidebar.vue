<template>
    <v-navigation-drawer
        :model-value="modelValue"
        :rail="rail"
        permanent
        color="surface"
        @update:model-value="emit('update:modelValue', $event)"
    >
        <v-list density="compact" nav>
            <v-list-item
                v-for="item in navItems"
                :key="item.to"
                :to="item.to"
                :prepend-icon="item.icon"
                :title="item.title"
                rounded="xl"
            >
                <v-tooltip v-if="rail" :text="item.title" location="end" activator="parent" />
            </v-list-item>
        </v-list>

        <template #append>
            <v-divider />
            <div class="pa-3">
                <div class="d-flex align-center ga-2 mb-2">
                    <HealthBadge :is-online="!!systemStore.health" />
                    <span v-if="!rail" class="text-caption">Manna</span>
                </div>
                <div v-if="!rail" class="text-caption text-grey">
                    <v-icon size="x-small">mdi-brain</v-icon>
                    {{ systemStore.models.length }} model{{
                        systemStore.models.length === 1 ? '' : 's'
                    }}
                </div>
                <v-btn
                    class="mt-2"
                    icon
                    size="small"
                    variant="text"
                    @click="emit('update:rail', !rail)"
                >
                    <v-icon>
                        {{ rail ? 'mdi-chevron-right' : 'mdi-chevron-left' }}
                    </v-icon>
                </v-btn>
            </div>
        </template>
    </v-navigation-drawer>
</template>

<script setup lang="ts">
/**
 * AppSidebar — the main application navigation drawer.
 *
 * Renders a Vuetify `v-navigation-drawer` with links to every major view.
 * Supports a collapsed (`rail`) mode where only icons are shown, toggled via
 * the chevron button in the footer area.
 *
 * The footer area also displays a live {@link HealthBadge} and the number of
 * loaded models so the user always knows the backend connection state.
 *
 * @prop modelValue - Whether the drawer is open (v-model binding).
 * @prop rail       - Whether the drawer is in collapsed rail mode.
 *
 * @emits update:modelValue - Emitted when the drawer open state changes.
 * @emits update:rail       - Emitted when the rail mode is toggled.
 */
import { useSystemStore } from '@/stores/system';
import HealthBadge from '@/components/shared/HealthBadge.vue';
import { NAV_ITEMS } from '@/utils/navigation';

defineProps<{
    modelValue: boolean;
    rail: boolean;
}>();

const emit = defineEmits<{
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'update:modelValue': [value: boolean];
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'update:rail': [value: boolean];
}>();

const systemStore = useSystemStore();

const navItems = NAV_ITEMS;
</script>
