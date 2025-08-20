import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "../components/ui/button";
import MenuBackground from "../components/menuBackground";
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { getSocketUrl } from '../utils/socket';

interface SingleplayerState {
    gameMode: 'singleplayer';
    completionTime: number; // Now in milliseconds
    isWinner: true;
}

interface MultiplayerState {
    gameMode?: 'multiplayer';
    isWinner: boolean;
    finalTugOfWar?: {
        squares: Array<'host' | 'guest'>;
        hostColor: string;
        guestColor: string;
    };
    roundCount?: number; // New field for round tracking
    roomCode: string;
    isHost: boolean;
    // Legacy support for old scoring system
    myScore?: number;
    opponentScore?: number;
}

type GameOverState = SingleplayerState | MultiplayerState;

const GameOver = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as GameOverState;

    useEffect(() => {
        // Only handle multiplayer socket logic
        if (state && state.gameMode !== 'singleplayer') {
            const multiplayerState = state as MultiplayerState;
            if (!multiplayerState.roomCode) {
                navigate('/versus');
                return;
            }

            const socket = io(getSocketUrl(), {
                transports: ['websocket'],
                query: { isHost: multiplayerState.isHost ? 'true' : 'false' }
            });

            socket.on('connect', () => {
                socket.emit('joinGameOver', { roomCode: multiplayerState.roomCode });
            });

            return () => {
                socket.disconnect();
            };
        }
    }, [state, navigate]);

    const formatTime = (timeInMilliseconds: number) => {
        const totalSeconds = timeInMilliseconds / 1000;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60);
        const milliseconds = Math.floor((timeInMilliseconds % 1000) / 10); // Show centiseconds (2 decimal places)
        return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
    };

    const handlePlayAgain = () => {
        navigate('/game', { state: { autoStart: true } });
    };

    const handleBackToMenu = () => {
        if (state?.gameMode === 'singleplayer') {
            navigate('/');
        } else {
            navigate('/versus');
        }
    };

    // Handle case where no state is passed
    if (!state) {
        navigate('/');
        return null;
    }

    // Singleplayer Game Over
    if (state.gameMode === 'singleplayer') {
        return (
            <div className="relative overflow-hidden min-h-screen flex flex-col items-center justify-center bg-black p-4">
                <MenuBackground />
                
                <div className="z-10 bg-black/80 p-4 sm:p-8 rounded-lg flex flex-col items-center gap-4 sm:gap-6 w-full max-w-sm sm:max-w-md border border-green-500">
                    <h1 className="text-3xl sm:text-4xl font-bold text-green-400 mb-2 sm:mb-4">
                        🎉 Congratulations!
                    </h1>

                    <div className="text-center text-white mb-4 sm:mb-6">
                        <p className="text-lg sm:text-xl mb-2">Game Completed!</p>
                        <div className="text-2xl sm:text-3xl font-bold text-green-400">
                            {formatTime(state.completionTime)}
                        </div>
                        <p className="text-sm text-gray-400 mt-1">Your completion time</p>
                    </div>

                    <div className="flex flex-col gap-3 sm:gap-4 w-full">
                        <Button
                            onClick={handlePlayAgain}
                            className="w-full bg-green-600 hover:bg-green-700 text-sm sm:text-base font-bold"
                        >
                            🔄 Play Again
                        </Button>
                        
                        <Button
                            onClick={handleBackToMenu}
                            className="w-full bg-gray-600 hover:bg-gray-700 text-sm sm:text-base"
                        >
                            🏠 Back to Main Menu
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Multiplayer Game Over (simplified version)
    const multiplayerState = state as MultiplayerState;
    
    // Calculate round count from final tug-of-war state if not provided
    let roundCount = multiplayerState.roundCount;
    if (!roundCount && multiplayerState.finalTugOfWar) {
        // Count how many squares were captured (started with 7 each, winner has 14)
        const winnerSquares = multiplayerState.isWinner ? 
            (multiplayerState.isHost ? 
                multiplayerState.finalTugOfWar.squares.filter(sq => sq === 'host').length :
                multiplayerState.finalTugOfWar.squares.filter(sq => sq === 'guest').length) :
            0;
        roundCount = Math.max(winnerSquares - 7, 7); // Minimum 7 rounds needed to win
    }

    return (
        <div className="relative overflow-hidden min-h-screen flex flex-col items-center justify-center bg-black p-4">
            <MenuBackground />
            
            <div className="z-10 bg-black/80 p-4 sm:p-8 rounded-lg flex flex-col items-center gap-4 sm:gap-6 w-full max-w-sm sm:max-w-md">
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 sm:mb-4">
                    {multiplayerState.isWinner ? '🏆 Victory!' : '💔 Defeat!'}
                </h1>

                <div className="text-center text-white mb-4 sm:mb-6">
                    <p className="text-lg mb-2">
                        {multiplayerState.isWinner ? 'You won!' : 'You lost!'}
                    </p>
                    
                    {roundCount && (
                        <div className="text-2xl sm:text-3xl font-bold text-yellow-400">
                            {roundCount} rounds
                        </div>
                    )}
                    
                    <p className="text-sm text-gray-400 mt-2">
                        {multiplayerState.isWinner 
                            ? `Captured all territory in ${roundCount} rounds!`
                            : `Opponent captured all territory in ${roundCount} rounds.`
                        }
                    </p>
                </div>

                <div className="flex flex-col gap-3 sm:gap-4 w-full">
                    <Button
                        onClick={handleBackToMenu}
                        className="w-full bg-gray-600 hover:bg-gray-700 text-sm sm:text-base"
                    >
                        Back to Menu
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default GameOver;