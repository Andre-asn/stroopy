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
    // New tug-of-war scoring system
    tugOfWar: {
      squares: Array<'host' | 'guest'>; // 14 squares, each owned by host or guest
      hostColor: string; // 'green'
      guestColor: string; // 'red'
    };
    roundCount: number; // Track how many rounds have been played
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

// Initialize a new tug-of-war game
const initializeTugOfWar = (): GameRoom['tugOfWar'] => {
    // Start with left 7 squares for host (green), right 7 for guest (red)
    const squares: Array<'host' | 'guest'> = [
      ...Array(7).fill('host'),
      ...Array(7).fill('guest')
    ];
    
    return {
      squares,
      hostColor: 'green',
      guestColor: 'red'
    };
  };

io.on('connection', (socket: Socket) => {
  console.log('A user connected', socket.id);

  // Handle room creation with new scoring
  socket.on('createRoom', ({ username }) => {
    console.log('Creating room for user:', username);
    const roomCode = generateRoomCode();
    gameRooms.set(roomCode, {
      host: username,
      hostSocket: socket.id,
      readyPlayers: new Set(),
      tugOfWar: initializeTugOfWar(), // Initialize tug-of-war scoring
      roundCount: 0, // Initialize round counter
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

  // Handle player answer with tug-of-war logic
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
    const isHost = socket.id === room.hostSocket;
  
    // Record this player's answer
    room.currentRound.playerAnswers[socket.id] = {
      answer,
      isCorrect,
      timestamp: answerTime
    };
  
    console.log('Answer recorded:', { socketId: socket.id, isCorrect, answer, isHost });
  
    if (isCorrect) {
      // Player got it right - they capture a square from the opponent
      const playerType: 'host' | 'guest' = isHost ? 'host' : 'guest';
      
      // Find the closest square owned by opponent to the center line (6|7)
      let capturedSquareIndex = -1;
      
      if (isHost) {
        // Host captures guest squares, starting from the CENTER and moving outward
        // Check index 6 first (left of center), then 7 (right of center), then alternate outward
        const searchOrder = [6, 7, 5, 8, 4, 9, 3, 10, 2, 11, 1, 12, 0, 13];
        console.log('Host looking for guest squares to capture, checking center-outward...');
        for (const index of searchOrder) {
          if (room.tugOfWar.squares[index] === 'guest') {
            capturedSquareIndex = index;
            console.log(`Found guest square at index ${index} to capture`);
            break;
          }
        }
      } else {
        // Guest captures host squares, starting from the CENTER and moving outward  
        // Check index 7 first (right of center), then 6 (left of center), then alternate outward
        const searchOrder = [7, 6, 8, 5, 9, 4, 10, 3, 11, 2, 12, 1, 13, 0];
        console.log('Guest looking for host squares to capture, checking center-outward...');
        for (const index of searchOrder) {
          if (room.tugOfWar.squares[index] === 'host') {
            capturedSquareIndex = index;
            console.log(`Found host square at index ${index} to capture`);
            break;
          }
        }
      }
      
      console.log('Current squares before capture:', room.tugOfWar.squares);
      console.log(`Player ${playerType} will capture square at index ${capturedSquareIndex}`);
  
      if (capturedSquareIndex !== -1) {
        // Capture the square
        room.tugOfWar.squares[capturedSquareIndex] = playerType;
        console.log(`Square ${capturedSquareIndex} captured by ${playerType}`);
        console.log('Squares after capture:', room.tugOfWar.squares);
        
        // Increment round count only when someone captures a square
        room.roundCount++;
      } else {
        console.log(`No squares available for ${playerType} to capture!`);
      }
  
      // Check for win condition (all squares same color) - FIXED: Check AFTER capture
      const hostSquares = room.tugOfWar.squares.filter(sq => sq === 'host').length;
      const guestSquares = room.tugOfWar.squares.filter(sq => sq === 'guest').length;
      
      console.log('Current square count:', { hostSquares, guestSquares });
  
      // Send immediate feedback to both players
      socket.emit('roundFeedback', {
        type: 'correct',
        message: 'Correct! You captured a square!'
      });
  
      // Send feedback to opponent
      const opponentSocket = socket.id === room.hostSocket ? room.guestSocket : room.hostSocket;
      if (opponentSocket) {
        io.to(opponentSocket).emit('roundFeedback', {
          type: 'too_slow',
          message: 'Too slow! Opponent captured your square.'
        });
      }
  
      // Emit round result after short delay for feedback
      setTimeout(() => {
        io.to(roomCode).emit('roundResult', {
          winner: socket.id,
          tugOfWar: room.tugOfWar
        });
  
        // Check for game winner (all squares same color)
        if (hostSquares === 14 || guestSquares === 14) {
          const winnerId = hostSquares === 14 ? room.hostSocket : room.guestSocket;
          console.log('Game over! Winner:', winnerId, 'Rounds played:', room.roundCount);
          io.to(roomCode).emit('gameOver', { 
            winnerId: winnerId,
            finalTugOfWar: room.tugOfWar,
            roundCount: room.roundCount
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
          // Opponent was correct, they should have already won
          // This case should be handled by opponent's correct answer logic
          console.log('Opponent already won this round');
        } else {
          // Both players got it wrong - no one captures squares
          setTimeout(() => {
            io.to(roomCode).emit('roundResult', {
              winner: null,
              tugOfWar: room.tugOfWar // No change to squares
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

  // Handle rematch request - FIXED: Reset tugOfWar instead of scores
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
        // Reset room state - FIXED: Reset tugOfWar and round count
        room.tugOfWar = initializeTugOfWar();
        room.roundCount = 0;
        room.rematchRequested = false;
        room.inGame = true;
        
        // Start new game
        io.to(roomCode).emit('rematchAccepted');
      }
    }
  });

  // Handle leaving game - FIXED: Remove tugOfWar references instead of scores
  socket.on('leaveGame', ({ roomCode }) => {
    const room = gameRooms.get(roomCode);
    if (!room) return;

    if (socket.id === room.guestSocket) {
      room.guest = undefined;
      room.guestSocket = undefined;
      socket.leave(roomCode);
      io.to(roomCode).emit('playerLeft');
    } else if (socket.id === room.hostSocket) {
      io.to(roomCode).emit('playerDisconnected');
      gameRooms.delete(roomCode);
    }
  });

  // Handle disconnection - FIXED: Remove scores references
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