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
        <div className="relative min-h-screen flex items-center justify-center">
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
                        <TabsTrigger value="versus" disabled>Versus</TabsTrigger>
                    </TabsList>

                    <TabsContent value="single">
                        <CardContent className="p-6 space-y-4">
                            <h3 className="text-white text-2xl font-bold mb-4">How to play: Singleplayer</h3>
                            <p className="text-white">In a game of Stroopy, you will be shown words in the background that may or may not match their displayed color. Your objective is to...</p>

                            <div className="space-y-2 text-white">
                                <p>1. Read the word displayed in the background</p>
                                <p>2. Identify the COLOR the word is written in (! not what the word says !)</p>
                                <p>3. Select the correct color as quickly as possible</p>
                                <p>4. Be fast, be accurate, and try to beat your best times! </p>
                            </div>

                            <p className="mt-4 text-white">Be careful, incorrect choices set you back one green square!</p>

                            <div className="mt-6 flex justify-center">
                                <video 
                                    src="src/misc/singleplayer-demo.mkv" 
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