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

            <h1
                className="bg-black text-4xl sm:text-6xl font-bold z-10 mt-4 sm:mt-8 mb-4 sm:mb-8 p-2 sm:p-4"
                style={{ color: titleColor, transition: "color 3s ease" }}
            >
                Stroopy
            </h1>
            <div className="inline-flex gap-2 sm:gap-4 z-10"> 
                <Button
                    className="justify-between z-10 text-base sm:text-xl bg-white text-black hover:bg-green-700"
                    size="lg"
                    onClick={handleSingle}
                >
                    Single
                </Button>
                <Button
                    className="justify-between z-10 text-base sm:text-xl bg-white text-black hover:bg-orange-500"
                    size="lg"
                    onClick={handleVersus}
                >
                    Versus
                </Button>
                <Button
                    className="justify-between z-10 text-base sm:text-xl bg-white text-black hover:bg-yellow-500"
                    size="lg"
                    onClick={handleHowTo}
                >
                    ?
                </Button>
            </div>

            <div className="absolute bottom-8 sm:bottom-14 text-center text-gray-500 text-xs z-10">
                <p>Stroopy v0.4</p>
                <p>Created by [Andre Santiago-Neyra]</p>
                <p><a href="https://github.com/Andre-asn" className="hover:text-gray-300 underline" target="_blank" rel="noopener noreferrer">GitHub</a> | <a href="mailto:andresanti.asn@gmail.com" className="hover:text-gray-300 underline">Contact</a></p>
            </div>
        </div>
    );
};

export default Home; 