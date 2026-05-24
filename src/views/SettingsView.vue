<template>
    <div>
        <h1 class="text-h4 mb-6">{{ t('settings.title') }}</h1>

        <v-row>
            <v-col cols="12" md="8">
                <v-card>
                    <v-card-title>
                        <v-icon start>mdi-connection</v-icon>
                        {{ t('settings.connection') }}
                    </v-card-title>
                    <v-card-text>
                        <v-text-field
                            v-model="apiUrl"
                            :label="t('settings.apiUrl')"
                            variant="outlined"
                            :hint="t('settings.apiUrlHint')"
                            persistent-hint
                            @blur="saveUrl"
                        />

                        <div class="mt-4 d-flex align-center ga-3">
                            <v-btn variant="tonal" :loading="testing" @click="testConnection">
                                <v-icon start>mdi-lan-check</v-icon>
                                {{ t('settings.testConnection') }}
                            </v-btn>
                            <v-chip v-if="testResult === 'ok'" color="success" size="small">
                                {{ t('settings.connected') }}
                            </v-chip>
                            <v-chip v-else-if="testResult === 'fail'" color="error" size="small">
                                {{ t('settings.connectionFailed') }}
                            </v-chip>
                        </div>
                    </v-card-text>
                </v-card>

                <!-- Workspace root — path to the mounted project directory -->
                <v-card class="mt-4">
                    <v-card-title>
                        <v-icon start>mdi-folder-open</v-icon>
                        {{ t('settings.workspace') }}
                    </v-card-title>
                    <v-card-text>
                        <v-text-field
                            v-model="workspaceRoot"
                            :label="t('settings.workspaceRoot')"
                            variant="outlined"
                            placeholder="/workspace/my-project"
                            prepend-inner-icon="mdi-folder"
                            clearable
                            :hint="t('settings.workspaceRootHint')"
                            persistent-hint
                            @blur="saveWorkspace"
                            @click:clear="clearWorkspace"
                        />
                    </v-card-text>
                </v-card>

                <v-card class="mt-4">
                    <v-card-title>
                        <v-icon start>mdi-tune</v-icon>
                        {{ t('settings.defaults') }}
                    </v-card-title>
                    <v-card-text>
                        <v-select
                            v-model="defaultProfile"
                            :items="profileOptions"
                            :label="t('settings.defaultModelProfile')"
                            variant="outlined"
                            density="compact"
                            :hint="t('settings.defaultModelProfileHint')"
                            persistent-hint
                            @update:model-value="saveDefaults"
                        />

                        <v-switch
                            v-model="defaultWriteMode"
                            :label="t('settings.defaultWriteMode')"
                            color="warning"
                            :hint="t('settings.defaultWriteModeHint')"
                            persistent-hint
                            @update:model-value="saveDefaults"
                        />
                    </v-card-text>
                </v-card>
            </v-col>

            <v-col cols="12" md="4">
                <v-card>
                    <v-card-title>
                        <v-icon start>mdi-information</v-icon>
                        {{ t('settings.about') }}
                    </v-card-title>
                    <v-card-text>
                        <p class="text-body-2 mb-2">
                            <strong>{{ t('settings.aboutText') }}</strong>
                        </p>
                        <p class="text-caption text-grey mb-2">
                            {{ t('settings.aboutSubtext') }}
                        </p>
                        <v-divider class="my-3" />
                        <p class="text-caption">{{ t('settings.apiLabel', { url: apiUrl }) }}</p>
                        <p class="text-caption mt-1">
                            {{ t('settings.backendVersion') }}
                            <strong>{{ MANNA_BACKEND_VERSION }}</strong>
                        </p>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import {
    getMannaBaseUrl,
    setMannaBaseUrl,
    getWorkspaceRoot,
    setWorkspaceRoot,
    MANNA_BACKEND_VERSION
} from '@/config';
import { coreApi } from '@/utils/api';
import { useProfileOptions } from '@/utils/constants';

const { t } = useI18n();

const apiUrl = ref(getMannaBaseUrl());
const testing = ref(false);
const testResult = ref<'ok' | 'fail' | undefined>(undefined);

const workspaceRoot = ref(getWorkspaceRoot());
const defaultProfile = ref(localStorage.getItem('manna-default-profile') ?? 'auto');
const defaultWriteMode = ref(localStorage.getItem('manna-default-write') === 'true');

const profileOptions = useProfileOptions();

function saveUrl(): void {
    setMannaBaseUrl(apiUrl.value);
}

function saveWorkspace(): void {
    setWorkspaceRoot(workspaceRoot.value ?? '');
}

function clearWorkspace(): void {
    workspaceRoot.value = '';
    setWorkspaceRoot('');
}

function saveDefaults(): void {
    localStorage.setItem('manna-default-profile', defaultProfile.value);
    localStorage.setItem('manna-default-write', String(defaultWriteMode.value));
}

async function testConnection(): Promise<void> {
    testing.value = true;
    testResult.value = undefined;
    try {
        await coreApi.getHealth();
        testResult.value = 'ok';
    } catch {
        testResult.value = 'fail';
    } finally {
        testing.value = false;
    }
}
</script>
