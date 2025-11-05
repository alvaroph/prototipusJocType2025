import { io } from 'socket.io-client';
import { reactive } from 'vue';

class CommunicationManager {
  constructor() {
    this.state = reactive({
      jugadors: [],
      room: '',
      roomStats: [],
      gameState: null,
      error: null,
    });

    // Connecta amb el servidor de Socket.IO
    this.socket = io('http://localhost:8088'); // Ajusta la URL si és necessari

    // Assigna els listeners una sola vegada
    this.setupListeners();
  }

  setupListeners() {
    this.socket.on('connect', () => {
      console.log('Connectat al servidor de Socket.IO amb id:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Desconnectat del servidor de Socket.IO');
    });

    this.socket.on('updatePlayerList', (playerList) => {
      console.log('Rebuda llista de jugadors:', playerList);
      this.state.jugadors = playerList;
    });

    this.socket.on('updateRoomStats', (stats) => {
      console.log('Actualització d\'estadístiques de sales:', stats);
      this.state.roomStats = stats;
    });

    this.socket.on('roomJoined', (room) => {
      console.log('Unit a la sala:', room);
      this.state.room = room;
    });

    this.socket.on('error', (errorMessage) => {
      console.error('Error del servidor:', errorMessage);
      this.state.error = errorMessage;
    });

    this.socket.on('gameStateUpdate', (gameState) => {
      console.log('Rebut estat del joc:', gameState);
      this.state.gameState = gameState;
    });

    // Els components s'encarreguen de subscriure's a altres events específics
    // (com ara playerKeyPressed o gameStarting) per gestionar-los localment.

  }

  // Mètodes per interactuar amb el servidor

  /**
   * Envia el nom del jugador per unir-se a una sala.
   */
  unirSala(playerName, roomCode) {
    this.socket.emit('joinRoom', { name: playerName, room: roomCode });
    console.log('Enviada petició d\'unió', playerName, roomCode);
  }

  setPlayerName(newName) {
    this.socket.emit('setPlayerName', newName);
    console.log('Enviada actualització de nom', newName);
  }

  /**
   * Envia el progrés del jugador durant el joc.
   */
  enviarProgres(progressData) {
    this.socket.emit('playerProgress', progressData);
  }

  /**
   * Envia la tecla enviada
   */
  sendKeyPress(key) {
    this.socket.emit('playerKeyPressed', { key });
  }

  /**
   * Demano començar el joc
   */
  requestGameStart() {
    this.socket.emit('requestGameStart');
  }

  // Pots afegir més mètodes per a altres interaccions
}

// Exporta una única instància de la classe
const communicationManager = new CommunicationManager();

export default communicationManager;
