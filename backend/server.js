// Servidor molt simplificat pensat per a intuir ràpidament l'estat compartit
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

// ---------------------------
// Estructures bàsiques
// ---------------------------
// rooms => [{ name: 'general', members: ['socketId', ...] }]
// players => [{ id, name, room, streak }]
const rooms = [];
const players = [];
const DEFAULT_ROOMS = ['general', 'arena', 'practica'];
const STREAK_TARGET = 2;

for (let i = 0; i < DEFAULT_ROOMS.length; i += 1) {
  rooms.push({ name: DEFAULT_ROOMS[i], members: [] });
}

function getRoom(roomName) {
  for (let i = 0; i < rooms.length; i += 1) {
    if (rooms[i].name === roomName) {
      return rooms[i];
    }
  }
  return null;
}

function ensureRoom(roomName) {
  let room = getRoom(roomName);
  if (!room) {
    room = { name: roomName, members: [] };
    rooms.push(room);
  }
  return room;
}

function getPlayer(socketId) {
  for (let i = 0; i < players.length; i += 1) {
    if (players[i].id === socketId) {
      return players[i];
    }
  }
  return null;
}

function removeFromRoom(roomName, socketId) {
  const room = getRoom(roomName);
  if (!room) {
    return;
  }
  const members = room.members;
  for (let i = members.length - 1; i >= 0; i -= 1) {
    if (members[i] === socketId) {
      members.splice(i, 1);
    }
  }
}

function addToRoom(roomName, socketId) {
  const room = ensureRoom(roomName);
  // Evitem duplicats de manera molt directa
  removeFromRoom(roomName, socketId);
  room.members.push(socketId);
}

function buildPlayerList(roomName) {
  const room = getRoom(roomName);
  const result = [];
  if (!room) {
    return result;
  }
  for (let i = 0; i < room.members.length; i += 1) {
    const player = getPlayer(room.members[i]);
    if (player) {
      result.push({ id: player.id, name: player.name });
    }
  }
  return result;
}

function buildRoomStats() {
  const stats = [];
  for (let i = 0; i < rooms.length; i += 1) {
    stats.push({ room: rooms[i].name, count: rooms[i].members.length });
  }
  return stats;
}

function broadcastRoomStats() {
  io.emit('updateRoomStats', buildRoomStats());
}

function broadcastRoomPlayers(roomName) {
  io.to(roomName).emit('updatePlayerList', buildPlayerList(roomName));
}

function removePlayer(socketId) {
  for (let i = players.length - 1; i >= 0; i -= 1) {
    if (players[i].id === socketId) {
      players.splice(i, 1);
    }
  }
}

io.on('connection', (socket) => {
  socket.emit('updateRoomStats', buildRoomStats());

  socket.on('joinRoom', (payload) => {
    const rawName = payload && payload.name ? String(payload.name) : '';
    const name = rawName.trim() ? rawName.trim() : 'Jugador-' + socket.id.slice(-4);
    const rawRoom = payload && payload.room ? String(payload.room) : '';
    const roomName = rawRoom.trim() ? rawRoom.trim() : 'general';

    let player = getPlayer(socket.id);
    if (!player) {
      player = { id: socket.id, name, room: roomName, streak: 0 };
      players.push(player);
    }

    if (player.room) {
      removeFromRoom(player.room, socket.id);
      socket.leave(player.room);
    }

    player.name = name;
    player.room = roomName;
    player.streak = 0;

    addToRoom(roomName, socket.id);
    socket.join(roomName);

    broadcastRoomPlayers(roomName);
    broadcastRoomStats();
    socket.emit('roomJoined', roomName);
  });

  socket.on('playerProgress', (progressData) => {
    const player = getPlayer(socket.id);
    if (!player) {
      return;
    }
    const payload = {
      playerId: socket.id,
      room: player.room,
      progress: progressData || {},
    };
    io.to(player.room).emit('gameStateUpdate', payload);
  });

  socket.on('requestGameStart', () => {
    const player = getPlayer(socket.id);
    if (!player) {
      return;
    }
    io.to(player.room).emit('gameStarting', {
      room: player.room,
      initiatedBy: socket.id,
      countdown: 3,
      at: Date.now(),
    });
  });

  socket.on('playerKeyPressed', (data) => {
    const player = getPlayer(socket.id);
    if (!player || !data || !data.key) {
      return;
    }
    const cleanKey = String(data.key).trim().toUpperCase();
    if (!cleanKey) {
      return;
    }
    socket.to(player.room).emit('playerKeyPressed', {
      playerId: socket.id,
      key: cleanKey,
    });
  });

  socket.on('wordCompleted', (result) => {
    const player = getPlayer(socket.id);
    if (!player) {
      return;
    }

    const errors = result && typeof result.errors === 'number' ? result.errors : 0;
    if (errors === 0) {
      player.streak += 1;
      if (player.streak % STREAK_TARGET === 0) {
        socket.to(player.room).emit('playerStreak', {
          playerId: socket.id,
          name: player.name,
          streak: player.streak,
          target: STREAK_TARGET,
          word: result && result.word ? result.word : undefined,
        });
      }
    } else {
      player.streak = 0;
    }
  });

  socket.on('disconnect', () => {
    const player = getPlayer(socket.id);
    if (player) {
      removeFromRoom(player.room, socket.id);
      removePlayer(socket.id);
      broadcastRoomPlayers(player.room);
    }
    broadcastRoomStats();
  });
});

const PORT = process.env.PORT || 8088;
server.listen(PORT, () => {
  console.log('Servidor Socket.IO escoltant al port ' + PORT);
});
