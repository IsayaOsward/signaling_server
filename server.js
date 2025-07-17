const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const wss = new WebSocket.Server({ port: 8080 });
const rooms = new Map();

wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', (message) => {
    const data = JSON.parse(message);

    if (data.type === 'join') {
      const roomId = data.roomId;
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
      }
      const clients = rooms.get(roomId);
      clients.add(ws);
      console.log(`Client joined room: ${roomId}, Total: ${clients.size}`);

      // Notify other clients in the room
      clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'user-joined', roomId }));
        }
      });
    }

    if (data.type === 'offer' || data.type === 'answer' || data.type === 'candidate') {
      const roomId = data.roomId;
      const clients = rooms.get(roomId) || new Set();
      clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    rooms.forEach((clients, roomId) => {
      if (clients.has(ws)) {
        clients.delete(ws);
        if (clients.size === 0) {
          rooms.delete(roomId);
        }
      }
    });
  });
});

console.log('Signaling server running on ws://localhost:8080');