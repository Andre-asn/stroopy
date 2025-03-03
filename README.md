# Stroopy - Multiplayer Stroop Effect Game

A real-time multiplayer game based on the Stroop Effect, built with React, TypeScript, and Socket.IO.

## Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and update the environment variables:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm run dev
   ```

## Deployment

### Frontend (Vercel)
1. Create a new project on Vercel
2. Connect your repository
3. Add the following environment variables in Vercel:
   - `VITE_PROD_SERVER_URL`: Your production backend URL

### Backend
1. Deploy the backend to a hosting service (Render, Railway, etc.)
2. Update the CORS configuration in `backend/src/server.ts` with your Vercel domain
3. Set the production URL in your frontend environment variables

## Tech Stack

- Frontend:
  - React
  - TypeScript
  - Vite
  - TailwindCSS
  - Socket.IO Client

- Backend:
  - Node.js
  - Express
  - Socket.IO
  - TypeScript
