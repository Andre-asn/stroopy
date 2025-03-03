import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { COLORS, generateNewRound, checkAnswer } from '../utils/gameLogic';
import GameBackground from '../utils/gameBackground';
import { Button } from "../components/ui/button";

const Game = () => {
    const navigate = useNavigate();
    const { state } = useLocation();
    const [scoreSquares, setScoreSquares] = useState(Array(14).fill(false));
    const [targetWord, setTargetWord] = useState('');
    const [targetColor, setTargetColor] = useState<keyof typeof COLORS>('RED');
    const [buttonStates, setButtonStates] = useState<Array<{ word: string; color: string } | null>>([]);
    const [time, setTime] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const startNewRound = () => {
        const { targetWord, targetColor, buttonStates } = generateNewRound();
        setTargetWord(targetWord);
        setTargetColor(targetColor as keyof typeof COLORS);
        setButtonStates(buttonStates);
    };

    const startGame = () => {
        setScoreSquares(Array(14).fill(false));
        setIsActive(true);
        setTime(0);
        startNewRound();
    };

    const handleBack = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        navigate('/');
    };

    const handleButtonClick = (buttonWord: string) => {
        if (checkAnswer(buttonWord, targetColor)) {
            setScoreSquares(prev => {
                const next = [...prev];
                const index = next.indexOf(false);
                if (index !== -1) next[index] = true;
                return next;
            })
        } else {
            setScoreSquares(prev => {
                const next = [...prev];
                const index = next.lastIndexOf(true);
                if (index !== -1) next[index] = false;
                return next;
            })
        }

        if (scoreSquares.every(square => square)) {
            setIsActive(false);
            alert(`Game Over! Time: ${formatTime(time)}\nPlay again?`);
            startGame();
        } else {
            startNewRound();
        }
    };

    const formatTime = (timeInSeconds: number) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = timeInSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (state?.autoStart) {
            startGame();
        }
    }, []);

    useEffect(() => {
        if (isActive) {
            timerRef.current = setInterval(() => {
                setTime(prevTime => prevTime + 1);
            }, 1000);
        } else if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isActive]);

    return (
        <div className="bg-gray-700 min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-8 gap-4 sm:gap-8 relative overflow-hidden">
            <GameBackground targetWord={targetWord} targetColor={COLORS[targetColor]} />

            {/* Back Button */}
            <Button
                onClick={handleBack}
                className="absolute top-2 sm:top-4 left-2 sm:left-4 z-10 bg-gray-600 hover:bg-gray-700 text-sm sm:text-base"
            >
                Back to Main Menu
            </Button>

            {/* Timer */}
            <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10 bg-gray-800 px-2 sm:px-4 py-1 sm:py-2 rounded-lg">
                <span className="text-white text-sm sm:text-xl font-mono">{formatTime(time)}</span>
            </div>

            <div className="flex gap-1 sm:gap-2 z-10">
                {scoreSquares.map((filled, index) => (
                    <div
                        key={index}
                        className={`w-6 h-6 sm:w-8 sm:h-8 border-2 ${
                            filled ? 'bg-green-900 border-black' : 'bg-transparent border-gray-300'
                        }`}
                    />
                ))}
            </div>

            <div className="bg-gray-700 grid grid-cols-3 gap-2 sm:gap-4 z-10">
                {buttonStates.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => option && handleButtonClick(option.word)}
                        className="aspect-square w-24 sm:w-40 border-2 hover:border-4 border-gray-200 rounded-lg transition-all duration-200 text-lg sm:text-2xl font-bold"
                        style={{ color: option ? COLORS[option.color as keyof typeof COLORS] : 'transparent' }}
                    >
                        {option ? option.word : ''}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Game;