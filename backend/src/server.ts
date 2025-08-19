import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';

interface GameRoom {
    host: string;
    hostSocket: string;
    guest?: string;
    guestSocket?: string;
    readyPlayers: Set<string>;
    // Game state
    scores: {
      [key: string]: number;
    };
    currentRound?: {
      targetWord: string;
      targetColor: string;
      buttonStates: Array<{ word: string; color: string } | null>;
      playerAnswers?: {
        [socketId: string]: {
          answer: string;
          isCorrect: boolean;
          timestamp: number;
        };
      };
    };
    inGame: boolean;
    rematchRequested?: boolean;
  }

const COLORS = {
  RED: '#EF4444',
  BLUE: '#3B82F6',
  GREEN: '#22C55E',
  YELLOW: '#EAB308',
  PURPLE: '#A855F7',
  ORANGE: '#F97316',
  WHITE: '#FFFFFF',
};

const COLOR_NAMES = Object.keys(COLORS);

const app = express();
app.use(cors());

// Add a basic route handler
app.get('/', (req, res) => {
  res.send('Stroopy game server is running!');
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://172.24.192.159:5173",
      "https://stroopy.vercel.app"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Store active game rooms
const gameRooms = new Map<string, GameRoom>();

// Generate a random room code
const generateRoomCode = (): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Generate a new round state
const generateNewRound = () => {
  const word = COLOR_NAMES[Math.floor(Math.random() * COLOR_NAMES.length)];
  let displayColor;
  do {
    displayColor = COLOR_NAMES[Math.floor(Math.random() * COLOR_NAMES.length)];
  } while (displayColor === word);

  // Keep track of used colors
  const usedColors = new Set<string>();

  // Always include the target color (displayColor) as one of the word options
  let firstOptionColor;
  do {
    firstOptionColor = COLOR_NAMES[Math.floor(Math.random() * COLOR_NAMES.length)];
  } while (firstOptionColor === displayColor); // Avoid using the target color
  usedColors.add(firstOptionColor);

  const options = [
    { word: displayColor, color: firstOptionColor }
  ];

  // Add two more random options with unique colors
  while (options.length < 3) {
    const randomWord = COLOR_NAMES[Math.floor(Math.random() * COLOR_NAMES.length)];
    if (randomWord !== displayColor && !options.some(opt => opt.word === randomWord)) {
      // Find a unique color for this option
      let randomColor;
      do {
        randomColor = COLOR_NAMES[Math.floor(Math.random() * COLOR_NAMES.length)];
      } while (usedColors.has(randomColor) || randomColor === displayColor);
      
      usedColors.add(randomColor);
      options.push({
        word: randomWord,
        color: randomColor
      });
    }
  }

  // Shuffle the options
  const shuffledOptions = options.sort(() => Math.random() - 0.5);

  // Place options randomly in the 3x3 grid
  const buttonStates = Array(9).fill(null);
  const positions = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  
  for (let i = 0; i < 3; i++) {
    const randomPosition = positions.splice(Math.floor(Math.random() * positions.length), 1)[0];
    buttonStates[randomPosition] = shuffledOptions[i];
  }

  return {
    targetWord: word,
    targetColor: displayColor,
    buttonStates
  };
};

io.on('connection', (socket: Socket) => {
  console.log('A user connected', socket.id);

  // Handle room creation
  socket.on('createRoom', ({ username }) => {
    console.log('Creating room for user:', username);
    const roomCode = generateRoomCode();
    gameRooms.set(roomCode, {
      host: username,
      hostSocket: socket.id,
      readyPlayers: new Set(),
      scores: {
        [socket.id]: 0
      },
      inGame: false
    });
    
    socket.join(roomCode);
    socket.emit('roomCreated', { roomCode });
    console.log('Room created:', roomCode);
  });

  // Handle joining room
  socket.on('joinRoom', ({ username, roomCode }) => {
    console.log('Join room attempt:', { username, roomCode });
    const room = gameRooms.get(roomCode);
    
    if (!room) {
      socket.emit('joinError', { message: 'Room not found' });
      return;
    }

    if (room.guest) {
      socket.emit('joinError', { message: 'Room is full' });
      return;
    }

    room.guest = username;
    room.guestSocket = socket.id;
    // Initialize guest's score
    room.scores = {
      [room.hostSocket]: room.scores[room.hostSocket] || 0,
      [socket.id]: 0
    };
    
    socket.join(roomCode);

    // Notify both players about the successful join
    io.to(roomCode).emit('playerJoined', {
      host: room.host,
      guest: username,
      roomCode
    });
    console.log('Player joined room:', { roomCode, username });
  });

  // Handle player ready
  socket.on('playerReady', ({ roomCode }) => {
    console.log('Player ready:', { roomCode, socketId: socket.id });
    const room = gameRooms.get(roomCode);
    if (!room) return;

    room.readyPlayers.add(socket.id);
    console.log(`Players ready in room ${roomCode}:`, room.readyPlayers.size);

    // If both players are ready, start the game
    if (room.readyPlayers.size === 2) {
        console.log('Both players ready, starting game in room:', roomCode);
        room.inGame = true;
        io.to(roomCode).emit('gameStart');
    }
  });

  // Handle joining game
  socket.on('joinGame', ({ roomCode }) => {
    console.log('Player joining game:', { roomCode, socketId: socket.id });
    const room = gameRooms.get(roomCode);
    if (!room) {
        console.log('Room not found for joinGame:', roomCode);
        return;
    }

    // Update socket IDs for reconnecting players
    if (room.hostSocket !== socket.id && room.guestSocket !== socket.id) {
        if (socket.handshake.query.isHost === 'true') {
            room.hostSocket = socket.id;
        } else {
            room.guestSocket = socket.id;
        }
    }

    socket.join(roomCode);

    // Start new round if both players are in the game
    if (room.hostSocket && room.guestSocket) {
        console.log('Starting new round in room:', roomCode);
        const newRound = generateNewRound();
        room.currentRound = newRound;
        io.to(roomCode).emit('roundStart', newRound);
    } else {
        console.log('Waiting for both players to join game:', { 
            hasHost: !!room.hostSocket, 
            hasGuest: !!room.guestSocket 
        });
    }
  });

  // Handle player answer with new competitive logic
  socket.on('playerAnswer', ({ roomCode, answer, targetColor }) => {
    console.log('Received answer:', { roomCode, answer, targetColor });
    const room = gameRooms.get(roomCode);
    if (!room || !room.currentRound) return;

    // Check if this player already answered this round
    if (room.currentRound.playerAnswers && room.currentRound.playerAnswers[socket.id]) {
      console.log('Player already answered this round');
      return;
    }

    // Initialize playerAnswers if not exists
    if (!room.currentRound.playerAnswers) {
      room.currentRound.playerAnswers = {};
    }

    const isCorrect = answer.toUpperCase() === targetColor.toUpperCase();
    const answerTime = Date.now();

    // Record this player's answer
    room.currentRound.playerAnswers[socket.id] = {
      answer,
      isCorrect,
      timestamp: answerTime
    };

    console.log('Answer recorded:', { socketId: socket.id, isCorrect, answer });

    if (isCorrect) {
      // Player got it right - they win the round immediately
      room.scores[socket.id] = (room.scores[socket.id] || 0) + 1;
      
      const scores = {
        [room.hostSocket]: room.scores[room.hostSocket] || 0,
        [room.guestSocket!]: room.scores[room.guestSocket!] || 0
      };

      console.log('Correct answer - round won!', { winner: socket.id, scores });

      // Send immediate feedback to both players
      socket.emit('roundFeedback', {
        type: 'correct',
        message: 'Correct! You got the point!'
      });

      // Send feedback to opponent
      const opponentSocket = socket.id === room.hostSocket ? room.guestSocket : room.hostSocket;
      if (opponentSocket) {
        io.to(opponentSocket).emit('roundFeedback', {
          type: 'too_slow',
          message: 'Too slow! Opponent got it first.'
        });
      }

      // Emit round result after short delay for feedback
      setTimeout(() => {
        io.to(roomCode).emit('roundResult', {
          winner: socket.id,
          scores: scores
        });

        // Check for game winner
        if (room.scores[socket.id] >= 7) {
          console.log('Game over! Winner:', socket.id);
          io.to(roomCode).emit('gameOver', { 
            winnerId: socket.id,
            finalScores: scores
          });
          room.inGame = false;
          return;
        }

        // Start new round after feedback delay
        setTimeout(() => {
          const newRound = generateNewRound();
          room.currentRound = newRound;
          io.to(roomCode).emit('roundStart', newRound);
        }, 1000);
      }, 2000);

    } else {
      // Player got it wrong - show X and disable them
      console.log('Incorrect answer - player eliminated');
      
      socket.emit('roundFeedback', {
        type: 'incorrect',
        message: 'Incorrect! Wait for opponent...'
      });

      // Check if opponent has already answered
      const opponentSocket = socket.id === room.hostSocket ? room.guestSocket : room.hostSocket;
      const opponentAnswer = room.currentRound.playerAnswers[opponentSocket!];

      if (opponentAnswer) {
        // Both players have answered
        if (opponentAnswer.isCorrect) {
          // Opponent was correct, they win
          room.scores[opponentSocket!] = (room.scores[opponentSocket!] || 0) + 1;
          
          const scores = {
            [room.hostSocket]: room.scores[room.hostSocket] || 0,
            [room.guestSocket!]: room.scores[room.guestSocket!] || 0
          };

          // This should already be handled by the opponent's correct answer
          // But just in case there's a race condition
          setTimeout(() => {
            io.to(roomCode).emit('roundResult', {
              winner: opponentSocket,
              scores: scores
            });

            if (room.scores[opponentSocket!] >= 7) {
              io.to(roomCode).emit('gameOver', { 
                winnerId: opponentSocket,
                finalScores: scores
              });
              room.inGame = false;
              return;
            }

            setTimeout(() => {
              const newRound = generateNewRound();
              room.currentRound = newRound;
              io.to(roomCode).emit('roundStart', newRound);
            }, 1000);
          }, 2000);
        } else {
          // Both players got it wrong - no one gets a point
          setTimeout(() => {
            io.to(roomCode).emit('roundResult', {
              winner: null,
              scores: {
                [room.hostSocket]: room.scores[room.hostSocket] || 0,
                [room.guestSocket!]: room.scores[room.guestSocket!] || 0
              }
            });

            setTimeout(() => {
              const newRound = generateNewRound();
              room.currentRound = newRound;
              io.to(roomCode).emit('roundStart', newRound);
            }, 1000);
          }, 2000);
        }
      }
      // If opponent hasn't answered yet, just wait
    }
  });

  // Handle joining game over screen
  socket.on('joinGameOver', ({ roomCode }) => {
    console.log('Player joining game over screen:', { roomCode, socketId: socket.id });
    const room = gameRooms.get(roomCode);
    if (!room) return;
    
    socket.join(roomCode);
  });

  // Handle leaving game over screen
  socket.on('leaveGameOver', ({ roomCode }) => {
    console.log('Player leaving game over screen:', { roomCode, socketId: socket.id });
    const room = gameRooms.get(roomCode);
    if (!room) return;

    socket.leave(roomCode);
    io.to(roomCode).emit('opponentLeft');

    // Clean up the room if it was the host
    if (socket.id === room.hostSocket) {
      gameRooms.delete(roomCode);
    }
  });

  // Handle rematch request
  socket.on('requestRematch', ({ roomCode }) => {
    console.log('Rematch requested:', { roomCode, socketId: socket.id });
    const room = gameRooms.get(roomCode);
    if (!room) return;

    if (!room.rematchRequested) {
      // First player requesting rematch
      room.rematchRequested = true;
      room.readyPlayers = new Set([socket.id]);
      io.to(roomCode).emit('rematchRequested');
    } else {
      // Second player accepting rematch
      room.readyPlayers.add(socket.id);
      if (room.readyPlayers.size === 2) {
        // Reset room state
        room.scores = {
          [room.hostSocket]: 0,
          [room.guestSocket!]: 0
        };
        room.rematchRequested = false;
        room.inGame = true;
        
        // Start new game
        io.to(roomCode).emit('rematchAccepted');
      }
    }
  });

  // Handle leaving game
  socket.on('leaveGame', ({ roomCode }) => {
    const room = gameRooms.get(roomCode);
    if (!room) return;

    if (socket.id === room.guestSocket) {
      room.guest = undefined;
      room.guestSocket = undefined;
      delete room.scores[socket.id];
      socket.leave(roomCode);
      io.to(roomCode).emit('playerLeft');
    } else if (socket.id === room.hostSocket) {
      io.to(roomCode).emit('playerDisconnected');
      gameRooms.delete(roomCode);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Find and clean up any rooms where this socket was a participant
    for (const [roomCode, room] of gameRooms.entries()) {
        if (!room.inGame) {
            if (socket.id === room.hostSocket) {
                io.to(roomCode).emit('playerDisconnected');
                gameRooms.delete(roomCode);
            } else if (socket.id === room.guestSocket) {
                room.guest = undefined;
                room.guestSocket = undefined;
                delete room.scores[socket.id];
                io.to(roomCode).emit('playerLeft');
            }
        }
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 