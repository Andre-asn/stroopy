import MenuBackground from "../components/menuBackground";
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from "react"
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input"
import { io, Socket } from 'socket.io-client'
import { getSocketUrl } from '../utils/socket'

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
        setError(null)
        
        console.log('Attempting to connect to:', getSocketUrl())
        
        const newSocket = io(getSocketUrl(), {
            transports: ['websocket'],
            timeout: 10000,
            reconnection: true,
            reconnectionAttempts: 3
        })
        
        newSocket.on('connect', () => {
            console.log('Socket connected successfully')
            setIsConnecting(false)
            setSocket(newSocket)
            setError(null)
        })
    
        newSocket.on('connect_error', (err) => {
            console.error('Socket connection error:', err)
            setError(`Connection error: ${err.message}`)
            setIsConnecting(false)
        })

        newSocket.on('error', (err) => {
            console.error('Socket error:', err)
            setError(`Socket error: ${err.message}`)
        })
    
        return () => {
            console.log('Cleaning up socket connection')
            newSocket.close()
        }
    }, [])

    useEffect(() => {
        if (!socket) return;

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
            console.log('Game starting, navigating to game...');
            navigate('/versusGame', {
                state: {
                    roomCode: lobbyCode,
                    isHost: isHost
                }
            });
            socket.off('connect');
            socket.off('connect_error');
            socket.off('error');
            socket.off('roomCreated');
            socket.off('joinError');
            socket.off('playerJoined');
            socket.off('gameStart');
            socket.off('playerDisconnected');
            socket.off('playerLeft');
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
        if (!socket || !lobbyCode) return;
        console.log('Sending playerReady event');
        setIsReady(true);
        socket.emit('playerReady', { roomCode: lobbyCode });
    }

    return (
        <>
            <div className="relative overflow-hidden min-h-screen flex flex-col items-center justify-center bg-black p-4">
                <MenuBackground />

                <Button
                    onClick={handleBack}
                    className="absolute top-2 sm:top-4 left-2 sm:left-4 z-10 bg-gray-600 hover:bg-gray-700 text-sm sm:text-base"
                >
                    Back to Main Menu
                </Button>

                <div className="z-10 bg-black/80 p-4 sm:p-8 rounded-lg flex flex-col gap-4 sm:gap-6 w-full max-w-sm sm:max-w-md">
                    <h2 className="text-white text-xl sm:text-2xl font-bold text-center mb-2 sm:mb-4">
                        Versus Mode
                    </h2>

                    {isConnecting ? (
                        <p className="text-white text-center">Connecting to server...</p>
                    ) : (
                        <>
                            <div className="flex flex-col gap-2">
                                <label className="text-white text-sm sm:text-base">Username:</label>
                                <Input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter your username"
                                    className="bg-white text-black text-sm sm:text-base"
                                />
                            </div>

                            {(isHost || lobbyCode) ? (
                                <div className="flex flex-col gap-3 sm:gap-4">
                                    <div className="text-center">
                                        <p className="text-white mb-1 sm:mb-2 text-sm sm:text-base">Your Lobby Code:</p>
                                        <p className="text-xl sm:text-2xl font-bold text-yellow-400">{lobbyCode}</p>
                                        <p className="text-gray-400 text-xs sm:text-sm mt-1 sm:mt-2">
                                            {isHost ? 'Share this code with your friend' : 'Connected to lobby'}
                                        </p>
                                    </div>

                                    {opponent && (
                                        <div className="text-center">
                                            <p className="text-white text-sm sm:text-base">
                                                {isHost ? 'Opponent' : 'Host'}: {opponent}
                                            </p>
                                            {isReady && <p className="text-green-500 text-sm sm:text-base">You are ready!</p>}
                                        </div>
                                    )}

                                    <div className="text-center">
                                        {opponent && !isReady && (
                                            <Button
                                                onClick={handleReady}
                                                className="bg-blue-600 hover:bg-blue-700 text-sm sm:text-base"
                                            >
                                                Ready
                                            </Button>
                                        )}
                                        {!isReady && opponent && (
                                            <p className="text-white mt-2 text-sm sm:text-base">Waiting for players to ready up...</p>
                                        )}
                                    </div>

                                    <Button 
                                        onClick={handleLeaveLobby}
                                        className="bg-red-600 hover:bg-red-700 text-sm sm:text-base"
                                    >
                                        Leave Lobby
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3 sm:gap-4">
                                    <Button
                                        onClick={handleLobbyCreation}
                                        className="bg-green-600 hover:bg-green-700 text-sm sm:text-base"
                                    >
                                        Create Lobby
                                    </Button>

                                    <div className="flex flex-col gap-2">
                                        <Input
                                            type="text"
                                            value={joinCode}
                                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                            placeholder="Enter lobby code"
                                            className="bg-white text-black text-sm sm:text-base"
                                        />
                                        <Button
                                            onClick={handleJoinLobby}
                                            className="bg-blue-600 hover:bg-blue-700 text-sm sm:text-base"
                                        >
                                            Join Lobby
                                        </Button>
                                    </div>
                                </div>
                            )}
                            
                            {error && (
                                <div className="text-red-500 text-center mt-2 sm:mt-4 text-sm sm:text-base">
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