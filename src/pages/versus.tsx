import MenuBackground from "../components/menuBackground";
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from "react"
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input"
import { io, Socket } from 'socket.io-client'

const Versus = () => {
	const navigate = useNavigate();
    const [socket, setSocket] = useState<Socket | null>(null)
	const [username, setUsername] = useState('')
	const [lobbyCode, setLobbyCode] = useState('')
	const [isHost, setIsHost] = useState(false)
	const [joinCode, setJoinCode] = useState('')
    const [opponent, setOpponent] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isReady, setIsReady] = useState(false)
    const [isConnecting, setIsConnecting] = useState(false)

    useEffect(() => {
        setIsConnecting(true)
        const newSocket = io(import.meta.env.VITE_SERVER_URL)
        
        newSocket.on('connect', () => {
            setIsConnecting(false)
            setSocket(newSocket)
        })
    
        newSocket.on('connect_error', () => {
            setError('Failed to connect to server')
            setIsConnecting(false)
        })
    
        // Just return newSocket.close() since it automatically removes all listeners
        return () => {
            newSocket.close()
        }
    }, [])

    useEffect(() => {
        if (!socket) return

        socket.on('roomCreated', ({ roomCode }) => {
            setLobbyCode(roomCode)
            setIsHost(true)
        })

        socket.on('joinError', ({ message }) => {
            setError(message)
        })

        socket.on('playerJoined', ({ host, guest, roomCode }) => {
            if (!isHost) {
                setLobbyCode(roomCode)
            }
            setOpponent(isHost ? guest : host)
            setError(null)
        })

        socket.on('gameStart', () => {
            navigate('/versusGame', {
                state: {
                    roomCode: lobbyCode,
                    isHost: isHost,
                }
            });
        });

        socket.on('playerDisconnected', () => {
            setOpponent(null);
            if (!isHost) {
                setError('Host disconnected');
                navigate('/');
            }
        });

        socket.on('playerLeft', () => {
            setOpponent(null)
            setIsReady(false)
        })

        return () => {
            socket.off('roomCreated');
            socket.off('joinError');
            socket.off('playerJoined');
            socket.off('gameStart');
            socket.off('playerDisconnected');
            socket.off('playerLeft')
        };

    }, [socket, isHost, lobbyCode, navigate])

	const handleBack = () => {
		navigate('/')
	}

  	const handleLobbyCreation = () => {
        if (username.trim() === '') {
            alert('Please enter a username')
            return
        }
        if (socket) {
            setIsHost(true)
            socket.emit('createRoom', { username })
        }
    }

    const handleJoinLobby = () => {
        if (username.trim() === '') {
            alert('Please enter a username')
            return
        }
        if (joinCode.trim() === '') {
            alert('Please enter a lobby code')
            return
        }
        
        if (socket) {
            socket.emit('joinRoom', { 
                username,
                roomCode: joinCode.toUpperCase()
            })
            setIsHost(false)
        }
    }

    const handleLeaveLobby = () => {
        if (socket && lobbyCode) {
            socket.emit('leaveRoom', { roomCode: lobbyCode })
        }
        setIsHost(false)
        setLobbyCode('')
        setOpponent(null)
        setIsReady(false)
        setError(null)
        setJoinCode('')
    }

    const handleReady = () => {
        if (!socket || !lobbyCode ) return
        setIsReady(true)
        socket.emit('playerReady', { roomCode: lobbyCode })
    }

    return (
        <>
            <div className="relative overflow-hidden min-h-screen flex flex-col items-center justify-center bg-black">
                <MenuBackground />

                <Button
                    onClick={handleBack}
                    className="absolute top-4 left-4 z-10 bg-gray-600 hover:bg-gray-700"
                >
                    Back to Main Menu
                </Button>

                <div className="z-10 bg-black/80 p-8 rounded-lg flex flex-col gap-6 w-96">
                    <h2 className="text-white text-2xl fond-bold text-center mb-4">
                        Versus Mode
                    </h2>

                    {isConnecting ? (
                        <p className="text-white text-center">Connecting to server...</p>
                    ) : (
                        <>
                            <div className="flex flex-col gap-2">
                                <label className="text-white">Username:</label>
                                <Input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter your username"
                                    className="bg-white text-black"
                                />
                            </div>

                            {(isHost || lobbyCode) ? (
                                <div className="flex flex-col gap-4">
                                    <div className="text-center">
                                        <p className="text-white mb-2">Your Lobby Code:</p>
                                        <p className="text-2xl font-bold text-yellow-400">{lobbyCode}</p>
                                        <p className="text-gray-400 text-sm mt-2">
                                            {isHost ? 'Share this code with your friend' : 'Connected to lobby'}
                                        </p>
                                    </div>

                                    {opponent && (
                                        <div className="text-center">
                                            <p className="text-white">
                                                {isHost ? 'Opponent' : 'Host'}: {opponent}
                                            </p>
                                            {isReady && <p className="text-green-500">You are ready!</p>}
                                        </div>
                                    )}

                                    <div className="text-center">
                                        {opponent && !isReady && (
                                            <Button
                                                onClick={handleReady}
                                                className="bg-blue-600 hover:bg-blue-700"
                                            >
                                                Ready
                                            </Button>
                                        )}
                                        {!isReady && opponent && (
                                            <p className="text-white mt-2">Waiting for players to ready up...</p>
                                        )}
                                    </div>

                                    <Button 
                                        onClick={handleLeaveLobby}
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        Leave Lobby
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    <Button
                                        onClick={handleLobbyCreation}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        Create Lobby
                                    </Button>

                                    <div className="flex flex-col gap-2">
                                        <Input
                                            type="text"
                                            value={joinCode}
                                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                            placeholder="Enter lobby code"
                                            className="bg-white text-black"
                                        />
                                        <Button
                                            onClick={handleJoinLobby}
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            Join Lobby
                                        </Button>
                                    </div>
                                </div>
                            )}
                            
                            {error && (
                                <div className="text-red-500 text-center mt-4">
                                    <p>{error}</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default Versus; 