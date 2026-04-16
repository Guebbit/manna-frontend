<template>
    <div>
        <h1 class="text-h4 mb-6">System Info</h1>

        <v-row>
            <!-- Routing Modes -->
            <v-col cols="12">
                <v-card>
                    <v-card-title class="d-flex align-center">
                        <v-icon start>mdi-routes</v-icon>
                        Agent Routing Profiles
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
                    <v-card-subtitle>
                        Each profile maps to a specific Ollama model optimised for different
                        workloads. The model router automatically selects the best profile per agent
                        step, or you can force one manually in Agent / Swarm views.
                    </v-card-subtitle>
                    <v-card-text v-if="systemStore.modes.length === 0" class="text-grey">
                        No routing profiles loaded. Click refresh to fetch.
                    </v-card-text>
                    <v-table v-else density="compact">
                        <thead>
                            <tr>
                                <th>Profile</th>
                                <th>Model</th>
                                <th>Env Var</th>
                                <th>Description</th>
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
                        Ollama Models
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
                    <v-card-subtitle>
                        All models currently loaded in the local Ollama instance. These are the
                        actual LLMs available for inference.
                    </v-card-subtitle>
                    <v-card-text
                        v-if="systemStore.ollamaBaseUrl"
                        class="text-caption text-grey pb-0"
                    >
                        Ollama: {{ systemStore.ollamaBaseUrl }}
                    </v-card-text>
                    <v-card-text v-if="systemStore.infoModels.length === 0" class="text-grey">
                        No Ollama models loaded. Click refresh to fetch.
                    </v-card-text>
                    <v-table v-else density="compact">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Size</th>
                                <th>Modified</th>
                                <th>Digest</th>
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
                                    {{ model.digest ? model.digest.slice(0, 12) + '…' : '—' }}
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
                        API Reference
                        <v-chip v-if="systemStore.help" class="ml-2" size="small" color="info">
                            {{ systemStore.help.endpointCount }} endpoints
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
                    <v-card-subtitle>
                        Complete list of backend HTTP endpoints. Use this as a reference for direct
                        API integration.
                    </v-card-subtitle>
                    <v-card-text v-if="!systemStore.help" class="text-grey">
                        API reference not loaded. Click refresh to fetch.
                    </v-card-text>
                    <v-card-text v-else>
                        <p class="text-body-2 mb-4">{{ systemStore.help.description }}</p>
                        <v-expansion-panels>
                            <v-expansion-panel
                                v-for="ep in systemStore.help.endpoints"
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
                                                <th>Name</th>
                                                <th>Type</th>
                                                <th>Required</th>
                                                <th>Description</th>
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
                                    <p v-else class="text-caption text-grey">No parameters.</p>
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
import { useSystemStore } from '@/stores/system';
import { formatModelSize } from '@/utils/formatting';

const systemStore = useSystemStore();

onMounted(() => {
    systemStore.fetchModes();
    systemStore.fetchInfoModels();
    systemStore.fetchHelp();
});

function formatDate(iso: string | null): string {
    if (!iso) return '—';
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
