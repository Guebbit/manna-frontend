# Manna Vue Frontend — Blueprint for Claude Opus

> **Purpose**: This document is a machine-oriented specification for an AI coding
> assistant (Claude Opus 4.6) to build a Vue 3 frontend that fully exercises
> every capability of the Manna backend API.
>
> **How to use**: Give Claude this file + the `openapi.yaml` + your Vue
> boilerplate project. Tell Claude: "Read these files, then build the frontend."
>
> **Version**: 1.1 — updated 2026-04-13 to reflect PR #28 (OpenAI compat, merged),
> PR #29 (upload endpoints, merged), and PR #26 (generate_diagram tool, merged).
> PR #19 (sketch endpoints) is still pending merge.

---

## 1. System Context

**Manna** is a local-first AI agent platform. It runs at `http://localhost:3001`.
It has no authentication — it's a personal tool on a local network.

The API has **six endpoint groups** (12 live endpoints + 2 pending):

| Group             | Endpoints                                                                             | Nature                                              | Status              |
| ----------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------- | ------------------- |
| **Agent**         | `POST /run`                                                                           | Multi-step agentic loop with tools, memory, routing | ✅ Live             |
| **IDE**           | `POST /autocomplete`, `POST /lint-conventions`, `POST /page-review`                   | Single LLM call, no agent loop                      | ✅ Live             |
| **Upload**        | `POST /upload/image-classify`, `POST /upload/speech-to-text`, `POST /upload/read-pdf` | Multipart file upload → tool execution              | ✅ Live (new)       |
| **Sketch**        | `POST /ink`, `POST /ink-and-color`                                                    | Multipart image upload → vision model               | ⏳ PR #19 pending   |
| **OpenAI Compat** | `GET /v1/models`, `POST /v1/chat/completions`                                         | Adapter layer (temporary, for Open WebUI)           | ✅ Live (temporary) |
| **System**        | `GET /health`                                                                         | Liveness check                                      | ✅ Live             |

The frontend should provide a UI for ALL of these. The `openapi.yaml` file
contains the complete schema for every request/response.

---

## 2. Tech Stack Requirements

| Layer      | Choice                                                            | Notes                                                     |
| ---------- | ----------------------------------------------------------------- | --------------------------------------------------------- |
| Framework  | **Vue 3** (Composition API, `<script setup>`)                     | No Options API                                            |
| State      | **Pinia**                                                         | One store per domain (agent, ide, upload, sketch, system) |
| Router     | **Vue Router 4**                                                  | Hash mode is fine for local use                           |
| HTTP       | **Axios** or **ofetch**                                           | Wrap in a composable; base URL from env                   |
| Styling    | Your choice (Tailwind, UnoCSS, or whatever is in the boilerplate) | Responsive, dark mode preferred                           |
| TypeScript | **Strict mode**                                                   | Generate types from the OpenAPI spec schemas              |
| SSE        | Native `EventSource` or `fetch` + `ReadableStream`                | For streaming chat completions                            |

---

## 3. Configuration

```typescript
// src/config.ts
export const MANNA_BASE_URL = import.meta.env.VITE_MANNA_URL ?? 'http://localhost:3001';
```

The user sets `VITE_MANNA_URL` in their `.env` if Manna is on a different host/port.

---

## 4. API Client Layer

Create `src/api/manna.ts` — a thin typed client wrapping every endpoint.

### 4.1 Agent

```typescript
// POST /run
async function runTask(params: {
    task: string;
    allowWrite?: boolean;
    profile?: 'fast' | 'reasoning' | 'code' | 'default';
}): Promise<{ result: string }>;

// POST /v1/chat/completions (streaming)
function streamChat(params: {
    model: string; // manna | manna-fast | manna-reasoning | manna-code
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    allowWrite?: boolean;
}): AsyncIterable<string>; // yields content deltas

// POST /v1/chat/completions (non-streaming)
async function chatCompletion(params: {
    model: string;
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    allowWrite?: boolean;
}): Promise<OpenAiChatCompletionResponse>;

// GET /v1/models
async function listModels(): Promise<OpenAiModelListResponse>;
```

### 4.2 IDE

