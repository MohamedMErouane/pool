const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

let waitingPlayer = null;
let rooms = {};

io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    socket.on('findMatch', () => {
        if (waitingPlayer && waitingPlayer.id !== socket.id) {
            const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            
            socket.join(roomCode);
            waitingPlayer.join(roomCode);
            
            rooms[roomCode] = {
                players: [waitingPlayer.id, socket.id],
                turn: waitingPlayer.id
            };

            io.to(roomCode).emit('startGame', { 
                roomCode, 
                firstTurn: waitingPlayer.id 
            });
            
            console.log(`Match created in room: ${roomCode}`);
            waitingPlayer = null;
        } else {
            waitingPlayer = socket;
            socket.emit('waitingForOpponent');
            console.log(`Player ${socket.id} waiting for opponent`);
        }
    });

    socket.on('leaveGame', (roomCode) => {
        if (rooms[roomCode]) {
            socket.to(roomCode).emit('opponentDisconnected');
            delete rooms[roomCode];
            console.log(`Player ${socket.id} left room ${roomCode}`);
        }
    });
// In your server's playerShot handler
socket.on('playerShot', ({ roomCode, shotData }) => {
    const room = rooms[roomCode];
    if (!room || room.turn !== socket.id) return;

    // Update room state
    room.lastState = {
        balls: shotData.ballStates,
        turn: room.players.find(id => id !== socket.id) // Switch turn
    };

    // Broadcast to opponent
    socket.to(roomCode).emit('opponentShot', {
        shotData: shotData,
        nextTurn: room.lastState.turn
    });
});

// Add state request handler
socket.on('requestState', (roomCode) => {
    const room = rooms[roomCode];
    if (room && room.lastState) {
        socket.emit('gameState', room.lastState);
    }
});
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        
        if (waitingPlayer === socket) {
            waitingPlayer = null;
        }
        
        for (const roomCode in rooms) {
            if (rooms[roomCode].players.includes(socket.id)) {
                socket.to(roomCode).emit('opponentDisconnected');
                delete rooms[roomCode];
                console.log(`Room ${roomCode} deleted due to disconnect`);
                break;
            }
        }
    });
});

http.listen(3008, () => {
    console.log('Server running on http://localhost:3000');
});