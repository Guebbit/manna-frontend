<template>
    <!-- Reusable task/session history list panel -->
    <v-card>
        <v-card-title>{{ title }}</v-card-title>
        <v-card-text v-if="items.length === 0" class="text-grey">
            {{ emptyText }}
        </v-card-text>
        <v-list v-else density="compact">
            <v-list-item
                v-for="item in items"
                :key="item.id"
                :active="item.id === activeId"
                rounded="xl"
                @click="$emit('select', item)"
            >
                <v-list-item-title class="text-truncate">
                    <slot name="item-title" :item="item">
                        {{ item.label }}
                    </slot>
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption">
                    <slot name="item-subtitle" :item="item">
                        {{ item.subtitle }}
                    </slot>
                </v-list-item-subtitle>
            </v-list-item>
        </v-list>
    </v-card>
</template>

<script setup lang="ts">
/** Generic history item shape */
export interface IHistoryItem {
    id: string;
    label: string;
    subtitle?: string;
}

withDefaults(
    defineProps<{
        /** Card title */
        title: string;
        /** Text shown when no items exist */
        emptyText: string;
        /** History items to render */
        items: IHistoryItem[];
        /** Currently active item ID (for highlight) */
        activeId?: string;
    }>(),
    {
        activeId: undefined
    }
);

defineEmits<{
    select: [item: IHistoryItem];
}>();
</script>
