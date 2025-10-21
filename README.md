# Stroopy - Multiplayer Stroop Effect Game

A real-time multiplayer game based on the Stroop Effect, built with React, TypeScript, and Socket.IO. Players compete in cognitive challenges that test their ability to quickly identify colors while overcoming interference from conflicting text.

## Features

- **Real-time multiplayer gameplay** with WebSocket-powered live interactions
- **User authentication system** with Better-Auth
- **User authentication** with BetterAuth (cookie-based sessions)
- **Global leaderboards** with Upstash Redis caching for performance
- **Tug-of-war scoring system** for competitive 1v1 matches
- **Single-player practice mode** for skill development
- **Responsive design** optimized for desktop and mobile

## Game Mechanics

The Stroop Test presents players with color words displayed in different colors. For example, the word "RED" might appear in blue text. Players must quickly identify the actual color of the text while ignoring the word itself. This creates cognitive interference that challenges reaction time and accuracy.

In multiplayer mode, players compete to capture territory using a 14-square tug-of-war system where correct answers advance your position toward the opponent's territory.

## Architecture

- Real-time: Socket.IO rooms handle matchmaking and game state sync.
- Auth: BetterAuth issues HTTP-only cookies; backend validates on each request; sessions persist in MongoDB.
- Data: MongoDB Atlas stores users, sessions, matches, and leaderboards; Redis caches leaderboard pages for fast reads.

## Tech Stack

### Frontend
- React with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Socket.IO Client for real-time communication
- React Router for navigation

### Backend  
- Node.js with Express
- Socket.IO for WebSocket connections
- MongoDB Atlas with Mongoose ODM
- Upstash Redis for caching and fast leaderboard queries
- BetterAuth (cookie-based sessions; sessions persisted in MongoDB)
- TypeScript throughout

### Infrastructure
- Frontend deployed on Vercel
- MongoDB Atlas for data persistence
- Upstash Redis (serverless) for high-performance caching and leaderboard lookups
