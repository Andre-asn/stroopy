import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "../components/ui/button";
import MenuBackground from "../components/menuBackground";
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { getSocketUrl } from '../utils/socket';

interface SingleplayerState {
    gameMode: 'singleplayer';
    completionTime: number;
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

    const formatTime = (timeInSeconds: number) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = timeInSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
                
                <div className="z-10 bg-black/80 p-4 sm:p-8 rounded-lg flex flex-col items-center gap-4 sm:gap-6 w-full max-w-sm sm:max-w-md border border-red-500">
                    <h1 className="italic text-3xl sm:text-4xl font-bold text-red-400 mb-2 sm:mb-4">
                        Game Over!
                    </h1>

                    <div className="text-center text-white mb-4 sm:mb-6">
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
                            Play Again
                        </Button>
                        
                        <Button
                            onClick={handleBackToMenu}
                            className="w-full bg-gray-600 hover:bg-gray-700 text-sm sm:text-base"
                        >
                            Back to Main Menu
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Multiplayer Game Over (both old and new systems)
    const multiplayerState = state as MultiplayerState;
    
    // Helper function to get square color for display
    const getSquareColor = (owner: 'host' | 'guest', isHost: boolean) => {
        if ((owner === 'host' && isHost) || (owner === 'guest' && !isHost)) {
            return 'bg-green-500 border-green-700'; // Player's color
        } else {
            return 'bg-red-500 border-red-700'; // Opponent's color
        }
    };

    return (
        <div className="relative overflow-hidden min-h-screen flex flex-col items-center justify-center bg-black p-4">
            <MenuBackground />
            
            <div className="z-10 bg-black/80 p-4 sm:p-8 rounded-lg flex flex-col items-center gap-4 sm:gap-6 w-full max-w-sm sm:max-w-md">
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 sm:mb-4">
                    {multiplayerState.isWinner ? '🏆 Victory!' : '💔 Defeat!'}
                </h1>

                {/* Show tug-of-war result if available */}
                {multiplayerState.finalTugOfWar ? (
                    <div className="text-center text-white mb-4 sm:mb-6">
                        <p className="text-lg mb-4">Final Territory</p>
                        
                        {/* Display the final tug-of-war squares */}
                        <div className="flex gap-1 mb-4 justify-center">
                            {multiplayerState.finalTugOfWar.squares.map((owner, index) => (
                                <div
                                    key={index}
                                    className={`w-4 h-4 sm:w-6 sm:h-6 border-2 ${getSquareColor(owner, multiplayerState.isHost)}`}
                                />
                            ))}
                        </div>
                        
                        <div className="text-sm text-gray-400">
                            {multiplayerState.isWinner 
                                ? "You captured all the territory!" 
                                : "Opponent captured all the territory!"
                            }
                        </div>
                    </div>
                ) : (
                    /* Fallback to old scoring system */
                    <div className="text-lg sm:text-xl text-white mb-4 sm:mb-6">
                        <p>Final Score</p>
                        <p className="mt-2">You: {multiplayerState.myScore || 0}</p>
                        <p>Opponent: {multiplayerState.opponentScore || 0}</p>
                    </div>
                )}

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