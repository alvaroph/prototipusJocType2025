// servidor.js en ES5
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

var app = express();
var server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Obert durant el desenvolupament; restringeix en producció
  },
});

var SALAS_POR_DEFECTO = ['general', 'arena', 'practica'];
var jugadores = new Map(); // socketId -> { id, nombre, sala }
var salas = new Map(); // nombreSala -> Set<socketId>
var progresos = new Map(); // socketId -> { playerId, room, progress }

SALAS_POR_DEFECTO.forEach(function(nombreSala) {
  salas.set(nombreSala, new Set());
});

/**
 * Asegura que una sala exista. Si no, la crea.
 * @param {string} nombreSala - El nombre de la sala.
 * @returns {Set<string>} El Set de miembros de la sala.
 */
function asegurarSala(nombreSala) {
  if (!salas.has(nombreSala)) {
    salas.set(nombreSala, new Set());
  }
  return salas.get(nombreSala);
}

/**
 * Obtiene la lista de miembros de una sala específica.
 * @param {string} nombreSala - El nombre de la sala.
 * @returns {Array<{id: string, nombre: string}>} La lista de miembros.
 */
function obtenerMiembrosSala(nombreSala) {
  var idsMiembros = salas.get(nombreSala);
  if (!idsMiembros) return [];
  return Array.from(idsMiembros)
    .map(function(id) { return jugadores.get(id); })
    .filter(Boolean)
    .map(function(jugador) { return { id: jugador.id, name: jugador.name }; });
}

/**
 * Obtiene las estadísticas de todas las salas (nombre y número de jugadores).
 * @returns {Array<{room: string, count: number}>}
 */
function obtenerEstadisticasSalas() {
  return Array.from(salas.entries()).map(function(entry) {
    var nombreSala = entry[0];
    var idsMiembros = entry[1];
    return { room: nombreSala, count: idsMiembros.size };
  });
}

/**
 * Emite la lista de jugadores a todos los clientes en una sala.
 * @param {string} nombreSala - El nombre de la sala.
 */
function emitirListaJugadoresSala(nombreSala) {
  io.to(nombreSala).emit('updatePlayerList', obtenerMiembrosSala(nombreSala));
}

/**
 * Emite las estadísticas de todas las salas a todos los clientes conectados.
 */
function emitirEstadisticasSalasGlobal() {
  io.emit('updateRoomStats', obtenerEstadisticasSalas());
}

/**
 * Emite las estadísticas de las salas a un socket específico.
 * @param {Socket} socket - El socket del cliente.
 */
function emitirEstadisticasSocket(socket) {
  socket.emit('updateRoomStats', obtenerEstadisticasSalas());
}

io.on('connection', function(socket) {
  console.log("Un usuario se ha conectado: " + socket.id);
  emitirEstadisticasSocket(socket);

  socket.on('joinRoom', function(datos) {
    var nombreJugador = (datos.name || datos.playerName || '').trim() || 'Jugador-' + socket.id.slice(-4);
    var nombreSala = (datos.room || '').trim() || 'general';
    var datosAnteriores = jugadores.get(socket.id);
    console.log(nombreJugador + " quiere unirse a la sala " + nombreSala)

    if (datosAnteriores && datosAnteriores.room) {
      var miembrosSalaAnterior = salas.get(datosAnteriores.room);
      if (miembrosSalaAnterior) {
        miembrosSalaAnterior.delete(socket.id);
      }
      socket.leave(datosAnteriores.room);
      if (datosAnteriores.room !== nombreSala) {
        emitirListaJugadoresSala(datosAnteriores.room);
      }
    }

    var miembrosSala = asegurarSala(nombreSala);
    miembrosSala.add(socket.id);
    jugadores.set(socket.id, { id: socket.id, name: nombreJugador, room: nombreSala });
    socket.join(nombreSala);

    emitirListaJugadoresSala(nombreSala);
    emitirEstadisticasSalasGlobal();
    socket.emit('roomJoined', nombreSala);
  });

  socket.on('setPlayerName', function(nombre) {
    var actual = jugadores.get(socket.id);
    if (!actual) return;
    actual.name = (nombre || '').trim() || actual.name;
    jugadores.set(socket.id, actual);
    if (actual.room) {
      emitirListaJugadoresSala(actual.room);
      emitirEstadisticasSalasGlobal();
    }
  });

  socket.on('playerProgress', function(progressData) {
    var jugador = jugadores.get(socket.id);
    if (!jugador || !jugador.room) {
      socket.emit('error', 'No estás en una sala activa.');
      return;
    }

    var progresoNormalizado = {
      playerId: socket.id,
      room: jugador.room,
      progress: progressData || {},
    };

    progresos.set(socket.id, progresoNormalizado);
    io.to(jugador.room).emit('gameStateUpdate', progresoNormalizado);
  });

  socket.on('requestGameStart', function() {
    var jugador = jugadores.get(socket.id);
    if (!jugador || !jugador.room) {
      socket.emit('error', 'No estás en una sala activa.');
      return;
    }

    io.to(jugador.room).emit('gameStarting', {
      room: jugador.room,
      initiatedBy: socket.id,
      countdown: 3,
      at: Date.now(),
    });
  });

  socket.on('playerKeyPressed', function(datos) {
    var jugador = jugadores.get(socket.id);
    if (!jugador || !jugador.room) {
      socket.emit('error', 'No estás en una sala activa.');
      return;
    }

    var tecla = '';
    if (datos && typeof datos.key === 'string') {
      tecla = datos.key.trim().toUpperCase();
    }

    if (!tecla) {
      return;
    }

    socket.to(jugador.room).emit('playerKeyPressed', {
      playerId: socket.id,
      key: tecla,
    });
  });

  socket.on('disconnect', function() {
    console.log("El usuario " + socket.id + " se ha desconectado");
    var jugador = jugadores.get(socket.id);
    jugadores.delete(socket.id);
    progresos.delete(socket.id);

    if (jugador && jugador.room) {
      var miembrosSala = salas.get(jugador.room);
      if (miembrosSala) {
        miembrosSala.delete(socket.id);
      }
      emitirListaJugadoresSala(jugador.room);
    }

    emitirEstadisticasSalasGlobal();
  });
});

var PORT = process.env.PORT || 8088;
server.listen(PORT, () => {
  console.log("Servidor Socket.IO escuchando en el puerto " + PORT);
});