```typescript
// POST /autocomplete
async function autocomplete(params: {
    prefix: string;
    suffix?: string;
    language?: string;
}): Promise<AutocompleteResponse>;

// POST /lint-conventions
async function lintConventions(params: {
    content: string;
    language?: string;
    filePath?: string;
    includeLlm?: boolean;
    model?: string;
    maxFindings?: number;
}): Promise<LintConventionsResponse>;

// POST /page-review
async function pageReview(params: {
    content: string;
    language?: string;
    filePath?: string;
    projectContext?: string;
    model?: string;
}): Promise<PageReviewResponse>;
```

### 4.3 Upload (NEW in v1.1)

```typescript
// POST /upload/image-classify (multipart)
async function uploadImageClassify(params: {
    file: File;
    prompt?: string;
    model?: string;
}): Promise<ImageClassifyResponse>;

// POST /upload/speech-to-text (multipart)
async function uploadSpeechToText(params: {
    file: File;
    model?: string;
    language?: string;
    prompt?: string;
}): Promise<SpeechToTextResponse>;

// POST /upload/read-pdf (multipart)
async function uploadReadPdf(params: { file: File }): Promise<ReadPdfResponse>;
```

### 4.4 Sketch

```typescript
// POST /ink (multipart)
async function inkSketch(params: { image: File; model?: string }): Promise<InkResponse>;

// POST /ink-and-color (multipart)
async function inkAndColor(params: {
    image: File;
    model?: string;
    sketchState?: 'sketch' | 'inked';
}): Promise<InkAndColorResponse>;
```

### 4.5 System

```typescript
// GET /health
async function healthCheck(): Promise<HealthResponse>;
```

---

## 5. Page / View Architecture

### 5.1 Layout

```
┌──────────────────────────────────────────────────────┐
│  Sidebar (nav)              │  Main content area      │
│                             │                         │
│  🏠 Dashboard               │  <router-view />        │
│  💬 Chat                    │                         │
│  🤖 Agent Task              │                         │
│  📝 Code Tools              │                         │
│  📤 Upload & Analyze        │                         │
│  🎨 Sketch Studio           │                         │
│  ⚙️ Settings                │                         │
│                             │                         │
│  ── Status ──               │                         │
│  🟢 Manna: online           │                         │
│  📡 Models: 5 loaded        │                         │
└──────────────────────────────────────────────────────┘
```

The sidebar should:

- Show a health indicator (poll `GET /health` every 30s)
- Show loaded model count from `GET /v1/models`

### 5.2 Routes

| Route       | View                 | Primary Endpoint(s)                                                    |
| ----------- | -------------------- | ---------------------------------------------------------------------- |
| `/`         | **Dashboard**        | `GET /health`, `GET /v1/models`                                        |
| `/chat`     | **Chat**             | `POST /v1/chat/completions` (streaming)                                |
| `/agent`    | **Agent Task**       | `POST /run`                                                            |
| `/code`     | **Code Tools**       | `/autocomplete`, `/lint-conventions`, `/page-review`                   |
| `/upload`   | **Upload & Analyze** | `/upload/image-classify`, `/upload/speech-to-text`, `/upload/read-pdf` |
| `/sketch`   | **Sketch Studio**    | `/ink`, `/ink-and-color`                                               |
| `/settings` | **Settings**         | Config (base URL, defaults)                                            |

---

## 6. View Specifications

### 6.1 Dashboard (`/`)

**Purpose**: At-a-glance system status.

Components:

- **Health card** — green/red badge, last check timestamp, poll interval
- **Models card** — list all models from `GET /v1/models` with their IDs
- **Quick actions** — shortcut buttons to Chat, Agent, Code Tools, Upload, Sketch

### 6.2 Chat (`/chat`)

**Purpose**: Conversational interface that routes through the full agent loop via
the OpenAI-compat endpoint. This is the **primary interaction surface**.

Features:

- **Message list** — scrollable, auto-scroll to bottom on new message
- **User input** — textarea with Shift+Enter for newline, Enter to send
- **Model selector** — dropdown populated from `GET /v1/models` (manna, manna-agent, manna-fast, manna-reasoning, manna-code)
- **Write mode toggle** — switch or checkbox that prepends `[WRITE]` to the message or sets `allowWrite: true`
- **Streaming** — use `stream: true` in the request; display tokens as they arrive via SSE
- **Conversation history** — maintain the `messages` array in Pinia; send full history with each request so the model has context
- **New conversation** button — clears the message array
- **Loading state** — show a spinner/typing indicator while the agent is working

