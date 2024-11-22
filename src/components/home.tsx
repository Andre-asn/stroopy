import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";

// Separate background component
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
                                className="mx-8 text-4xl font-semibold text-white opacity-50"
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

const HomePage = () => {
    const [titleColor, setTitleColor] = useState('#FFFFFF');

    const getRandomColor = () => {
        return `#${Math.floor(Math.random()*16777215).toString(16)}`;
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setTitleColor(getRandomColor());
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative overflow-hidden min-h-screen flex flex-col items-center justify-center bg-black">
            <ScrollingBackground />

            <h1
                className="text-6xl font-bold z-10 mt-8 mb-8"
                style={{ color: titleColor, transition: "color 3s ease" }}
            >
                Stroopy
            </h1>
            <Button
                className="z-10 text-xl bg-white text-black hover:border-green-700 hover:bg-green-700"
                size="lg"
            >
                Start
            </Button>
        </div>
    );
};

export default HomePage;