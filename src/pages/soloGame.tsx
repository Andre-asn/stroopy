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
    const [, setIsActive] = useState(false);
    const [showingFeedback, setShowingFeedback] = useState(false);
    const [feedbackType, setFeedbackType] = useState<'correct' | 'incorrect' | null>(null);
    const [roundStartTime, setRoundStartTime] = useState<number | null>(null);
    const [totalTime, setTotalTime] = useState(0); // Cumulative time in milliseconds
    const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const startNewRound = () => {
        const { targetWord, targetColor, buttonStates } = generateNewRound();
        setTargetWord(targetWord);
        setTargetColor(targetColor as keyof typeof COLORS);
        setButtonStates(buttonStates);
        setShowingFeedback(false);
        setFeedbackType(null);
        
        // Start timing this round
        setRoundStartTime(Date.now());
    };

    const startGame = () => {
        setScoreSquares(Array(14).fill(false));
        setIsActive(true);
        setTotalTime(0); // Reset cumulative time
        startNewRound();
    };

    const handleBack = () => {
        if (feedbackTimeoutRef.current) {
            clearTimeout(feedbackTimeoutRef.current);
        }
        navigate('/');
    };

    const addRoundTime = () => {
        if (roundStartTime) {
            const roundEndTime = Date.now();
            const roundDuration = roundEndTime - roundStartTime;
            setTotalTime(prev => prev + roundDuration);
            console.log(`Round took: ${roundDuration}ms, Total: ${totalTime + roundDuration}ms`);
        }
    };

    const showFeedback = (isCorrect: boolean, gameEnded: boolean = false) => {
        // Add the round time before showing feedback
        addRoundTime();
        
        setShowingFeedback(true);
        setFeedbackType(isCorrect ? 'correct' : 'incorrect');
        
        // Clear any existing timeout
        if (feedbackTimeoutRef.current) {
            clearTimeout(feedbackTimeoutRef.current);
        }
        
        // Show feedback for 2 seconds, then continue
        feedbackTimeoutRef.current = setTimeout(() => {
            if (!gameEnded) {
                startNewRound();
            }
        }, 2000);
    };

    const handleButtonClick = (buttonWord: string) => {
        // Don't allow clicks during feedback
        if (showingFeedback) return;
        
        const isCorrect = checkAnswer(buttonWord, targetColor);
        
        if (isCorrect) {
            // Correct answer
            setScoreSquares(prev => {
                const next = [...prev];
                const index = next.indexOf(false);
                if (index !== -1) next[index] = true;
                
                // Check win condition with the UPDATED array
                if (next.every(square => square)) {
                    // All squares filled - game won!
                    setIsActive(false);
                    showFeedback(true, true); // Show success feedback
                    
                    // Navigate to game over page after feedback
                    setTimeout(() => {
                        navigate('/gameOver', {
                            state: {
                                gameMode: 'singleplayer',
                                completionTime: totalTime, // Don't add current round - already added by addRoundTime()
                                isWinner: true
                            }
                        });
                    }, 2000);
                } else {
                    // Continue playing - show feedback then new round
                    showFeedback(true, false);
                }
                
                return next;
            });
        } else {
            // Wrong answer - move backward
            setScoreSquares(prev => {
                const next = [...prev];
                const index = next.lastIndexOf(true);
                if (index !== -1) next[index] = false;
                return next;
            });
            
            // Show feedback then new round
            showFeedback(false, false);
        }
    };

    const formatTime = (timeInMilliseconds: number) => {
        const totalSeconds = timeInMilliseconds / 1000;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60);
        const milliseconds = Math.floor((timeInMilliseconds % 1000) / 10); // Show centiseconds (2 decimal places)
        return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (state?.autoStart) {
            startGame();
        }
    }, []);

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (feedbackTimeoutRef.current) {
                clearTimeout(feedbackTimeoutRef.current);
            }
        };
    }, []);

    return (
        <div className="bg-gray-700 min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-8 gap-4 sm:gap-8 relative overflow-hidden">
            {/* Enhanced GameBackground with feedback support */}
            <GameBackground 
                targetWord={showingFeedback ? '' : targetWord} 
                targetColor={showingFeedback ? '#000000' : COLORS[targetColor]} 
                showingFeedback={showingFeedback}
                feedbackType={feedbackType}
            />

            {/* Back Button */}
            <Button
                onClick={handleBack}
                className="absolute top-2 sm:top-4 left-2 sm:left-4 z-10 bg-gray-600 hover:bg-gray-700 text-sm sm:text-base"
            >
                Back to Main Menu
            </Button>

            {/* Timer - now shows cumulative millisecond time */}
            <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10 bg-gray-800 px-2 sm:px-4 py-1 sm:py-2 rounded-lg">
                <span className="text-white text-sm sm:text-xl font-mono">{formatTime(totalTime)}</span>
            </div>

            {/* Score squares - no feedback symbols */}
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

            {/* Button grid with feedback */}
            <div className="bg-gray-700 grid grid-cols-3 gap-2 sm:gap-4 z-10">
                {buttonStates.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => option && handleButtonClick(option.word)}
                        disabled={showingFeedback}
                        className={`aspect-square w-24 sm:w-40 border-2 hover:border-4 border-gray-200 rounded-lg transition-all duration-200 text-lg sm:text-2xl font-bold flex items-center justify-center ${
                            showingFeedback ? 'opacity-50 cursor-not-allowed' : ''
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

export default Game;