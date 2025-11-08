import { io } from 'socket.io-client';
import { reactive } from 'vue';

const DEFAULT_SOCKET_URL = (import.meta.env?.VITE_SOCKET_URL || '').trim().replace(/\/$/, '');
const DEFAULT_STREAK_TARGET =  2;
const NOTIFICATION_LIFETIME_MS = 5000;

class CommunicationManager {
  constructor() {
    this.state = reactive({
      jugadors: [],
      room: '',
      roomStats: [],
      gameState: null,
      error: null,
      playerName: '',
      notifications: [],
      streakTarget: DEFAULT_STREAK_TARGET,
      progressSnapshot: [],
      gameFinished: null,
    });

    // Connecta amb el servidor de Socket.IO
    this.socket = DEFAULT_SOCKET_URL ? io(DEFAULT_SOCKET_URL) : io();

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

    this.socket.on('playerStreak', (payload) => {
      if (!payload || !payload.name) {
        return;
      }

      const streak = Number(payload.streak) || 0;
      this.pushNotification({
        type: 'streak',
        name: payload.name,
        streak,
        target: Number(payload.target) || this.state.streakTarget,
        word: payload.word,
      });
    });

    this.socket.on('playerProgressSnapshot', (progressList) => {
      if (Array.isArray(progressList)) {
        this.state.progressSnapshot = progressList;
      }
    });

    this.socket.on('gameFinished', (payload) => {
      this.state.gameFinished = payload || {};
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
    this.state.playerName = playerName;
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

  reportWordResult(result) {
    const payload = {
      word: result?.word || '',
      errors: typeof result?.errors === 'number' ? result.errors : 0,
      duration: typeof result?.duration === 'number' ? result.duration : undefined,
      completedAll: Boolean(result?.completedAll),
    };

    this.socket.emit('wordCompleted', payload);

  }

  reportProgress(progress) {
    const payload = {
      charPercent: typeof progress?.charPercent === 'number' ? progress.charPercent : 0,
      wordsCompleted: typeof progress?.wordsCompleted === 'number' ? progress.wordsCompleted : 0,
      totalWords: typeof progress?.totalWords === 'number' ? progress.totalWords : 0,
    };

    this.enviarProgres(payload);
  }

  pushNotification(notification) {
    const id = `notif-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const entry = {
      id,
      type: notification?.type || 'info',
      name: notification?.name || '',
      streak: notification?.streak || 0,
      target: notification?.target || this.state.streakTarget,
      word: notification?.word,
      selfGenerated: Boolean(notification?.selfGenerated),
    };

    this.state.notifications.push(entry);

    setTimeout(() => {
      this.clearNotification(id);
    }, NOTIFICATION_LIFETIME_MS);
  }

  clearNotification(id) {
    const index = this.state.notifications.findIndex((notification) => notification.id === id);
    if (index !== -1) {
      this.state.notifications.splice(index, 1);
    }
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
