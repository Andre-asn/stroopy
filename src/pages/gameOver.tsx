import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "../components/ui/button";
import MenuBackground from "../components/menuBackground";
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { getSocketUrl } from '../utils/socket';

interface GameOverState {
    isWinner: boolean;
    myScore: number;
    opponentScore: number;
    roomCode: string;
    isHost: boolean;
}

const GameOver = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as GameOverState;

    useEffect(() => {
        if (!state) {
            navigate('/versus');
            return;
        }

        const socket = io(getSocketUrl(), {
            transports: ['websocket'],
            query: { isHost: state.isHost ? 'true' : 'false' }
        });

        socket.on('connect', () => {
            socket.emit('joinGameOver', { roomCode: state.roomCode });
        });

        return () => {
            socket.disconnect();
        };
    }, [state, navigate]);

    const handleBackToMenu = () => {
        navigate('/versus');
    };

    if (!state) return null;

    return (
        <div className="relative overflow-hidden min-h-screen flex flex-col items-center justify-center bg-black">
            <MenuBackground />
            
            <div className="z-10 bg-black/80 p-8 rounded-lg flex flex-col items-center gap-6 w-96">
                <h1 className="text-4xl font-bold text-white mb-4">
                    {state.isWinner ? 'Victory!' : 'Defeat!'}
                </h1>

                <div className="text-xl text-white mb-6">
                    <p>Final Score</p>
                    <p className="mt-2">You: {state.myScore}</p>
                    <p>Opponent: {state.opponentScore}</p>
                </div>

                <div className="flex flex-col gap-4 w-full">
                    <Button
                        onClick={handleBackToMenu}
                        className="w-full bg-gray-600 hover:bg-gray-700"
                    >
                        Back to Menu
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default GameOver; 