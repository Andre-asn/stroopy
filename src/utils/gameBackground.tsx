interface GameBackgroundProps {
    targetWord: string;
    targetColor: string;
    showingFeedback?: boolean;
    feedbackType?: 'correct' | 'incorrect' | null;
}

const GameBackground: React.FC<GameBackgroundProps> = ({ 
    targetWord, 
    targetColor, 
    showingFeedback = false,
    feedbackType = null 
}) => {
    if (showingFeedback) {
        // During feedback, show two large symbols on left and right sides
        const symbol = feedbackType === 'correct' ? '✓' : '✗';
        const color = feedbackType === 'correct' ? '#22C55E' : '#EF4444';
        
        return (
            <>
                {/* Left side symbol */}
                <div
                    style={{
                        position: 'fixed',
                        left: '4rem',
                        top: '50vh',
                        marginTop: '-10rem', // Half of font size to center
                        color: color,
                        fontSize: '20rem',
                        opacity: 0.4,
                        zIndex: 0,
                        pointerEvents: 'none',
                        userSelect: 'none'
                    }}
                >
                    {symbol}
                </div>
                
                {/* Right side symbol */}
                <div
                    style={{
                        position: 'fixed',
                        right: '4rem',
                        top: '50vh',
                        marginTop: '-10rem', // Half of font size to center
                        color: color,
                        fontSize: '20rem',
                        opacity: 0.4,
                        zIndex: 0,
                        pointerEvents: 'none',
                        userSelect: 'none'
                    }}
                >
                    {symbol}
                </div>
            </>
        );
    }

    // Normal gameplay - show target words
    const rows = [];
    const numberOfRows = 15; 
    const wordsPerRow = 30; 

    for (let i = 0; i < numberOfRows; i++) {
        const verticalPosition = `${i * 8}vh`;
        const rowWords = Array(wordsPerRow).fill(targetWord); 

        rows.push(
            <div
                key={`row-${i}`}
                className="absolute w-full flex justify-center"
                style={{
                    top: verticalPosition,
                    color: targetColor, 
                }}
            >
                {rowWords.map((word, index) => (
                    <span
                        key={`${i}-${index}`}
                        className="mx-1 sm:mx-4 text-xl sm:text-4xl font-semibold text-opacity-20 select-none animate-pulse"
                    >
                        {word}
                    </span>
                ))}
            </div>
        );
    }

    return <>{rows}</>;
};

export default GameBackground;