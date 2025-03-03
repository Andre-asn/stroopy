import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import MenuBackground from '../components/menuBackground';

const Home = () => {
    const navigate = useNavigate();
    const [titleColor, setTitleColor] = useState('#FFFFFF');

    useEffect(() => {
        document.title = "Stroopy - Stroop Effect Game"
    })

    const getRandomColor = () => {
        return `#${Math.floor(Math.random()*16777215).toString(16)}`;
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setTitleColor(getRandomColor());
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const handleSingle = () => {
        navigate('/Game', { state: { autoStart: true } });
    };

    const handleVersus = () => {
        navigate('/Versus');
    }

    const handleHowTo = () => {
        navigate('/HowTo');
    }

    return (
        <div className="relative overflow-hidden min-h-screen flex flex-col items-center justify-center bg-black p-4">
            <MenuBackground />
            
            <div className="z-10 bg-black/80 p-4 sm:p-8 rounded-lg flex flex-col items-center gap-3 sm:gap-6 w-full max-w-sm sm:max-w-md">
                <h1 
                    className="text-3xl sm:text-5xl font-bold text-center mb-4 sm:mb-8 transition-colors duration-1000"
                    style={{ color: titleColor }}
                >
                    Stroopy
                </h1>

                <div className="flex flex-col gap-3 sm:gap-4 w-full">
                    <Button
                        onClick={handleSingle}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-sm sm:text-base"
                    >
                        Single Player
                    </Button>

                    <Button
                        onClick={handleVersus}
                        className="w-full bg-green-600 hover:bg-green-700 text-sm sm:text-base"
                    >
                        Versus Mode
                    </Button>

                    <Button
                        onClick={handleHowTo}
                        className="w-full bg-gray-600 hover:bg-gray-700 text-sm sm:text-base"
                    >
                        How to Play
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Home; 