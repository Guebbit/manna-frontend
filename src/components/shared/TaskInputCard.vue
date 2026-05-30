<template>
    <!-- Shared task input card with profile selector -->
    <v-card>
        <v-card-title>{{ title }}</v-card-title>
        <v-card-text>
            <!-- Input area: defaults to textarea, can be replaced (e.g. step list) -->
            <slot name="input">
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
            </slot>

            <!-- Options row: profile selector + optional middle fields -->
            <v-row class="mt-2" align="center">
                <v-col cols="12" :sm="hasOptions ? 4 : 12">
                    <v-select
                        :model-value="profile"
                        :items="profileOptions"
                        :label="profileLabel"
                        variant="outlined"
                        density="compact"
                        @update:model-value="$emit('update:profile', $event)"
                    />
                </v-col>

                <!-- Extra option fields injected by consumers (e.g. maxSubtasks, carry mode) -->
                <slot name="options" />
            </v-row>

            <slot name="extra" />
        </v-card-text>
        <v-card-actions>
            <slot name="actions" />
        </v-card-actions>
    </v-card>
</template>

<script setup lang="ts">
import { useSlots } from 'vue';
import { useProfileOptions } from '@/utils/constants';

withDefaults(
    defineProps<{
        /** Task text (v-model) — unused when #input slot is overridden */
        modelValue?: string;
        /** Current profile selection */
        profile: string;
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
    }>(),
    {
        modelValue: '',
        title: undefined,
        inputLabel: undefined,
        placeholder: undefined,
        hint: undefined,
        profileLabel: undefined
    }
);

defineEmits(['update:modelValue', 'update:profile']);

const slots = useSlots();
/** Detect if #options slot is provided to adjust column sizing */
const hasOptions = !!slots.options;

const profileOptions = useProfileOptions();
</script>
