const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = 3000;

io.on('connection', (socket) => {
    console.log('New client connected: ' + socket.id);

    // Join a room
    socket.on('join', (roomId) => {
        socket.join(roomId);
        console.log(`${socket.id} joined room ${roomId}`);

        const clients = io.sockets.adapter.rooms.get(roomId);
        const numClients = clients ? clients.size : 0;

        if (numClients > 1) {
            socket.to(roomId).emit('ready');
        }
    });

    // Relay offer
    socket.on('offer', (data) => {
        socket.to(data.room).emit('offer', data.sdp);
    });

    // Relay answer
    socket.on('answer', (data) => {
        socket.to(data.room).emit('answer', data.sdp);
    });

    // Relay ICE candidates
    socket.on('ice-candidate', (data) => {
        socket.to(data.room).emit('ice-candidate', data.candidate);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected: ' + socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Signaling server running on http://localhost:${PORT}`);
});