**SSE streaming implementation**:

```typescript
const response = await fetch(`${MANNA_BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: true, allowWrite })
});

const reader = response.body!.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') return;
        const chunk = JSON.parse(data);
        const delta = chunk.choices?.[0]?.delta?.content;
        if (delta) {
            // Append delta to the current assistant message in the store
        }
    }
}
```

### 6.3 Agent Task (`/agent`)

**Purpose**: Direct access to `POST /run` with full parameter control.
Simpler than Chat — single task in, single result out.

Features:

- **Task input** — large textarea
- **Profile selector** — dropdown: "Auto (router decides)", Fast, Reasoning, Code, Default
- **Write mode toggle** — checkbox for `allowWrite`
- **Submit button** — fires `POST /run`
- **Result display** — rendered markdown (use `markdown-it` or similar)
- **Metadata** — show latency, which profile was used (if available in response)
- **Task history** — list of recent tasks and results (stored in Pinia, not persisted)

### 6.4 Code Tools (`/code`)

**Purpose**: IDE-like tools for code analysis.

**Three tabs**:

#### Tab: Autocomplete

- **Code editor** (use Monaco Editor or CodeMirror) — split into prefix/suffix zones with a cursor line
- **Language selector** — dropdown (typescript, javascript, python, go, rust, etc.)
- **Trigger button** — calls `POST /autocomplete`
- **Result** — shows the completion inline or in a separate panel

#### Tab: Lint & Conventions

- **Code editor** — paste or type code
- **Language selector** + **File path input** (optional)
- **"Include LLM" toggle** (default true)
- **Max findings slider** (1–200, default 80)
- **Submit** → calls `POST /lint-conventions`
- **Results panel** — table of findings sortable by severity, with line/column links that highlight in the editor
- **Summary bar** — errors (red), warnings (yellow), infos (blue) counts

#### Tab: Page Review

- **Code editor** — full file content
- **Language selector** + **File path input** + **Project context textarea**
- **Submit** → calls `POST /page-review`
- **Results** — four collapsible sections (Correctness, Maintainability, Standards, Enhancements), each showing suggestion cards with priority badges (high=red, medium=yellow, low=green)

### 6.5 Upload & Analyze (`/upload`) — NEW in v1.1

**Purpose**: Upload files (images, audio, PDFs) for direct processing without
going through the agent loop. These endpoints call the underlying tools with
inline base64 data.

**Three tabs**:

#### Tab: Image Classify

- **Drop zone / file picker** — accepts any image format (max 50 MB)
- **Image preview** — show the uploaded image as a thumbnail
- **Prompt input** (optional) — custom prompt for the vision model
- **Model override** (optional text input)
- **Submit** → calls `POST /upload/image-classify` (multipart FormData: `file`, `prompt`, `model`)
- **Result** — display the `response` field as formatted text + the `model` used

#### Tab: Speech to Text

- **Drop zone / file picker** — accepts audio files (WAV, MP3, etc.; max 50 MB)
- **Audio preview** — HTML5 `<audio>` player for the uploaded file
- **Language hint** (optional) — dropdown or text input (ISO 639-1 codes: en, it, es, etc.)
- **Prompt/context** (optional) — textarea for transcription context
- **Model override** (optional)
- **Submit** → calls `POST /upload/speech-to-text` (multipart FormData: `file`, `model`, `language`, `prompt`)
- **Result** — display the `text` field with a copy button

#### Tab: Read PDF

- **Drop zone / file picker** — accepts PDF files (max 50 MB)
- **PDF info** — show filename + file size
- **Submit** → calls `POST /upload/read-pdf` (multipart FormData: `file`)
- **Result** — display `pageCount` badge + `text` content in a scrollable, copyable panel

**Multipart upload helper** (shared across all three tabs):

```typescript
async function uploadFile(
    endpoint: string,
    file: File,
    extraFields?: Record<string, string>
): Promise<unknown> {
    const form = new FormData();
    form.append('file', file);
    if (extraFields) {
        for (const [key, value] of Object.entries(extraFields)) {
            if (value) form.append(key, value);
        }
    }
    const res = await fetch(`${MANNA_BASE_URL}${endpoint}`, {
        method: 'POST',
        body: form
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error ?? res.statusText);
    }
    return res.json();
}
```

### 6.6 Sketch Studio (`/sketch`)

**Purpose**: Upload sketch images for inking and colorization.
**Note**: These endpoints are from PR #19 (pending merge). Build the UI now
so it's ready when the endpoints land. Show a "Coming soon" banner if the
endpoints return 404.

**Two modes** (toggle or tabs):

#### Mode: Ink Only

- **Drop zone / file picker** — accepts PNG, JPG, WEBP, GIF (max 10 MB)
- **Image preview** — show the uploaded sketch
- **Model override** (optional text input)
- **Submit** → calls `POST /ink` (multipart FormData: field name `image`)
- **Result** — display the `inkingDescription` as formatted text

#### Mode: Ink & Color

- **Drop zone / file picker** — same as above
- **Image preview**
- **Sketch state override** — radio buttons: "Auto-detect", "It's a sketch", "It's already inked"
- **Model override**
- **Submit** → calls `POST /ink-and-color` (field name `image`)
- **Result** — shows `detectedState` badge + `colorizationDescription`

### 6.7 Settings (`/settings`)

- **Manna API URL** — text input, saved to localStorage, defaults to `http://localhost:3001`
- **Default model profile** — dropdown (used as default in Chat and Agent views)
- **Default write mode** — toggle (dangerous, warn user)
- **Connection test** — button that calls `GET /health` and shows result

