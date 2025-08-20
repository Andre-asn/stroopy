import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import MenuBackground from '../components/menuBackground';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"

const HowTo = () => {
    const navigate = useNavigate();
    const handleBack = () => {
        navigate('/');
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center p-4">
            <MenuBackground />

            <Button
                onClick={handleBack}
                className="absolute top-4 left-4 z-10 bg-gray-600 hover:bg-gray-700"
            >
                Back to Main Menu
            </Button>
            
            <Card className="justify-between flex w-full max-w-3xl bg-black z-10">
                <Tabs defaultValue="single" className="w-full">
                    <TabsList className="w-full grid grid-cols-2">
                        <TabsTrigger value="single">Single</TabsTrigger>
                        <TabsTrigger value="versus">Versus</TabsTrigger>
                    </TabsList>

                    <TabsContent value="single">
                        <CardContent className="p-6 space-y-4">
                            <h3 className="text-white text-2xl font-bold mb-4">How to play: Singleplayer</h3>
                            <p className="text-white">In a game of Stroopy, you will be shown words in the background that may or may not match their displayed color. Your objective is to...</p>

                            <div className="space-y-2 text-white">
                                <p>1. Read the word displayed in the background</p>
                                <p>2. Identify the COLOR the word is written in (! not what the word says !)</p>
                                <p>3. Select the correct color as quickly as possible</p>
                                <p>4. Be fast, be accurate, and try to beat your best times!</p>
                            </div>

                            <p className="mt-4 text-white">Be careful, incorrect choices set you back one green square!</p>

                            <div className="mt-6 flex justify-center">
                                <video 
                                    src="videos/singleplayer-demo.mkv" 
                                    className="rounded-lg shadow-lg max-w-full h-auto"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    controls={false}
                                />
                            </div>
                        </CardContent>
                    </TabsContent>

                    <TabsContent value="versus">
                        <CardContent className="p-6 space-y-4">
                            <h3 className="text-white text-2xl font-bold mb-4">How to play: Versus</h3>
                            <p className="text-white">Challenge your friends in an epic 1v1 territory battle!</p>

                            <div className="space-y-2 text-white">
                                <p className="font-bold text-yellow-400 mb-2">Setup:</p>
                                <p>1. Click "Versus" on the main menu</p>
                                <p>2. Choose to either create a new room or join an existing one</p>
                                <p>3. If creating a room, share the room code with your friend</p>
                                <p>4. If joining, enter the room code provided by your friend</p>
                                <p>5. Once both players join, click "Ready" to start the battle!</p>
                            </div>

                            <div className="mt-4 space-y-2 text-white">
                                <p className="font-bold text-yellow-400 mb-2">Tug-of-War Battle:</p>
                                <p>• You start with 7 green squares, your opponent has 7 red squares</p>
                                <p>• Each correct answer captures one of your opponent's squares</p>
                                <p>• Wrong answers eliminate you from that round - wait for your opponent!</p>
                                <p>• If your opponent is too slow, you win the round automatically</p>
                                <p>• Capture ALL 14 squares to win the match!</p>
                            </div>

                            <div className="mt-4 space-y-2 text-white">
                                <p className="font-bold text-yellow-400 mb-2">Strategy Tips:</p>
                                <p>• Speed matters - first correct answer wins the round</p>
                                <p>• Stay focused - one wrong click eliminates you from the round</p>
                                <p>• Battle happens at the center - watch the squares shift!</p>
                                <p>• Comebacks are possible until the very last square</p>
                            </div>

                            <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                                <p className="text-yellow-400 font-bold mb-2">Visual Guide:</p>
                                <div className="flex gap-1 mb-2 justify-center">
                                    <div className="w-4 h-4 bg-green-500 border border-green-700"></div>
                                    <div className="w-4 h-4 bg-green-500 border border-green-700"></div>
                                    <div className="w-4 h-4 bg-green-500 border border-green-700"></div>
                                    <div className="w-4 h-4 bg-red-500 border border-red-700"></div>
                                    <div className="w-4 h-4 bg-red-500 border border-red-700"></div>
                                </div>
                                <p className="text-white text-sm text-center">
                                    Green = Your territory, Red = Opponent's territory
                                </p>
                                <p className="text-white text-sm text-center mt-1">
                                    Battle starts at the center and expands outward!
                                </p>
                            </div>

                            <div className="mt-6 flex justify-center">
                                <video 
                                    src="videos/versus-demo.mkv" 
                                    className="rounded-lg shadow-lg max-w-full h-auto"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    controls={false}
                                />
                            </div>
                        </CardContent>
                    </TabsContent>
                </Tabs>
            </Card>
        </div>
    );
};

export default HowTo;