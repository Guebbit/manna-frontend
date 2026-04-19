<template>
    <v-chip :color="isOnline ? 'success' : 'error'" size="small" variant="flat">
        <v-icon start size="x-small">
            {{ isOnline ? 'mdi-check-circle' : 'mdi-alert-circle' }}
        </v-icon>
        {{ isOnline ? t('health.online') : t('health.offline') }}
    </v-chip>
</template>

<script setup lang="ts">
/**
 * HealthBadge — a small status chip indicating whether the Manna backend is reachable.
 *
 * Renders a green "Online" chip when `isOnline` is `true`, or a red "Offline" chip
 * when `false`.  The colour and icon change together to provide accessible feedback.
 *
 * @prop isOnline - `true` when the backend health-check has succeeded.
 */
import { useI18n } from 'vue-i18n';

defineProps<{
    isOnline: boolean;
}>();

const { t } = useI18n();
</script>
