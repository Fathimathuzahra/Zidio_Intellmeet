# IntellMeet — Zidio Submission Guide

## Implemented system

IntellMeet is a MERN collaboration platform with JWT and refresh-token authentication, Google OAuth, role-aware team workspaces, invitations, projects and tasks, WebRTC video rooms, Socket.io chat/signalling, meeting history, action-item tracking, analytics, CSV export, and profile security controls.

After microphone access is granted, supported browsers start live speech recognition automatically. Each attendee's final captions are relayed through Socket.IO, and the host's End Meeting action saves the combined captions, chat, and shared notes before automatically requesting a summary and action items. The host can review the result before saving it to the meeting record. Speech recognition depends on browser support and microphone permission; attendees can add shared notes when captions are unavailable. With `OPENAI_API_KEY`, the backend uses the configured OpenAI model. Without a key, it clearly identifies its transcript-based demo summary rather than claiming model-generated analysis.

## Architecture

```text
React + Vite ── HTTPS / Socket.io ── Express API ── MongoDB
       │                                  │
       └──── WebRTC media (peer-to-peer) ─┴── OpenAI (optional analysis)
```

JWT protects HTTP APIs. Meeting reads and changes are restricted to the host, participants, and current team members. Refresh tokens are stored in httpOnly cookies. Authenticated Socket.io clients pass the access token during the handshake; the server verifies meeting/team access and assigns chat, caption, and note identities instead of trusting browser-supplied sender data. Guest users remain in the host-approved lobby flow, and host-only socket actions are checked against the meeting record.

Self-registration assigns the least-privileged `member` role regardless of client input. Only an authenticated administrator can promote accounts; demo administrator credentials are created by the local seed script and must never be used in a public deployment.

## Operations

- `GET /api/health` provides readiness/liveness health data.
- `GET /metrics` exposes lightweight Prometheus-compatible process metrics.
- `docker compose up --build` runs MongoDB, API, and web containers locally.
- GitHub Actions runs frontend lint/build and backend tests on push and pull request.
- `k8s/` contains scalable API and frontend templates with readiness/liveness probes and an API HPA. Configure images, TLS ingress, MongoDB, and secrets for your environment.

## Verification

```bash
cd backend && npm test
cd ../frontend && npm test && npm run lint && npm run build
```

## Deployment checklist

1. Set `MONGO_URI`, JWT secrets, CORS/frontend origins, and optionally `OPENAI_API_KEY`.
2. Build/publish the Docker images and replace placeholder image references in `k8s/`.
3. Use a managed MongoDB deployment and a TURN service for reliable production WebRTC connectivity.
4. Place Socket.io behind a sticky-session-compatible load balancer or adapter it through Redis before multi-replica realtime deployment.
5. Run load tests and security scans in the target environment before publishing capacity, latency, or availability claims.

## Evidence boundaries

The repository includes deployment templates, but it does not claim unmeasured 99.95% availability, 10k concurrent meetings, E2EE, or an accuracy percentage. Those are validated operational outcomes requiring production infrastructure, a TURN/SFU media layer, provider credentials, and documented load/security testing. The repository does not contain a published HTTPS demo URL, a recorded walkthrough, or an exported PDF report; those require deployment and presentation work outside the source tree.
