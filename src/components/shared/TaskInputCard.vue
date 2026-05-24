<template>
    <!-- Shared task input card with profile selector and write mode switch -->
    <v-card>
        <v-card-title>{{ title }}</v-card-title>
        <v-card-text>
            <v-textarea
                :model-value="modelValue"
                :label="inputLabel"
                :placeholder="placeholder"
                variant="outlined"
                rows="4"
                auto-grow
                :hint="hint"
                persistent-hint
                @update:model-value="$emit('update:modelValue', $event)"
            />

            <v-row class="mt-2" align="center">
                <v-col cols="12" sm="6">
                    <v-select
                        :model-value="profile"
                        :items="profileOptions"
                        :label="profileLabel"
                        variant="outlined"
                        density="compact"
                        @update:model-value="$emit('update:profile', $event)"
                    />
                </v-col>
                <v-col cols="12" sm="6" class="d-flex align-center">
                    <v-tooltip :text="writeTooltip" location="top" max-width="320">
                        <template #activator="{ props: tooltipProps }">
                            <v-switch
                                v-bind="tooltipProps"
                                :model-value="allowWrite"
                                :label="writeLabel"
                                color="warning"
                                density="compact"
                                hide-details
                                @update:model-value="$emit('update:allowWrite', $event ?? false)"
                            />
                        </template>
                    </v-tooltip>
                </v-col>
            </v-row>

            <slot name="extra" />
        </v-card-text>
        <v-card-actions>
            <slot name="actions" />
        </v-card-actions>
    </v-card>
</template>

<script setup lang="ts">
import { useProfileOptions } from '@/utils/constants';

withDefaults(
    defineProps<{
        /** Task text (v-model) */
        modelValue: string;
        /** Current profile selection */
        profile: string;
        /** Allow write mode */
        allowWrite: boolean;
        /** Card title */
        title?: string;
        /** Textarea label */
        inputLabel?: string;
        /** Textarea placeholder */
        placeholder?: string;
        /** Textarea hint */
        hint?: string;
        /** Profile selector label */
        profileLabel?: string;
        /** Write switch label */
        writeLabel?: string;
        /** Write switch tooltip */
        writeTooltip?: string;
    }>(),
    {
        title: undefined,
        inputLabel: undefined,
        placeholder: undefined,
        hint: undefined,
        profileLabel: undefined,
        writeLabel: undefined,
        writeTooltip: undefined
    }
);

defineEmits(['update:modelValue', 'update:profile', 'update:allowWrite']);

const profileOptions = useProfileOptions();
</script>
