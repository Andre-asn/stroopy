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
            // Join the game room
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
        });

        socket.on('roundResult', ({ winner, scores }: { winner: string, scores: { [key: string]: number } }) => {
            console.log('Round result:', { winner, scores });
            setRoundResult(winner === socket.id ? 'You got the point!' : 'Opponent got the point!');
            
            // Update scores directly from the scores object
            if (socket.id) {
                setMyScore(scores[socket.id] || 0);
                // Get opponent's score by finding the other score in the object
                const opponentScore = Object.entries(scores).find(([id]) => id !== socket.id)?.[1] || 0;
                setOpponentScore(opponentScore);
            }
            setIsRoundActive(false);
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
        if (!socket || !gameState || !isRoundActive) return;

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
        <div className="bg-gray-700 min-h-screen w-full flex flex-col items-center justify-center p-8 gap-8 relative overflow-hidden">
            <GameBackground 
                targetWord={gameState.targetWord} 
                targetColor={gameState.targetColor} 
            />

            <Button
                onClick={handleBack}
                className="absolute top-4 left-4 z-10 bg-gray-600 hover:bg-gray-700"
            >
                Leave Game
            </Button>

            <div className="absolute top-4 right-4 z-10 bg-gray-800 px-4 py-2 rounded-lg flex gap-4">
                <span className="text-white text-xl font-mono">You: {myScore}</span>
                <span className="text-white text-xl font-mono">Opponent: {opponentScore}</span>
            </div>

            {roundResult && (
                <div className="absolute top-20 right-4 z-10 bg-gray-800 px-4 py-2 rounded-lg">
                    <span className="text-white text-xl">{roundResult}</span>
                </div>
            )}

            <div className="bg-gray-700 grid grid-cols-3 gap-4 z-10">
                {gameState.buttonStates.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => option && handleButtonClick(option.word)}
                        className="aspect-square w-40 border-2 hover:border-4 border-gray-200 rounded-lg transition-all duration-200 text-2xl font-bold"
                        style={{ color: option ? COLORS[option.color as keyof typeof COLORS] : 'transparent' }}
                        disabled={!isRoundActive}
                    >
                        {option ? option.word : ''}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default VersusGame; 