---

## 7. Pinia Stores

### `useSystemStore`

```typescript
interface SystemState {
    health: { status: string; timestamp: string } | null;
    healthLoading: boolean;
    models: OpenAiModelObject[];
    modelsLoading: boolean;
    baseUrl: string; // from localStorage or env
}
// Actions: fetchHealth(), fetchModels()
```

### `useChatStore`

```typescript
interface ChatState {
    conversations: Array<{
        id: string;
        title: string;
        messages: OpenAiChatMessage[];
        model: string;
        createdAt: string;
    }>;
    activeConversationId: string | null;
    streaming: boolean;
}
// Actions: sendMessage(), newConversation(), deleteConversation()
```

### `useAgentStore`

```typescript
interface AgentState {
    taskHistory: Array<{
        id: string;
        task: string;
        result: string;
        profile: string | null;
        allowWrite: boolean;
        timestamp: string;
    }>;
    loading: boolean;
}
// Actions: runTask()
```

### `useIdeStore`

```typescript
interface IdeState {
    autocompleteResult: AutocompleteResponse | null;
    lintResult: LintConventionsResponse | null;
    reviewResult: PageReviewResponse | null;
    loading: Record<'autocomplete' | 'lint' | 'review', boolean>;
}
```

### `useUploadStore` (NEW in v1.1)

```typescript
interface UploadState {
    imageClassifyResult: ImageClassifyResponse | null;
    speechToTextResult: SpeechToTextResponse | null;
    readPdfResult: ReadPdfResponse | null;
    loading: Record<'imageClassify' | 'speechToText' | 'readPdf', boolean>;
}
// Actions: classifyImage(), transcribeAudio(), readPdf()
```

### `useSketchStore`

```typescript
interface SketchState {
    inkResult: InkResponse | null;
    inkAndColorResult: InkAndColorResponse | null;
    loading: Record<'ink' | 'inkAndColor', boolean>;
}
```

---

## 8. Type Generation

The `openapi.yaml` file contains every schema. Generate TypeScript types from it:

```bash
npx openapi-typescript openapi.yaml -o src/api/types.ts
```

Or manually create `src/api/types.ts` matching the schemas in the OpenAPI spec.
Every API call in `src/api/manna.ts` must use these types for params and return values.

---

## 9. Error Handling

All API calls should:

1. Catch network errors → show a toast/notification: "Cannot reach Manna at {baseUrl}"
2. Handle 400s → show validation errors from the response body
3. Handle 429s → show "Rate limited. Retry in {retryAfterSeconds}s" and disable the submit button for that duration
4. Handle 500s → show the error message from the response
5. Handle timeouts → show "Request timed out" after 120s for agent calls, 10s for IDE calls
6. Handle 404s on sketch endpoints → show "Endpoint not available yet — merge PR #19 to enable"

---

## 10. UX Notes

