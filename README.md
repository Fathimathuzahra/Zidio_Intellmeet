# IntellMeet - AI-Powered Enterprise Meeting & Collaboration Platform

MERN application for real-time meetings, AI summaries, smart action items, team collaboration, and productivity analytics.

## Business Value Targets

Enterprises waste thousands of hours every year in unproductive meetings. IntellMeet solves this by turning every meeting into an actionable, trackable event.

- Target 40-60% less meeting follow-up time through AI summaries and automatic action items
- Target 25-40% higher team productivity with real-time collaboration and task tracking
- Target 500-5,000 concurrent participants after deploying a production SFU/TURN and horizontally scaled signaling layer
- Target 99.95% uptime with production-grade managed infrastructure, monitoring, and operational processes

These are design goals, not measured guarantees from this repository. Validate them with production infrastructure and load/availability testing before making an SLA or capacity claim.

## Core Features

| ID | Feature | Description |
| --- | --- | --- |
| F-01 | User Authentication & Profiles | Secure signup/login with JWT, profile creation, team invitation, OAuth2 support, password hashing, role-based access (Admin, Member) |
| F-02 | Real-Time Video Meetings | WebRTC peer-to-peer video, screen sharing, recording, automatic browser-based live captions shared with meeting participants, and Socket.IO signaling. Each attendee must allow microphone access and use a browser with Speech Recognition support. Larger rooms require a production SFU/TURN deployment |
| F-03 | AI Meeting Intelligence | Ending a meeting combines live captions, chat, and shared notes for an automatic summary and action-item review. OpenAI-backed analysis is optional; without a provider key, a transparent transcript-based demo summary is used. No accuracy percentage is claimed |
| F-04 | Real-Time Chat & Collaboration | In-meeting chat, shared notes, task creation during meeting. Real-time sync across all participants |
| F-05 | Post-Meeting Dashboard | Meeting history, recordings, summaries, action items tracking. Searchable history, export options |
| F-06 | Team & Project Management | Team workspaces, project boards, task assignment. Kanban-style boards with real-time updates |
| F-07 | Analytics & Insights | Meeting frequency, productivity metrics, engagement reports. Dashboard with charts and exportable reports |

## Tech Stack

| Layer | Technology | Rationale |
| --- | --- | --- |
| Frontend | React 19 + TypeScript + Vite | Fast HMR, code-splitting, type safety |
| UI Components | Radix primitives + Tailwind CSS 3 | Modern, accessible, customizable |
| State Management | TanStack Query + Zustand | Server-state + lightweight client-state |
| Backend | Node.js + Express | Lightweight, fast, scalable |
| Database | MongoDB (with Mongoose) | Flexible schema for meetings and tasks |
| Real-Time | Socket.io + WebRTC | Bidirectional real-time communication + video |
| AI Integration | OpenAI Chat Completions (optional) | Structured meeting summaries and action item extraction |
| Cache | Optional Redis connection | Redis can be enabled as infrastructure; application caching is not currently wired |
| Authentication | JWT + bcrypt | Secure, stateless authentication |
| File Storage | Browser download for recordings | Cloud storage is not currently integrated |
| Containerization | Docker | Consistent local and hosted deployment |
| Orchestration | Kubernetes manifests | Deployment templates are provided; Helm chart and production resources are not included |
| CI/CD | GitHub Actions | Automated verification on pushes and pull requests |
| Monitoring | Health endpoint + Prometheus text metrics | Grafana/Sentry integration is not configured |

## Project Structure

```
IntellMeet/
  backend/
    config/          # Database, Redis, authentication secrets, and Passport
    controllers/     # Auth, users, meetings, teams, projects, notifications, and AI
    middleware/      # Authentication and error handling
    models/          # Mongoose data models
    routes/          # Express API routes
    sockets/         # Socket.IO meeting rooms and WebRTC signaling
    tests/           # Auth, AI, meeting-access, controller, and socket tests
    utils/           # Tokens, meeting access, and email utilities
  frontend/
    src/
      components/    # Shared and feature UI
      hooks/         # Reusable client hooks
      pages/         # Auth, dashboard, meeting, and legal routes
      router/        # Public and protected route configuration
      services/      # API clients
      store/         # Zustand state
      test/          # Frontend unit tests
      types/         # Shared TypeScript types
    vite.config.ts
  docs/               # Submission and operations guidance
  k8s/                # Kubernetes deployment templates
  docker-compose.yml
```

## Local Setup

### Prerequisites

- Node.js >= 20.19 (required by Vite 8)
- MongoDB (or use in-memory mode for demo)
- Redis is optional; the application runs without it

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

Backend runs on `http://localhost:5000`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

Frontend runs on `http://127.0.0.1:5173`.

For a local demo without a MongoDB service, set `USE_IN_MEMORY_DB=true` in the backend environment. Demo data is ephemeral and resets when the backend stops.
When both JWT secrets are left blank in this demo mode, the backend generates separate random secrets in memory; accounts and sessions reset when it restarts. For normal local or production deployments, configure two different random secrets of at least 32 characters.
To use the seeded demo accounts in in-memory mode, run `npm run seed:demo` from a second backend terminal after the API is running. The seeder connects to the active in-memory database; it no longer reports success for a temporary database that would immediately disappear.

### Vercel frontend deployment

Deploy `frontend/` as a Vercel project with build command `npm run build` and output directory `dist`. The project includes `frontend/vercel.json` for client-side route fallback. Configure these production environment variables in Vercel:

