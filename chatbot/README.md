# MediKiosk Patient Assistant

A patient-facing AI conversation interface for collecting medical history before a consultation.

## What is included

- React + Vite patient interface
- Express `/api/chat` server
- Local Demo Mode that does not require OpenAI credits or an API key
- Optional OpenAI Live Mode
- Browser-local conversation and structured-history persistence
- Patient message and history-field editing
- Native browser speech playback with Indian English preference when available
- Urgent-symptom safety handling

## Requirements

- Node.js 20 or newer
- pnpm 9 or newer

If pnpm is not installed, enable it with:

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

## Run in VS Code

Open this folder in VS Code, then open two integrated terminals.

### Terminal 1: start the API server

```bash
pnpm install
pnpm --filter @workspace/api-server run dev
```

### Terminal 2: start the web app

```bash
pnpm --filter @workspace/medikiosk run dev
```

Open:

```text
http://localhost:5173
```

The frontend automatically proxies `/api` requests to the API server on port `3001` during local development.

## Demo Mode

Demo Mode is the default and is free to run. It uses the built-in local conversation engine and does not send patient text to OpenAI.

## Optional OpenAI Live Mode

Only enable this if you have your own provider access and understand the associated costs. Set these variables in the shell that starts the API server:

```bash
MEDIKIOSK_MODE=live OPENAI_API_KEY=your_key_here pnpm --filter @workspace/api-server run dev
```

The application falls back to Demo Mode for common provider access, quota, billing, or invalid-key errors.

## Useful commands

```bash
# Typecheck both packages
pnpm --filter @workspace/medikiosk run typecheck
pnpm --filter @workspace/api-server run typecheck

# Build both packages
pnpm --filter @workspace/medikiosk run build
pnpm --filter @workspace/api-server run build
```

## Important note

This is a preliminary patient-history collection assistant. It is not a doctor, does not diagnose conditions, and does not replace professional medical care. Emergency symptoms should be handled through local emergency services.