- **Dark mode by default** — Manna is a developer tool
- **Keyboard shortcuts**: Ctrl+Enter to send in Chat and Agent views
- **Responsive but desktop-first** — this is a local dev tool, not a mobile app
- **No authentication** — Manna has no auth layer
- **Markdown rendering** — agent responses often contain code blocks, lists, etc.
  Use a markdown renderer (e.g., `markdown-it` + `highlight.js`) for all response displays
- **Copy button** — on every response/result block
- **Loading states** — every API call should show a spinner and disable the submit button
- **Empty states** — every view should have helpful placeholder text when there's no data
- **File previews** — show image thumbnails, audio players, PDF filenames before submission

---

## 11. File Structure

```
src/
├── api/
│   ├── manna.ts          — Typed API client (all endpoints)
│   ├── upload.ts         — Shared multipart upload helper
│   └── types.ts          — TypeScript types from OpenAPI spec
├── stores/
│   ├── system.ts         — useSystemStore (health, models, config)
│   ├── chat.ts           — useChatStore (conversations, streaming)
│   ├── agent.ts          — useAgentStore (task history)
│   ├── ide.ts            — useIdeStore (autocomplete, lint, review)
│   ├── upload.ts         — useUploadStore (image classify, STT, PDF)
│   └── sketch.ts         — useSketchStore (ink, ink-and-color)
├── views/
│   ├── DashboardView.vue
│   ├── ChatView.vue
│   ├── AgentView.vue
│   ├── CodeToolsView.vue
│   ├── UploadAnalyzeView.vue    — NEW
│   └── SketchStudioView.vue
│   └── SettingsView.vue
├── components/
│   ├── layout/
│   │   ├── AppSidebar.vue
│   │   └── AppLayout.vue
│   ├── chat/
│   │   ├── ChatMessageList.vue
│   │   ├── ChatMessageBubble.vue
│   │   ├── ChatInput.vue
│   │   └── ModelSelector.vue
│   ├── agent/
│   │   ├── TaskForm.vue
│   │   └── TaskResult.vue
│   ├── code/
│   │   ├── CodeEditor.vue     — wraps Monaco/CodeMirror
│   │   ├── FindingsTable.vue
│   │   └── ReviewPanel.vue
│   ├── upload/                — NEW
│   │   ├── ImageClassifyPanel.vue
│   │   ├── SpeechToTextPanel.vue
│   │   └── PdfReadPanel.vue
│   ├── sketch/
│   │   ├── ImageDropZone.vue
│   │   └── SketchResult.vue
│   └── shared/
│       ├── MarkdownRenderer.vue
│       ├── FileDropZone.vue   — reusable drop zone for all upload views
│       ├── AudioPlayer.vue    — HTML5 audio preview
│       ├── CopyButton.vue
│       ├── LoadingSpinner.vue
│       ├── HealthBadge.vue
│       └── ErrorToast.vue
├── composables/
│   ├── useApi.ts          — base HTTP wrapper with error handling
│   ├── useUpload.ts       — shared multipart FormData helper
│   ├── useStreaming.ts    — SSE streaming helper
│   └── useHealthPoll.ts   — periodic health check
├── router/
│   └── index.ts
├── config.ts
├── App.vue
└── main.ts
```

---

## 12. Key Implementation Details

### SSE Streaming (composable)

```typescript
// src/composables/useStreaming.ts
export function useStreaming() {
    const isStreaming = ref(false);

    async function* streamChatCompletion(
        baseUrl: string,
        body: OpenAiChatCompletionRequest
    ): AsyncGenerator<string> {
        isStreaming.value = true;
        try {
            const res = await fetch(`${baseUrl}/v1/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...body, stream: true })
            });

            const reader = res.body!.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';
                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    const payload = line.slice(6).trim();
                    if (payload === '[DONE]') return;
                    const chunk = JSON.parse(payload);
                    const content = chunk.choices?.[0]?.delta?.content;
                    if (content) yield content;
                }
            }
        } finally {
            isStreaming.value = false;
        }
    }

    return { isStreaming, streamChatCompletion };
}
```

### Multipart Upload (shared composable — NEW in v1.1)

```typescript
// src/composables/useUpload.ts
import { MANNA_BASE_URL } from '../config';

