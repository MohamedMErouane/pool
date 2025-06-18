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
        if (waitingPlayer) {
            const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            socket.join(roomCode);
            waitingPlayer.join(roomCode);
            console.log(`Match found! Room code: ${roomCode}`);

            socket.roomCode = roomCode;
            waitingPlayer.roomCode = roomCode;

            rooms[roomCode] = {
                players: [waitingPlayer.id, socket.id],
                turn: waitingPlayer.id // first player starts
            };

            io.to(roomCode).emit('startGame', { roomCode, firstTurn: waitingPlayer.id });
            waitingPlayer = null;
        } else {
            waitingPlayer = socket;
            socket.emit('waitingForOpponent');
        }
    });

    socket.on('playerShot', ({ roomCode, shotData }) => {
        const room = rooms[roomCode];
        if (!room) return;

        // Switch turn
        room.turn = room.players.find(id => id !== socket.id);

        io.to(roomCode).emit('opponentShot', {
            shotData,
            nextTurn: room.turn
        });
    });

    socket.on('disconnect', () => {
        if (waitingPlayer === socket) waitingPlayer = null;
        console.log(`Player disconnected: ${socket.id}`);
    });
});

http.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
