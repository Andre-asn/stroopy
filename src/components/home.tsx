import { useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import ScrollingBackground from './scrollingBackground';

const HomePage = () => {
    const navigate = useNavigate();
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

    const handleStart = () => {
        // Navigate to game route with state indicating immediate start
        navigate('/game', { state: { autoStart: true } });
    };

    return (
        <div className="relative overflow-hidden min-h-screen flex flex-col items-center justify-center bg-black">
            <ScrollingBackground />

            <h1
                className="bg-black text-6xl font-bold z-10 mt-8 mb-8 p-4"
                style={{ color: titleColor, transition: "color 3s ease" }}
            >
                Stroopy
            </h1>
            <Button
                className="z-10 text-xl bg-white text-black hover:border-green-700 hover:bg-green-700"
                size="lg"
                onClick={handleStart}
            >
                Start
            </Button>
        </div>
    );
};

export default HomePage; 