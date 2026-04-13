<template>
    <div>
        <h1 class="text-h4 mb-6">Settings</h1>

        <v-row>
            <v-col cols="12" md="8">
                <v-card>
                    <v-card-title>
                        <v-icon start>mdi-connection</v-icon>
                        Connection
                    </v-card-title>
                    <v-card-text>
                        <v-text-field
                            v-model="apiUrl"
                            label="Manna API URL"
                            variant="outlined"
                            hint="Default: http://localhost:3001"
                            persistent-hint
                            @blur="saveUrl"
                        />

                        <div class="mt-4 d-flex align-center ga-3">
                            <v-btn variant="tonal" :loading="testing" @click="testConnection">
                                <v-icon start>mdi-lan-check</v-icon>
                                Test Connection
                            </v-btn>
                            <v-chip v-if="testResult === 'ok'" color="success" size="small">
                                Connected!
                            </v-chip>
                            <v-chip v-else-if="testResult === 'fail'" color="error" size="small">
                                Connection failed
                            </v-chip>
                        </div>
                    </v-card-text>
                </v-card>

                <v-card class="mt-4">
                    <v-card-title>
                        <v-icon start>mdi-tune</v-icon>
                        Defaults
                    </v-card-title>
                    <v-card-text>
                        <v-select
                            v-model="defaultProfile"
                            :items="profileOptions"
                            label="Default model profile"
                            variant="outlined"
                            density="compact"
                            @update:model-value="saveDefaults"
                        />

                        <v-switch
                            v-model="defaultWriteMode"
                            label="Default write mode (⚠ dangerous — allows file modifications)"
                            color="warning"
                            @update:model-value="saveDefaults"
                        />
                    </v-card-text>
                </v-card>
            </v-col>

            <v-col cols="12" md="4">
                <v-card>
                    <v-card-title>
                        <v-icon start>mdi-information</v-icon>
                        About
                    </v-card-title>
                    <v-card-text>
                        <p class="text-body-2 mb-2">
                            <strong>Manna</strong> is a local-first AI agent platform.
                        </p>
                        <p class="text-caption text-grey">
                            No authentication required. All data is stored in-memory.
                        </p>
                        <v-divider class="my-3" />
                        <p class="text-caption">API: {{ apiUrl }}</p>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { getMannaBaseUrl, setMannaBaseUrl } from '@/config';
import { healthCheck } from '@/api/manna';

const apiUrl = ref(getMannaBaseUrl());
const testing = ref(false);
const testResult = ref<'ok' | 'fail' | undefined>(undefined);

const defaultProfile = ref(localStorage.getItem('manna-default-profile') ?? 'auto');
const defaultWriteMode = ref(localStorage.getItem('manna-default-write') === 'true');

const profileOptions = [
    { title: 'Auto (router decides)', value: 'auto' },
    { title: 'Fast', value: 'fast' },
    { title: 'Reasoning', value: 'reasoning' },
    { title: 'Code', value: 'code' },
    { title: 'Default', value: 'default' }
];

function saveUrl(): void {
    setMannaBaseUrl(apiUrl.value);
}

function saveDefaults(): void {
    localStorage.setItem('manna-default-profile', defaultProfile.value);
    localStorage.setItem('manna-default-write', String(defaultWriteMode.value));
}

async function testConnection(): Promise<void> {
    testing.value = true;
    testResult.value = undefined;
    try {
        await healthCheck();
        testResult.value = 'ok';
    } catch {
        testResult.value = 'fail';
    } finally {
        testing.value = false;
    }
}
</script>
