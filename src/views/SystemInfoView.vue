<template>
    <div>
        <h1 class="text-h4 mb-6">{{ t('systemInfo.title') }}</h1>

        <v-row>
            <!-- Routing Modes -->
            <v-col cols="12">
                <v-card>
                    <v-card-title class="d-flex align-center">
                        <v-icon start>mdi-routes</v-icon>
                        {{ t('systemInfo.agentRoutingProfiles') }}
                        <v-chip class="ml-2" size="small" color="primary">
                            {{ systemStore.modes.length }}
                        </v-chip>
                        <v-spacer />
                        <v-btn
                            icon
                            size="small"
                            variant="text"
                            :loading="systemStore.modesLoading"
                            @click="systemStore.fetchModes()"
                        >
                            <v-icon>mdi-refresh</v-icon>
                        </v-btn>
                    </v-card-title>
                    <v-card-subtitle>{{ t('systemInfo.routingProfilesSubtitle') }}</v-card-subtitle>
                    <v-card-text v-if="systemStore.modes.length === 0" class="text-grey">
                        {{ t('systemInfo.noRoutingProfiles') }}
                    </v-card-text>
                    <v-table v-else density="compact">
                        <thead>
                            <tr>
                                <th>{{ t('systemInfo.colProfile') }}</th>
                                <th>{{ t('systemInfo.colModel') }}</th>
                                <th>{{ t('systemInfo.colEnvVar') }}</th>
                                <th>{{ t('systemInfo.colDescription') }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="mode in systemStore.modes" :key="mode.profile">
                                <td>
                                    <v-chip size="small" color="primary" label>
                                        {{ mode.profile }}
                                    </v-chip>
                                </td>
                                <td class="text-caption">{{ mode.model }}</td>
                                <td>
                                    <code class="text-caption">{{ mode.envVar }}</code>
                                </td>
                                <td class="text-caption">{{ mode.description }}</td>
                            </tr>
                        </tbody>
                    </v-table>
                </v-card>
            </v-col>

            <!-- Ollama Models -->
            <v-col cols="12">
                <v-card>
                    <v-card-title class="d-flex align-center">
                        <v-icon start>mdi-brain</v-icon>
                        {{ t('systemInfo.ollamaModels') }}
                        <v-chip class="ml-2" size="small" color="secondary">
                            {{ systemStore.infoModels.length }}
                        </v-chip>
                        <v-spacer />
                        <v-btn
                            icon
                            size="small"
                            variant="text"
                            :loading="systemStore.infoModelsLoading"
                            @click="systemStore.fetchInfoModels()"
                        >
                            <v-icon>mdi-refresh</v-icon>
                        </v-btn>
                    </v-card-title>
                    <v-card-subtitle>{{ t('systemInfo.ollamaModelsSubtitle') }}</v-card-subtitle>
                    <v-card-text
                        v-if="systemStore.ollamaBaseUrl"
                        class="text-caption text-grey pb-0"
                    >
                        Ollama: {{ systemStore.ollamaBaseUrl }}
                    </v-card-text>
                    <v-card-text v-if="systemStore.infoModels.length === 0" class="text-grey">
                        {{ t('systemInfo.noOllamaModels') }}
                    </v-card-text>
                    <v-table v-else density="compact">
                        <thead>
                            <tr>
                                <th>{{ t('systemInfo.colName') }}</th>
                                <th>{{ t('systemInfo.colSize') }}</th>
                                <th>{{ t('systemInfo.colModified') }}</th>
                                <th>{{ t('systemInfo.colDigest') }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="model in systemStore.infoModels" :key="model.name">
                                <td class="text-body-2">{{ model.name }}</td>
                                <td class="text-caption">
                                    {{ formatModelSize(model.size ?? null) }}
                                </td>
                                <td class="text-caption">
                                    {{ formatDate(model.modifiedAt ?? null) }}
                                </td>
                                <td class="text-caption text-grey">
                                    {{
                                        model.digest
                                            ? model.digest.slice(0, 12) + '\u2026'
                                            : '\u2014'
                                    }}
                                </td>
                            </tr>
                        </tbody>
                    </v-table>
                </v-card>
            </v-col>

            <!-- API Reference -->
            <v-col cols="12">
                <v-card>
                    <v-card-title class="d-flex align-center">
                        <v-icon start>mdi-api</v-icon>
                        {{ t('systemInfo.apiReference') }}
                        <v-chip v-if="systemStore.help" class="ml-2" size="small" color="info">
                            {{
                                t('systemInfo.endpointCount', {
                                    n: systemStore.help.data?.endpointCount
                                })
                            }}
                        </v-chip>
                        <v-spacer />
                        <v-btn
                            icon
                            size="small"
                            variant="text"
                            :loading="systemStore.helpLoading"
                            @click="systemStore.fetchHelp()"
                        >
                            <v-icon>mdi-refresh</v-icon>
                        </v-btn>
                    </v-card-title>
                    <v-card-subtitle>{{ t('systemInfo.apiReferenceSubtitle') }}</v-card-subtitle>
                    <v-card-text v-if="!systemStore.help" class="text-grey">
                        {{ t('systemInfo.apiNotLoaded') }}
                    </v-card-text>
                    <v-card-text v-else>
                        <p class="text-body-2 mb-4">{{ systemStore.help.data?.description }}</p>
                        <v-expansion-panels>
                            <v-expansion-panel
                                v-for="ep in systemStore.help.data?.endpoints"
                                :key="(ep.method ?? '') + (ep.path ?? '')"
                            >
                                <v-expansion-panel-title>
                                    <div class="d-flex align-center ga-2">
                                        <v-chip
                                            :color="methodColor(ep.method ?? '')"
                                            size="x-small"
                                            label
                                        >
                                            {{ ep.method }}
                                        </v-chip>
                                        <code class="text-caption">{{ ep.path }}</code>
                                        <span class="text-caption text-grey ml-2">
                                            {{ ep.summary }}
                                        </span>
                                    </div>
                                </v-expansion-panel-title>
                                <v-expansion-panel-text>
                                    <v-table
                                        v-if="(ep.params?.length ?? 0) > 0"
                                        density="compact"
                                        class="text-caption"
                                    >
                                        <thead>
                                            <tr>
                                                <th>{{ t('systemInfo.colName') }}</th>
                                                <th>{{ t('systemInfo.colModel') }}</th>
                                                <th>{{ t('systemInfo.colRequired') }}</th>
                                                <th>{{ t('systemInfo.colDescription') }}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="param in ep.params ?? []" :key="param.name">
                                                <td>
                                                    <code>{{ param.name }}</code>
                                                </td>
                                                <td>{{ param.type }}</td>
                                                <td>
                                                    <v-icon
                                                        :color="param.required ? 'success' : 'grey'"
                                                        size="small"
                                                    >
                                                        {{
                                                            param.required
                                                                ? 'mdi-check'
                                                                : 'mdi-minus'
                                                        }}
                                                    </v-icon>
                                                </td>
                                                <td>{{ param.description }}</td>
                                            </tr>
                                        </tbody>
                                    </v-table>
                                    <p v-else class="text-caption text-grey">
                                        {{ t('systemInfo.noParameters') }}
                                    </p>
                                </v-expansion-panel-text>
                            </v-expansion-panel>
                        </v-expansion-panels>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSystemStore } from '@/stores/system';
import { formatModelSize } from '@/utils/formatting';

const { t } = useI18n();
const systemStore = useSystemStore();

onMounted(() => {
    systemStore.fetchModes();
    systemStore.fetchInfoModels();
    systemStore.fetchHelp();
});

function formatDate(iso: string | null): string {
    if (!iso) return '\u2014';
    return new Date(iso).toLocaleDateString();
}

function methodColor(method: string): string {
    const colors: Record<string, string> = {
        GET: 'success',
        POST: 'primary',
        PUT: 'warning',
        PATCH: 'info',
        DELETE: 'error'
    };
    return colors[method.toUpperCase()] ?? 'grey';
}
</script>
