<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import GameEngine from './components/GameEngine.vue';
import communicationManager from './services/communicationManager.js';
import ListaJugadors from './components/ListaJugadors.vue';
import FinalStats from './components/FinalStats.vue';

// Estat per controlar quina vista es mostra
const vistaActual = ref('salaEspera'); // 'salaEspera', 'lobby', 'joc'

// Estat per a la connexió
const nomJugador = ref('');
const salaSeleccionada = ref('general');

const countdown = ref(null);
let countdownInterval = null;
let gameStartingListener = null;
let gameFinishedListener = null;
const diccionarioPartida = ref([]);
const temaPartida = ref('');



 
function connectarAlServidor() {
  if (nomJugador.value.trim() === '') {
    alert('Si us plau, introdueix un nom vàlid.');
    return;
  }

  communicationManager.unirSala(nomJugador.value, salaSeleccionada.value || 'general');
  vistaActual.value = 'lobby';
}

function iniciarCompteEnrere(event) {
  if (!event) {
    return;
  }

  const salaEvent = event.room || null;
  const salaActual = communicationManager.state.room || null;
  if (salaEvent && salaActual && salaEvent !== salaActual) {
    return;
  }

  if (Array.isArray(event.dictionary) && event.dictionary.length) {
    diccionarioPartida.value = event.dictionary.slice();
  } else {
    diccionarioPartida.value = [];
  }
  temaPartida.value = event.tema || '';

  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }

  const valorInicial = Number(event.countdown) || 3;
  countdown.value = valorInicial;

  countdownInterval = setInterval(() => {
    if (countdown.value <= 1) {
      clearInterval(countdownInterval);
      countdownInterval = null;
      countdown.value = null;
      vistaActual.value = 'joc';
      return;
    }
    countdown.value -= 1;
  }, 1000);
}

function demanarIniciPartida() {
  if (countdown.value !== null) {
    return;
  }
  communicationManager.requestGameStart();
}

onMounted(() => {
  gameStartingListener = (payload) => {
    iniciarCompteEnrere(payload);
  };
  communicationManager.socket.on('gameStarting', gameStartingListener);

  gameFinishedListener = (payload) => {
    vistaActual.value = 'final';
  };
  communicationManager.socket.on('gameFinished', gameFinishedListener);
});

onUnmounted(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  if (gameStartingListener) {
    communicationManager.socket.off('gameStarting', gameStartingListener);
    gameStartingListener = null;
  }
  if (gameFinishedListener) {
    communicationManager.socket.off('gameFinished', gameFinishedListener);
    gameFinishedListener = null;
  }
});

</script>

<template>
  <main>
    <!-- VISTA 1: SALA D'ESPERA -->
    <div v-if="vistaActual === 'salaEspera'" class="vista-container">
      <h1>Type Racer Royale</h1>
      <input type="text" v-model="nomJugador" placeholder="Introdueix el teu nom" />
      <select v-model="salaSeleccionada">
        <option value="general">Sala General</option>
        <option value="arena">Sala Arena</option>
        <option value="practica">Sala Pràctica</option>
      </select>
      <button @click="connectarAlServidor">Entra al Lobby </button>
    </div>

    <!-- VISTA 2: LOBBY -->
    <div v-else-if="vistaActual === 'lobby'" class="vista-container">
      <h2>Jugadors Connectats</h2>
      <ListaJugadors />
      <button @click="demanarIniciPartida" :disabled="countdown !== null">
        {{ countdown !== null ? `Comença en ${countdown}` : 'Comença a Jugar!' }}
      </button>
    </div>

    <!-- VISTA 3: JOC -->
    <div v-else-if="vistaActual === 'joc'" class="vista-container">
      <ListaJugadors />
      <GameEngine :diccionario="diccionarioPartida" />
    </div>

    <!-- VISTA 4: FINAL -->
    <div v-else-if="vistaActual === 'final'" class="vista-container">
      <FinalStats @tornar="vistaActual = 'lobby'" />
    </div>
  </main>
</template>

<style>
main {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  text-align: center;
}

.vista-container {
  background-color: #2c2e31;
  padding: 2rem 3rem;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

h1 {
  color: #e2b714;
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

h2 {
  color: #d1d0c5;
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
}

input[type="text"] {
  background-color: #222326;
  color: #e2b714;
  border: 2px solid #646669;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 1.2rem;
  width: 80%;
  max-width: 400px;
  text-align: center;
  font-family: 'Roboto Mono', 'Courier New', monospace;
  outline: none;
  margin-bottom: 1.5rem;
  transition: border-color 0.2s;
}

input[type="text"]:focus {
  border-color: #e2b714;
}

select {
  background-color: #222326;
  color: #e2b714;
  border: 2px solid #646669;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 1.2rem;
  width: 85%;
  max-width: 400px;
  text-align: center;
  font-family: 'Roboto Mono', 'Courier New', monospace;
  outline: none;
  margin-bottom: 1.5rem;
  transition: border-color 0.2s;
  -webkit-appearance: none; /* Remove default arrow for Chrome/Safari */
  -moz-appearance: none; /* Remove default arrow for Firefox */
  appearance: none; /* Remove default arrow */
  background-image: url("data:image/svg+xml;utf8,<svg fill='%23e2b714' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>");
  background-repeat: no-repeat;
  background-position: right 1rem center;
}

select:focus {
  border-color: #e2b714;
}

button {
  background-color: #e2b714;
  color: #2c2e31;
  border: none;
  border-radius: 8px;
  padding: 0.8rem 2rem;
  font-size: 1.2rem;
  font-weight: bold;
  font-family: 'Roboto Mono', 'Courier New', monospace;
  cursor: pointer;
  transition: background-color 0.2s;
  display: block;
  width: 80%;
  max-width: 400px;
  margin: 1rem auto 0;
}

button:hover {
  background-color: #f7ca38;
}
</style>
