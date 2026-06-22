# IntellMeet - AI-Powered Enterprise Meeting & Collaboration Platform

Production-grade MERN application for real-time meetings, AI summaries, smart action items, team collaboration, and productivity analytics.

## Highlights

- Secure JWT authentication with refresh token support
- Demo workspace for public evaluation without mandatory signup
- Real-time meeting room with video/audio controls, chat, participants, sharing, and AI summary modal
- Meetings dashboard with schedule, join, invite link, summary, and status workflows
- Action item tracker with completion progress and meeting context
- Analytics dashboard with meeting KPIs, charts, CSV export, and productivity metrics
- Backend meeting APIs with MongoDB/Mongoose models and Socket.io room events
- Responsive React 19 + TypeScript + Vite + Tailwind interface

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| State/Data | Zustand, TanStack Query, Axios |
| Realtime | Socket.io, WebRTC browser APIs |
| Backend | Node.js, Express, Socket.io |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcrypt, httpOnly refresh cookies |

## Local Setup

### Frontend

```bash
cd frontend
npm run dev
npm install
```

Open `http://127.0.0.1:5173/`.

Use **Explore demo workspace** on the login page to review the app without MongoDB or a backend account.

### Backend

```bash
cd backend
npm run dev
npm install
```

Create `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/intellmeet
JWT_ACCESS_SECRET=replace-with-access-secret
JWT_REFRESH_SECRET=replace-with-refresh-secret
CORS_ORIGIN=http://localhost:5173
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Main Routes

| Route | Purpose |
| --- | --- |
| `/login` | Login, Google auth, demo workspace entry |
| `/register` | Account creation |
| `/dashboard` | Executive overview and quick actions |
| `/meetings` | Create, schedule, join, and review meetings |
| `/meeting/:roomId` | Live meeting room |
| `/join/:roomId` | Public invite landing page |
| `/tasks` | AI action item tracking |
| `/teams` | Team workspace |
| `/analytics` | Productivity analytics and CSV export |

## Verification

```bash
cd frontend
npm install
npm run build
```

Current frontend production build passes. Backend files were checked with `node --check`.

## Submission Notes

This project is aligned with the Zidio Development MERN domain brief:

- Business objective: reduce meeting follow-up time through AI summaries and action item extraction
- Core features: authentication, video meetings, chat, meeting dashboard, tasks, teams, analytics
- Production awareness: JWT security, modular API design, real-time architecture, responsive UI, demo-friendly flow
- Documentation-ready: feature tables, setup, routes, and architecture-ready structure
# intell-meet
