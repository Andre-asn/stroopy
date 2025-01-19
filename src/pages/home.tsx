import { useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import MenuBackground from '../components/menuBackground';

const Home = () => {
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

    const handleSingle = () => {
        navigate('/game', { state: { autoStart: true } });
    };

    const handleVersus = () => {
        navigate('/versus');
    }

    return (
        <div className="relative overflow-hidden min-h-screen flex flex-col items-center justify-center bg-black">
            <MenuBackground />

            <h1
                className="bg-black text-6xl font-bold z-10 mt-8 mb-8 p-4"
                style={{ color: titleColor, transition: "color 3s ease" }}
            >
                Stroopy
            </h1>
            <div className="inline-flex gap-4 z-10"> 
            <Button
                className="justify-between z-10 text-xl bg-white text-black hover:bg-green-700"
                size="lg"
                onClick={handleSingle}
            >
                Single
            </Button>
            <Button
                className="justify-between z-10 text-xl bg-white text-black hover:bg-orange-500"
                size="lg"
                onClick={handleVersus}
            >
                Versus
            </Button>
            </div>
        </div>
    );
};

export default Home; 