export async function uploadFile<T>(
    endpoint: string,
    file: File,
    fieldName: string = 'file',
    extraFields?: Record<string, string>
): Promise<T> {
    const form = new FormData();
    form.append(fieldName, file);
    if (extraFields) {
        for (const [key, value] of Object.entries(extraFields)) {
            if (value !== undefined && value !== '') form.append(key, value);
        }
    }
    const res = await fetch(`${MANNA_BASE_URL}${endpoint}`, {
        method: 'POST',
        body: form
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error ?? `HTTP ${res.status}`);
    }
    return res.json() as Promise<T>;
}

// Usage examples:
// uploadFile<ImageClassifyResponse>("/upload/image-classify", file, "file", { prompt, model })
// uploadFile<SpeechToTextResponse>("/upload/speech-to-text", file, "file", { model, language, prompt })
// uploadFile<ReadPdfResponse>("/upload/read-pdf", file)
// uploadFile<InkResponse>("/ink", file, "image", { model })          // sketch endpoint uses "image" field name
// uploadFile<InkAndColorResponse>("/ink-and-color", file, "image", { model, sketchState })
```

### Health Polling (composable)

```typescript
// src/composables/useHealthPoll.ts
export function useHealthPoll(intervalMs = 30_000) {
    const systemStore = useSystemStore();
    let timer: ReturnType<typeof setInterval>;

    onMounted(() => {
        systemStore.fetchHealth();
        timer = setInterval(() => systemStore.fetchHealth(), intervalMs);
    });
    onUnmounted(() => clearInterval(timer));
}
```

---

## 13. What NOT to Build

- **No auth** — Manna has no authentication
- **No user accounts** — single-user local tool
- **No database** — all state is in-memory (Pinia) or localStorage
- **No backend-for-frontend** — the Vue app talks directly to Manna's API
- **No file persistence for conversations** — conversations live in memory (localStorage persistence is optional/bonus)

---

## 14. Checklist for Claude

Before considering the frontend complete, verify:

- [ ] `GET /health` is polled and displayed
- [ ] `GET /v1/models` populates the model selector
- [ ] `POST /run` works with all parameters (task, profile, allowWrite)
- [ ] `POST /v1/chat/completions` works with streaming and non-streaming
- [ ] `POST /autocomplete` works with prefix/suffix/language
- [ ] `POST /lint-conventions` works with all options; findings are displayed
- [ ] `POST /page-review` works; 4 category sections render correctly
- [ ] `POST /upload/image-classify` accepts file upload + optional prompt/model
- [ ] `POST /upload/speech-to-text` accepts file upload + optional model/language/prompt
- [ ] `POST /upload/read-pdf` accepts file upload and displays pageCount + text
- [ ] `POST /ink` accepts image upload and displays result (or "coming soon" on 404)
- [ ] `POST /ink-and-color` accepts image + optional sketchState override (or "coming soon" on 404)
- [ ] Error states (network error, 400, 404, 429, 500) are handled gracefully
- [ ] SSE streaming displays tokens incrementally in the chat view
- [ ] Write mode toggle works (both `[WRITE]` prefix and `allowWrite` flag)
- [ ] Dark mode is the default
- [ ] All responses with code/markdown render properly
- [ ] Loading states on every async action
- [ ] File previews (image thumbnail, audio player, PDF info) before submission
- [ ] TypeScript strict mode — no `any` escapes

---

## 15. Changelog from v1.0

| What changed                      | Details                                                                                                                                                                                   |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Upload endpoints (NEW)**        | 3 new endpoints: `/upload/image-classify`, `/upload/speech-to-text`, `/upload/read-pdf`. New view at `/upload`, new Pinia store `useUploadStore`, new components in `components/upload/`. |
| **OpenAI compat → merged**        | Was marked "pending PR #28", now live on main. No schema changes.                                                                                                                         |
| **generate_diagram tool**         | Now in the agent's read-only tool set. No new endpoint (used via `/run`), but the agent can generate Mermaid diagrams.                                                                    |
| **Dual-input tools**              | `image_classify`, `speech_to_text`, `read_pdf` tools now accept `data` (base64) OR `path` (disk). The upload endpoints use the `data` path.                                               |
| **OpenAI chat message content**   | Now supports multipart content arrays (`text` + `image_url` parts), not just plain strings. Schema updated.                                                                               |
| **Shared FileDropZone component** | Added to component tree — reused by Upload and Sketch views.                                                                                                                              |
| **Sketch endpoints**              | Still pending merge (PR #19). Build the UI, handle 404 gracefully.                                                                                                                        |
