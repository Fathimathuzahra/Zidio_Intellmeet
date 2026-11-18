# IntellMeet Frontend

React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, and Zustand client for IntellMeet.

## Run locally

Requirements: Node.js 20.19 or newer and npm.

1. Start the backend in a separate terminal. For a database-free demo, set `USE_IN_MEMORY_DB=true` in `backend/.env`; see the root [README](../README.md) for backend setup.
2. Install frontend dependencies and configure the API URLs:

   ```bash
   npm install
   cp .env.example .env
   npm run dev
   ```

Vite serves the app at `http://127.0.0.1:5173`. The frontend binds to IPv4 localhost to match that URL.

## Environment

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Express API base URL, normally `http://127.0.0.1:5000/api` |
| `VITE_SOCKET_URL` | Socket.IO origin, normally `http://127.0.0.1:5000` |
| `VITE_TURN_URL` | Optional TURN server URL for restrictive networks |
| `VITE_TURN_USERNAME` | Optional TURN username |
| `VITE_TURN_CREDENTIAL` | Optional TURN credential |

Use secure, deployment-specific values for hosted environments. Browser speech recognition requires a supported browser and microphone permission; WebRTC reliability on public networks requires TURN infrastructure.

## Useful commands

```bash
npm test       # frontend unit tests
npm run lint   # ESLint
npm run build  # TypeScript project checks and production bundle
```

## Application structure

- `src/pages/` contains route-level pages for authentication, meetings, teams, tasks, analytics, profile, and legal information.
- `src/components/` contains shared UI and feature components.
- `src/router/` defines public and protected routes; route-level pages are lazy-loaded.
- `src/services/` and `src/hooks/` handle API access and reusable client behavior.
- `src/store/` contains Zustand client state; TanStack Query manages API state.
- `src/types/` contains shared TypeScript types.

Live meeting captions are captured in supported browsers, relayed to participants, and combined with chat and notes for post-meeting analysis. Provider-backed summaries require `OPENAI_API_KEY` on the backend; without it, the API explicitly identifies its transcript-based demo analysis.
