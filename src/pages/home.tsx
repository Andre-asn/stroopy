import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import MenuBackground from '@/components/menuBackground';
import { useSession, authClient } from '@/lib/authClient';
import AuthModal from '@/components/AuthModal';
import Leaderboard from '@/components/Leaderboard';

const Home = () => {
    const navigate = useNavigate();
    const [titleColor, setTitleColor] = useState('#FFFFFF');
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const { data: session, isPending } = useSession();

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

    const handleLogout = async () => {
        await authClient.signOut();
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

            {/* User Authentication Section */}
            <div className="z-10 mb-4 sm:mb-6">
                {isPending ? (
                        <p className="text-gray-400 text-sm">Loading...</p>
                    ) : session ? (
                        <div className="flex items-center gap-4 text-black">
                            <span className="text-white text-sm sm:text-base">Welcome, {session.user.username}!</span>
                            <Button
                                onClick={handleLogout}
                                variant="outline"
                                size="sm"
                                className="text-xs sm:text-sm"
                            >
                                Logout
                            </Button>
                        </div>
                ) : (
                    <Button
                        onClick={() => setShowAuthModal(true)}
                        variant="outline"
                        size="sm"
                        className="text-xs sm:text-sm text-black border-white hover:bg-white hover:text-black"
                    >
                        Sign Up / Sign In
                    </Button>
                )}
            </div>
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
                <Button
                    className="justify-between z-10 text-base sm:text-xl bg-white text-black hover:bg-purple-600"
                    size="lg"
                    onClick={() => setShowLeaderboard(true)}
                >
                    🏆
                </Button>
            </div>

            <div className="absolute bottom-8 sm:bottom-14 text-center text-gray-500 text-xs z-10">
                <p>Stroopy v0.7</p>
                <p>Created by [Andre Santiago-Neyra]</p>
                <p><a href="https://github.com/Andre-asn" className="hover:text-gray-300 underline" target="_blank" rel="noopener noreferrer">GitHub</a></p>
            </div>

            <AuthModal 
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
            />

            <Leaderboard 
                isOpen={showLeaderboard}
                onClose={() => setShowLeaderboard(false)}
            />
        </div>
    );
};

export default Home; 