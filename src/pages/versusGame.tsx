import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { COLORS } from '../utils/gameLogic';
import GameBackground from '../utils/gameBackground';
import { Button } from "../components/ui/button";
import { io, Socket } from 'socket.io-client';
import { getSocketUrl } from '../utils/socket';

interface GameState {
    targetWord: string;
    targetColor: string;
    buttonStates: Array<{ word: string; color: string } | null>;
}

interface TugOfWar {
    squares: Array<'host' | 'guest'>;
    hostColor: string;
    guestColor: string;
}

interface RoundFeedback {
    type: 'correct' | 'incorrect' | 'too_slow';
    message: string;
}

const VersusGame = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { roomCode, isHost } = location.state || {};

    const [socket, setSocket] = useState<Socket | null>(null);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [tugOfWar, setTugOfWar] = useState<TugOfWar>({
        squares: [...Array(7).fill('host'), ...Array(7).fill('guest')],
        hostColor: 'green',
        guestColor: 'red'
    });
    const [roundResult, setRoundResult] = useState<string | null>(null);
    const [isRoundActive, setIsRoundActive] = useState(true);
    
    // Feedback states
    const [showingFeedback, setShowingFeedback] = useState(false);
    const [feedbackType, setFeedbackType] = useState<'correct' | 'incorrect' | null>(null);
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

    // Connect to socket
    useEffect(() => {
        console.log('Connecting to game with room code:', roomCode);
        const newSocket = io(getSocketUrl(), {
            transports: ['websocket'],
            timeout: 10000,
            reconnection: true,
            reconnectionAttempts: 3,
            query: { isHost: isHost ? 'true' : 'false' }
        });

        newSocket.on('connect', () => {
            console.log('Socket connected, joining game room:', roomCode);
            setSocket(newSocket);
            newSocket.emit('joinGame', { roomCode });
        });

        newSocket.on('connect_error', (error) => {
            console.error('Connection error:', error);
        });

        return () => {
            if (newSocket) {
                console.log('Cleaning up game socket');
                newSocket.close();
            }
        };
    }, [roomCode, isHost]);

    // Socket event handlers
    useEffect(() => {
        if (!socket) return;

        socket.on('roundStart', (newGameState: GameState) => {
            console.log('Round starting with state:', newGameState);
            setGameState(newGameState);
            setRoundResult(null);
            setIsRoundActive(true);
            // Reset feedback
            setShowingFeedback(false);
            setFeedbackType(null);
            setFeedbackMessage(null);
        });

        // Handle feedback
        socket.on('roundFeedback', (feedback: RoundFeedback) => {
            console.log('Received feedback:', feedback);
            setShowingFeedback(true);
            setFeedbackMessage(feedback.message);
            
            if (feedback.type === 'correct') {
                setFeedbackType('correct');
            } else {
                setFeedbackType('incorrect');
            }
            
            setIsRoundActive(false);
        });

        // Handle round results with new tug-of-war data
        socket.on('roundResult', ({ winner, tugOfWar: newTugOfWar }: { winner: string | null, tugOfWar: TugOfWar }) => {
            console.log('Round result:', { winner, tugOfWar: newTugOfWar });
            
            // Update tug-of-war state
            setTugOfWar(newTugOfWar);
            
            if (winner) {
                setRoundResult(winner === socket.id ? 'You captured a square!' : 'Opponent captured your square!');
            } else {
                setRoundResult('No squares captured this round!');
            }
        });

        // Handle game over with tug-of-war data
        socket.on('gameOver', ({ winnerId, finalTugOfWar }: { winnerId: string, finalTugOfWar: TugOfWar }) => {
            const isWinner = socket.id === winnerId;
            
            navigate('/gameOver', {
                state: {
                    gameMode: 'multiplayer',
                    isWinner,
                    finalTugOfWar,
                    roomCode,
                    isHost
                }
            });
        });

        socket.on('playerLeft', () => {
            alert('Opponent left the game');
            navigate('/versus');
        });

        return () => {
            socket.off('roundStart');
            socket.off('roundFeedback');
            socket.off('roundResult');
            socket.off('gameOver');
            socket.off('playerLeft');
        };
    }, [socket, navigate]);

    const handleBack = () => {
        if (socket) {
            socket.emit('leaveGame', { roomCode });
        }
        navigate('/versus');
    };

    const handleButtonClick = (buttonWord: string) => {
        if (!socket || !gameState || !isRoundActive || showingFeedback) return;

        console.log('Sending answer:', {
            answer: buttonWord,
            targetColor: gameState.targetColor,
            targetWord: gameState.targetWord
        });

        socket.emit('playerAnswer', {
            roomCode,
            answer: buttonWord,
            targetWord: gameState.targetWord,
            targetColor: gameState.targetColor
        });
    };

    // Helper function to get square color
    const getSquareColor = (_index: number, owner: 'host' | 'guest') => {
        if (owner === 'host') {
            return 'bg-green-500 border-green-700'; // Host color (green)
        } else {
            return 'bg-red-500 border-red-700'; // Guest color (red)
        }
    };

    // Helper function to get player territory count
    const getPlayerSquareCount = (playerType: 'host' | 'guest') => {
        return tugOfWar.squares.filter(sq => sq === playerType).length;
    };

    if (!gameState) {
        return (
            <div className="bg-gray-700 min-h-screen w-full flex flex-col items-center justify-center">
                <p className="text-white text-xl">Waiting for game to start...</p>
            </div>
        );
    }

    const mySquareCount = getPlayerSquareCount(isHost ? 'host' : 'guest');
    const opponentSquareCount = getPlayerSquareCount(isHost ? 'guest' : 'host');

    return (
        <div className="bg-gray-700 min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-8 gap-4 sm:gap-8 relative overflow-hidden">
            {/* Enhanced GameBackground with feedback support */}
            <GameBackground 
                targetWord={showingFeedback ? '' : gameState.targetWord} 
                targetColor={showingFeedback ? '#000000' : gameState.targetColor}
                showingFeedback={showingFeedback}
                feedbackType={feedbackType}
            />

            <Button
                onClick={handleBack}
                className="absolute top-2 sm:top-4 left-2 sm:left-4 z-10 bg-gray-600 hover:bg-gray-700 text-sm sm:text-base"
            >
                Leave Game
            </Button>

            {/* Updated score display with territory count */}
            <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10 bg-gray-800 px-2 sm:px-4 py-1 sm:py-2 rounded-lg flex gap-2 sm:gap-4">
                <span className="text-green-400 text-sm sm:text-xl font-mono">You: {mySquareCount}</span>
                <span className="text-red-400 text-sm sm:text-xl font-mono">Opponent: {opponentSquareCount}</span>
            </div>

            {/* Feedback message display */}
            {feedbackMessage && (
                <div className="absolute top-16 sm:top-20 right-2 sm:right-4 z-10 bg-gray-800 px-2 sm:px-4 py-1 sm:py-2 rounded-lg">
                    <span className={`text-sm sm:text-xl font-bold ${
                        feedbackType === 'correct' ? 'text-green-400' : 'text-red-400'
                    }`}>
                        {feedbackMessage}
                    </span>
                </div>
            )}

            {/* Round result (shown after feedback) */}
            {roundResult && !showingFeedback && (
                <div className="absolute top-24 sm:top-28 right-2 sm:right-4 z-10 bg-gray-800 px-2 sm:px-4 py-1 sm:py-2 rounded-lg">
                    <span className="text-white text-sm sm:text-xl">{roundResult}</span>
                </div>
            )}

            {/* Tug-of-War Score Squares */}
            <div className="flex gap-1 sm:gap-2 z-10">
                {tugOfWar.squares.map((owner, index) => (
                    <div
                        key={index}
                        className={`w-6 h-6 sm:w-8 sm:h-8 border-2 transition-colors duration-300 ${getSquareColor(index, owner)}`}
                    />
                ))}
            </div>

            {/* Enhanced button grid with feedback */}
            <div className="bg-gray-700 grid grid-cols-3 gap-2 sm:gap-4 z-10">
                {gameState.buttonStates.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => option && handleButtonClick(option.word)}
                        disabled={!isRoundActive || showingFeedback}
                        className={`aspect-square w-24 sm:w-40 border-2 hover:border-4 border-gray-200 rounded-lg transition-all duration-200 text-lg sm:text-2xl font-bold flex items-center justify-center ${
                            showingFeedback || !isRoundActive ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        style={{ 
                            color: option && !showingFeedback 
                                ? COLORS[option.color as keyof typeof COLORS] 
                                : 'transparent' 
                        }}
                    >
                        {showingFeedback ? (
                            <span className={`text-4xl sm:text-6xl font-bold ${
                                feedbackType === 'correct' ? 'text-green-400' : 'text-red-400'
                            }`}>
                                {feedbackType === 'correct' ? '✓' : '✗'}
                            </span>
                        ) : (
                            option ? option.word : ''
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default VersusGame;