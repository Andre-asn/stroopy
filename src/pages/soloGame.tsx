import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { COLORS, generateNewRound, checkAnswer } from '../utils/gameLogic';
import GameBackground from '../utils/gameBackground';

const Game = () => {
    const { state } = useLocation();
    const [scoreSquares, setScoreSquares] = useState(Array(14).fill(false));
    const [targetWord, setTargetWord] = useState('');
    const [targetColor, setTargetColor] = useState<keyof typeof COLORS>('RED');
    const [buttonStates, setButtonStates] = useState<Array<{ word: string; color: string } | null>>([]);
    const [_gameStarted, setGameStarted] = useState(false);

    const startNewRound = () => {
        const { targetWord, targetColor, buttonStates } = generateNewRound();
        setTargetWord(targetWord);
        setTargetColor(targetColor as keyof typeof COLORS);
        setButtonStates(buttonStates);
    };

    const startGame = () => {
        setScoreSquares(Array(14).fill(false));
        setGameStarted(true);
        startNewRound();
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
            setGameStarted(false);
            alert(`Game Over! Play again?`);
            startGame()
        } else {
            startNewRound();
        }
    };

    useEffect(() => {
        if (state?.autoStart) {
            startGame();
        }
    }, []);

    return (
        <div className="bg-gray-700 min-h-screen w-full flex flex-col items-center justify-center p-8 gap-8 relative overflow-hidden">
            <GameBackground targetWord={targetWord} targetColor={COLORS[targetColor]} />

            <div className="flex gap-2 z-10">
                {scoreSquares.map((filled, index) => (
                    <div
                        key={index}
                        className={`w-8 h-8 border-2 ${
                            filled ? 'bg-green-900 border-black' : 'bg-transparent border-gray-300'
                        }`}
                    />
                ))}
            </div>

            <div className="bg-gray-700 grid grid-cols-3 gap-4 z-10">
                {buttonStates.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => option && handleButtonClick(option.word)}
                        className="aspect-square w-40 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-2xl font-bold"
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
