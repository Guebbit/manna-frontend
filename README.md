# Manna Frontend

Vue 3 frontend for using Manna features from the browser.

## Requirements

- Node.js 22+
- npm
- A running `Guebbit/manna` backend (default: `http://localhost:3001`)

## Setup

```bash
npm ci
cp .env-example .env
npm run dev
```

Open `http://localhost:8080`.

## Environment

The frontend reads the backend URL in this order:

1. `localStorage` key `manna-base-url` (set from **Settings** page)
2. `VITE_MANNA_URL` at build time
3. Fallback: `http://localhost:3001`

`VITE_MANNA_URL` is the only backend URL env var used by current code.

## Main frontend features

- **Dashboard**: health + quick system overview
- **Chat**: persistent conversations/messages
- **Agent Task**: single-agent execution (`/run`, `/run/stream`)
- **Swarm**: multi-agent decomposition (`/run/swarm`, `/run/swarm/stream`)
- **Workflow**: sequential step pipelines (`/workflow`, `/workflow/stream`)
- **Code Tools**: autocomplete/lint/review endpoints
- **Upload & Analyze**: image classify, speech-to-text, PDF text extraction
- **System Info**: profiles, models, API help
- **Settings**: backend URL + local defaults

For streaming pages (Agent/Swarm/Workflow), the live timeline shows backend SSE events.  
Agent/Swarm streams include `hard_stop` handling and render it as a terminal error event.

## API contract sync

`openapi.yaml` in this repo is copied from `Guebbit/manna` and treated as source of truth.

After syncing `openapi.yaml`, regenerate the client:

```bash
npm run genapi
```

Do not edit files in `api/` manually.

## Useful scripts

- `npm run dev`
- `npm run build`
- `npm run test:unit`
- `npm run lint`
- `npm run complete:check`
- `npm run genapi`
