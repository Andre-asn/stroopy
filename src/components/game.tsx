// components/StroopGame.tsx
import { useState, useEffect} from 'react';
import { useLocation } from 'react-router-dom';
import { COLORS, generateNewRound, checkAnswer } from '../utils/gameLogic';

const Game = () => {
    const { state } = useLocation();
    const [score, setScore] = useState(0);
    const [targetWord, setTargetWord] = useState('');
    const [targetColor, setTargetColor] = useState<keyof typeof COLORS>('RED');
    const [buttonStates, setButtonStates] = useState<Array<{ word: string; color: string } | null>>([]);
    const [gameStarted, setGameStarted] = useState(false);

    const startNewRound = () => {
        const { targetWord, targetColor, buttonStates } = generateNewRound();
        setTargetWord(targetWord);
        setTargetColor(targetColor as keyof typeof COLORS);
        setButtonStates(buttonStates);
    };

    const startGame = () => {
        setScore(0);
        setGameStarted(true);
        startNewRound();
    };

    const handleButtonClick = (buttonWord: string) => {
        if (checkAnswer(buttonWord, targetColor)) {
            setScore(prev => prev + 1);
        }
        startNewRound();
    };

    useEffect(() => {
        if (state?.autoStart) {
            startGame();
        }
    }, []);

    return (
        <div className="bg-gray-700 min-h-screen w-full flex flex-col items-center justify-center p-8 gap-8">
            <div className="text-3xl font-bold mb-8">
                Score: {score}
            </div>
                    
            <div className="text-6xl font-bold mb-16" style={{ color: COLORS[targetColor] }}>
                {targetWord}
            </div>

            <div className="grid grid-cols-3 gap-4">
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