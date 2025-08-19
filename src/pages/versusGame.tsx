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
    const [myScore, setMyScore] = useState(0);
    const [opponentScore, setOpponentScore] = useState(0);
    const [roundResult, setRoundResult] = useState<string | null>(null);
    const [isRoundActive, setIsRoundActive] = useState(true);
    
    // New feedback states
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

        // New feedback event handler
        socket.on('roundFeedback', (feedback: RoundFeedback) => {
            console.log('Received feedback:', feedback);
            setShowingFeedback(true);
            setFeedbackMessage(feedback.message);
            
            if (feedback.type === 'correct') {
                setFeedbackType('correct');
            } else {
                setFeedbackType('incorrect'); // Both 'incorrect' and 'too_slow' show X
            }
            
            // Disable further input
            setIsRoundActive(false);
        });

        socket.on('roundResult', ({ winner, scores }: { winner: string | null, scores: { [key: string]: number } }) => {
            console.log('Round result:', { winner, scores });
            
            if (winner) {
                setRoundResult(winner === socket.id ? 'You got the point!' : 'Opponent got the point!');
            } else {
                setRoundResult('No one got the point!');
            }
            
            // Update scores
            if (socket.id) {
                setMyScore(scores[socket.id] || 0);
                const opponentScore = Object.entries(scores).find(([id]) => id !== socket.id)?.[1] || 0;
                setOpponentScore(opponentScore);
            }
        });

        socket.on('gameOver', ({ winnerId, finalScores }: { winnerId: string, finalScores: { [key: string]: number } }) => {
            const isWinner = socket.id === winnerId;
            const myFinalScore = finalScores[socket.id!] || 0;
            const opponentFinalScore = Object.entries(finalScores).find(([id]) => id !== socket.id)?.[1] || 0;
            
            navigate('/gameOver', {
                state: {
                    isWinner,
                    myScore: myFinalScore,
                    opponentScore: opponentFinalScore,
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
            socket.off('roundFeedback'); // New cleanup
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

    if (!gameState) {
        return (
            <div className="bg-gray-700 min-h-screen w-full flex flex-col items-center justify-center">
                <p className="text-white text-xl">Waiting for game to start...</p>
            </div>
        );
    }

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

            <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10 bg-gray-800 px-2 sm:px-4 py-1 sm:py-2 rounded-lg flex gap-2 sm:gap-4">
                <span className="text-white text-sm sm:text-xl font-mono">You: {myScore}</span>
                <span className="text-white text-sm sm:text-xl font-mono">Opponent: {opponentScore}</span>
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