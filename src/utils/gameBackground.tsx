interface GameBackgroundProps {
    targetWord: string;
    targetColor: string;
}

const GameBackground: React.FC<GameBackgroundProps> = ({ targetWord, targetColor }) => {
    const rows = [];
    const numberOfRows = 13; 
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
                        className="mx-4 text-4xl font-semibold text-opacity-20 select-none animate-pulse"
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
