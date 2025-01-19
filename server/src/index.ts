import express from 'express';
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'

const app = express()

app.use(cors({
    origin: "http://localhost:5173",  
    methods: ["GET", "POST"]
}));

const httpServer = createServer(app)
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
})

app.get('/', (req, res) => {
    res.send('Socket.IO server is running!')
})

const gameRooms = new Map()

io.on('connection', (socket) => {
    console.log('User connected:', socket.id)

    socket.on('createRoom', ({ username }) => {
        const roomCode = Math.random().toString(36).substring(2,8).toUpperCase()
        console.log(`Room created: ${roomCode} by ${username}`)

        gameRooms.set(roomCode, {
            host: {
                id: socket.id,
                username,
                ready: false
            },
            guest: null
        })
        socket.join(roomCode)
        socket.emit('roomCreated', { roomCode })
    })

    socket.on('joinRoom', ({ username, roomCode }) => {
        const room = gameRooms.get(roomCode)

        if (!room) {
            socket.emit('joinError', { message: 'Room not found' })
            return
        }
        if (room.guest) {
            socket.emit('joinError', { message: 'Room is full' })
            return
        }

        room.guest = {
            id: socket.id,
            username,
            ready: false
        }

        socket.join(roomCode)
        io.to(roomCode).emit('playerJoined', {
            host: room.host.username,
            guest: username,
            roomCode: roomCode
        })
    })

    socket.on('playerReady', ({ roomCode }) => {
        const room = gameRooms.get(roomCode)
        if (!room) return

        if (room.host.id === socket.id) {
            room.host.ready = true
        } else if (room.guest?.id === socket.id) {
            room.guest.ready = true
        }

        console.log("Ready status:", { 
            host: room.host.ready, 
            guest: room.guest?.ready 
        });

        if (room.host.ready && room.guest?.ready) {
            console.log("Both players ready, starting game");
            io.to(roomCode).emit('gameStart', { roomCode })
        }
    })

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id)

        gameRooms.forEach((room, code) => {
            if (room.host.id === socket.id || room.guest?.id === socket.id) {
                io.to(code).emit('playerDisconnected')
                gameRooms.delete(code)
            }
        })
    })

    socket.on('leaveRoom', ({ roomCode }) => {
        const room = gameRooms.get(roomCode)
        if (!room) return

        if (room.host.id === socket.id) {
            io.to(roomCode).emit('playerDisconnected')
            gameRooms.delete(roomCode)
        } else if (room.guest?.id === socket.id) {
            room.guest = null
            io.to(roomCode).emit('playerLeft')
        }
        socket.leave(roomCode)
    })
})

const PORT = parseInt(process.env.PORT || '3001', 10)
const HOST = process.env.HOST || '0.0.0.0'
httpServer.listen(PORT, HOST, () => {
    console.log(`Server running on port ${PORT}`)
})