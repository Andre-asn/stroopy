# Stroopy - Multiplayer Stroop Effect Game

A real-time multiplayer game based on the Stroop Effect, built with React, TypeScript, and Socket.IO. Players compete in cognitive challenges that test their ability to quickly identify colors while overcoming interference from conflicting text.

## Features

- **Real-time multiplayer gameplay** with WebSocket-powered live interactions
- **User authentication system** with Better-Auth
- **Global leaderboards** with Redis caching for performance
- **Tug-of-war scoring system** for competitive 1v1 matches
- **Single-player practice mode** for skill development
- **Responsive design** optimized for desktop and mobile

## Game Mechanics

The Stroop Test presents players with color words displayed in different colors. For example, the word "RED" might appear in blue text. Players must quickly identify the actual color of the text while ignoring the word itself. This creates cognitive interference that challenges reaction time and accuracy.

In multiplayer mode, players compete to capture territory using a 14-square tug-of-war system where correct answers advance your position toward the opponent's territory.

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
- MongoDB with Mongoose ODM
- Redis for caching and session management
- Better-Auth
- TypeScript throughout

### Infrastructure
- Frontend deployed on Vercel
- Backend deployed on Azure App Service
- Azure Cosmos DB (MongoDB API) for data persistence
- Redis for high-performance caching