```env
VITE_API_URL=https://<your-render-service>.onrender.com/api
VITE_SOCKET_URL=https://<your-render-service>.onrender.com
```

The API and Socket.IO signaling server must run on a persistent Node.js host; Vercel serverless functions cannot maintain the app's Socket.IO service. This repository includes a Render Blueprint in `render.yaml`. Create a MongoDB Atlas database, then deploy the backend from the repository using that Blueprint. Set `MONGO_URI` to the Atlas connection string and set both `FRONTEND_URL` and `CORS_ORIGIN` to the exact Vercel origin (for example, `https://your-project.vercel.app`, with no trailing slash). The Blueprint generates distinct JWT secrets. After Render deploys, use its service URL for `VITE_API_URL` and `VITE_SOCKET_URL` in Vercel, then redeploy the frontend.

Deployment order:

1. Create a MongoDB Atlas database and allow connections from the backend host. Use a dedicated database user; do not commit its URI.
2. Create the Vercel project with `frontend/` as its root directory. Deploy once to obtain its HTTPS origin; the API URL can be added after the backend exists.
3. Create a Render Blueprint from the repository using `render.yaml`. Supply the Atlas URI and the Vercel origin for `FRONTEND_URL` and `CORS_ORIGIN`.
4. Add the Render service URL to the two Vercel variables above and redeploy.
5. Verify `/api/health`, registration/login, refresh-token behavior, and a multi-browser meeting. Configure a hosted TURN service for networks where direct WebRTC connectivity fails.

The Render Blueprint uses the free instance plan to avoid unexpected charges; free services may sleep when idle and are not an uptime or latency guarantee. Choose an always-on plan for a production deployment. OpenAI, SMTP, Google OAuth, and TURN are optional integrations and require their own provider credentials. Do not use the local demo accounts in a public deployment.

## Environment Variables

### Backend (.env)

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/intellmeet
USE_IN_MEMORY_DB=false
JWT_ACCESS_SECRET=intellmeet-local-development-only-access-secret-change-before-deploy
JWT_REFRESH_SECRET=intellmeet-local-development-only-refresh-secret-change-before-deploy
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
OPENAI_API_KEY=                  # Optional: set this for provider-backed AI summaries
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
REDIS_URL=redis://127.0.0.1:6379
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Demo Accounts

After running `npm run seed:demo` in the backend:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@intellmeet.demo` | `DemoAdmin123` |
| Member | `member@intellmeet.demo` | `DemoMember123` |

Public registration always creates a member account. Administrator access is reserved for an existing administrator; the demo seeder creates the local review administrator.

## Main Routes

| Route | Purpose |
| --- | --- |
| `/login` | Login and Google auth entry |
| `/register` | Account creation |
| `/dashboard` | Executive overview and quick actions |
| `/meetings` | Create, schedule, join, and review meetings |
| `/meeting/:roomId` | Live meeting room with WebRTC |
| `/join/:roomId` | Public invite landing page |
| `/tasks` | AI action item tracking |
| `/teams` | Team workspace management |
| `/my-teams` | My joined teams and tasks |
| `/analytics` | Productivity analytics and CSV export |
| `/profile` | Profile and settings |

## Testing

### Backend

```bash
cd backend
npm test
```

### Frontend

```bash
cd frontend
npm test
npm run lint
npm run build
```

## Deployment

### Backend

For Render, use the repository's `render.yaml` Blueprint. For other persistent Node.js hosts, deploy `backend/` with:

- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/api/health`
- Required production env vars: `NODE_ENV=production`, `MONGO_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_URL`, `CORS_ORIGIN`
- Set `FRONTEND_URL` and `CORS_ORIGIN` to the exact HTTPS frontend origin. Keep the two JWT secrets distinct and at least 32 characters long.

### Frontend

Host `frontend/` on Vercel, Netlify, or any static host.

- Build command: `npm run build`
- Output directory: `dist`
- Required production env vars: `VITE_API_URL`, `VITE_SOCKET_URL`

### Docker

```bash
docker-compose up --build
```

## Security and production readiness

- JWT access tokens and rotating refresh tokens in httpOnly cookies
- Auth rate limiting, Helmet security headers, CORS allowlisting, and environment-based secrets
- Meeting APIs and Socket.IO rooms validate meeting/team membership; participant removal and guest approval are host-only
- Socket.IO chat, captions, and notes use server-assigned participant identity rather than client-supplied sender metadata
- Guest access uses a host approval flow
- WebRTC uses browser-managed transport encryption, but the platform does not implement application-level end-to-end encryption
- Production use still requires a TURN/SFU media service, TLS, a managed database, deployment secrets, authorization/load testing, and operational monitoring

The repository is a runnable portfolio/demo application, not a certified production service. Capacity, uptime, AI quality, and security claims require independent measurement and deployment-specific validation.

## Key Technical Highlights

- **WebRTC + Socket.io**: Peer-to-peer video with server-validated realtime collaboration
- **AI Integration**: Optional OpenAI-backed meeting summaries; transparent transcript-based demo analysis without credentials
- **Event-driven Architecture**: Socket.io events for real-time collaboration
- **CI**: GitHub Actions runs frontend lint, tests, production build, and backend tests on pushes and pull requests
- **Observability**: Health checks and Prometheus-compatible process metrics; external error tracking is not configured
- **Responsive Design**: Mobile-first UI with Tailwind CSS

## License

ISC

---

Built with precision and modern engineering principles by Zidio Development. March 2026.
