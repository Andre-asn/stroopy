import React, { useMemo } from 'react';

const ScrollingBackground = React.memo(() => {
    const Words = [
        "White", "Black", "Red", "Green", "Blue", 
        "Yellow", "Orange", "Purple", "Brown", 
        "Pink", "Grey", "Cyan"
    ];

    const rows = useMemo(() => {
        const getShuffledWords = () => {
            return [...Words].sort(() => Math.random() - 0.5);
        };

        const rows = [];
        const numberOfRows = 13;
        
        for (let i = 0; i < numberOfRows; i++) {
            const isReverse = i % 2 === 0;
            const verticalPosition = `${(i * 8)}vh`;
            const rowWords = getShuffledWords();
            
            rows.push(
                <div 
                    key={`row-${i}`}
                    className="absolute w-full overflow-hidden"
                    style={{ top: verticalPosition }}
                >
                    <div className={`flex whitespace-nowrap ${isReverse ? 'animate-scroll' : 'animate-scrollReverse'}`}>
                        {[...rowWords, ...rowWords, ...rowWords, ...rowWords].map((word, index) => (
                            <span
                                key={`${i}-${index}`}
                                className="select-none mx-8 text-4xl font-semibold text-white opacity-50"
                            >
                                {word}
                            </span>
                        ))}
                    </div>
                </div>
            );
        }
        return rows;
    }, []); 

    return (
        <div className="absolute inset-0 overflow-hidden">
            {rows}
        </div>
    );
});

export default ScrollingBackground;