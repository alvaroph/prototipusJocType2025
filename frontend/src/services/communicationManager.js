// src/services/communicationManager.js
import { io } from 'socket.io-client';

const URL =
  import.meta.env.MODE === 'development'
    ? 'http://localhost:8088'
    : 'http://aperezh.daw.inspedralbes.cat:22200'  // 🔁 canvia això pel teu domini real

// Creem una única instància del socket per a tota l'aplicació
const socket = io(URL, { autoConnect: false })

// Aquest objecte serà la nostra API per comunicar-nos
const communicationManager = {
  // Funció per connectar-se i enviar el nom
  connect() {
    socket.connect();
  },

  // Funcions per ESCOLTAR esdeveniments del servidorç
  // Fem servir un callback!!! 

  onUpdatePlayerList(callback) {
    socket.on('updatePlayerList', callback);
  },

  // Funcions per ENVIAR esdeveniments al servidor
  enviarUsername(playerName){
    socket.emit('setPlayerName', playerName);
  }

  // Aquí anirien la resta de funcions per a 'emit' i 'on'
};

export default communicationManager;