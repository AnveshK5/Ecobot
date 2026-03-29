# AI Sustainable Lifestyle Assistant

This repository contains:

- A React frontend at the repo root
- A full Express + Prisma + PostgreSQL backend in [`backend/`](/Users/anveshkasarla/Desktop/Hackathon/Ecobot/backend)
- OpenAI-powered suggestions/chat with a heuristic fallback
- Session-based authentication, protected routes, seeded demo data, weekly reports, badges, and a leaderboard

## Architecture

- Frontend: Vite + React + TypeScript
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL + Prisma
- Auth: HTTP-only session cookie + bcrypt
- AI: OpenAI Responses API with in-memory TTL caching

## Backend API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/user/profile`
- `PUT /api/user/preferences`
- `POST /api/activity/log`
- `GET /api/activity/history`
- `GET /api/activity/catalog`
- `GET /api/carbon/summary`
- `GET /api/carbon/leaderboard`
- `POST /api/ai/suggestions`
- `POST /api/ai/chat`
- `GET /api/ai/history`

## Demo Credentials

- Email: `demo@ecobot.app`
- Password: `DemoPass123!`

## Run Locally

1. Frontend env:
   Copy [`.env.example`](/Users/anveshkasarla/Desktop/Hackathon/Ecobot/.env.example) to `.env`
2. Backend env:
   Copy [`backend/.env.example`](/Users/anveshkasarla/Desktop/Hackathon/Ecobot/backend/.env.example) to `backend/.env`
3. Install frontend dependencies:
   `npm install`
4. Install backend dependencies:
   `cd backend && npm install`
5. Start PostgreSQL locally or use a free-tier hosted Postgres database
6. Generate Prisma client:
   `cd backend && npx prisma generate`
7. Apply schema:
   `cd backend && npx prisma db push`
8. Seed demo data:
   `cd backend && npm run seed`
9. Start the backend:
   `cd backend && npm run dev`
10. Start the frontend:
   `npm run dev`

The frontend runs on `http://localhost:8080` and the backend on `http://localhost:4000`.
For LAN testing on the current network, use `http://10.1.63.51:8080` for the frontend and `http://10.1.63.51:4000` for the backend.

## Free-Tier Hosting

- Backend: Render or Railway
- Database: Supabase Postgres or Railway Postgres
- Frontend: Netlify, Vercel, or Render static site

## Notes

- Tasks/reminders are still stored in frontend local storage because the original UI already depended on that feature and your requested backend schema did not include a tasks table.
- If `OPENAI_API_KEY` is omitted, the app still works using heuristic sustainability suggestions and chat fallbacks.
- A lightweight weekly report job runs on server startup and every 7 days while the server is alive.
