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
  <main class="app-shell">
    <header class="app-header">
      <div class="header-content">
        <img src="/logo_speed_racer.png" alt="Type Racer Royale" class="game-logo" />
        <div>
          <p class="brand-kicker">Afina els teus dits i domina el desert digital.</p>
          <div class="brand-badges">
            <span>Multijugador</span>
            <span>Temps real</span>
            <span>Ratxes perfectes</span>
          </div>
        </div>
      </div>
    </header>

    <section class="play-zone">
      <div class="vista-wrapper">
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
      </div>
    </section>
  </main>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Chelsea+Market&display=swap');

:root {
  --color-pink: #ea4f5e;
  --color-gold: #f6c348;
  --color-teal: #40e7b9;
  --color-blue: #4f73f4;
  --color-violet: #da65f9;
  --color-ink: #1b1230;
  --color-ink-soft: #24163e;
  --color-paper: #fff9f3;
  --color-cloud: #fef2ff;
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: 'Courier New', monospace;
  background: radial-gradient(circle at 10% 15%, rgba(64, 231, 185, 0.25) 0, transparent 45%),
    radial-gradient(circle at 80% 0, rgba(218, 101, 249, 0.3) 0, transparent 50%),
    linear-gradient(135deg, #120a22, #1a1031, #251341);
  color: var(--color-paper);
}

body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.06) 0 8px, transparent 8px 16px);
  opacity: 0.35;
  pointer-events: none;
}

.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  padding: clamp(1rem, 4vw, 3rem);
}

.app-header {
  width: 100%;
  background: linear-gradient(120deg, var(--color-violet), var(--color-blue));
  border: 5px solid var(--color-ink);
  border-radius: 32px;
  box-shadow: 0 18px 0 var(--color-ink);
  padding: 1.5rem;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.game-logo {
  width: clamp(160px, 25vw, 220px);
  filter: drop-shadow(0 10px 0 rgba(27, 18, 48, 0.4));
}

.brand-kicker {
  margin: 0 0 0.8rem;
  font-size: 1rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.brand-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.brand-badges span {
  background: var(--color-gold);
  color: var(--color-ink);
  border-radius: 999px;
  padding: 0.35rem 0.9rem;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  border: 3px solid var(--color-ink);
  box-shadow: 0 6px 0 rgba(27, 18, 48, 0.4);
}

.play-zone {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto 3rem;
}

.vista-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
}

.vista-container {
  width: 100%;
  padding: 2.5rem clamp(1.5rem, 4vw, 3rem);
  border-radius: 40px;
  background:
    radial-gradient(circle at top right, rgba(64, 231, 185, 0.35), transparent 60%),
    linear-gradient(135deg, var(--color-cloud), var(--color-paper));
  border: 5px solid var(--color-ink);
  box-shadow:
    0 24px 0 var(--color-ink),
    0 30px 40px rgba(0, 0, 0, 0.35);
  position: relative;
  text-align: center;
}

.vista-container::before {
  content: '';
  position: absolute;
  inset: 18px;
  border-radius: 28px;
  border: 3px dashed rgba(27, 18, 48, 0.2);
  background: repeating-linear-gradient(-45deg, rgba(246, 195, 72, 0.15) 0 10px, transparent 10px 20px);
  pointer-events: none;
}

h1, h2 {
  font-family: 'Courier New', monospace;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--color-ink);
  text-shadow: 0 3px 0 rgba(255, 255, 255, 0.6);
}

h1 {
  font-size: clamp(2rem, 4vw, 2.8rem);
  margin-bottom: 1rem;
}

h2 {
  font-size: clamp(1.5rem, 3vw, 2rem);
  margin-bottom: 1.5rem;
}

input[type='text'],
select {
  width: 85%;
  max-width: 420px;
  margin: 0 auto 1rem;
  display: block;
  text-align: center;
  font-size: 1rem;
  padding: 0.9rem 1.2rem;
  border-radius: 999px;
  border: 4px solid var(--color-ink);
  background: #ffffff;
  color: var(--color-ink);
  font-weight: 700;
  text-transform: uppercase;
  box-shadow: 0 6px 0 rgba(27, 18, 48, 0.4);
}

button {
  background: linear-gradient(120deg, var(--color-pink), var(--color-violet));
  color: #fff;
  border: 4px solid var(--color-ink);
  border-radius: 32px;
  padding: 0.95rem 2.5rem;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: transform 0.15s ease;
  display: block;
  width: 85%;
  max-width: 420px;
  margin: 1.25rem auto 0;
  box-shadow: 0 10px 0 var(--color-ink);
}

button:hover {
  transform: translateY(-4px) rotate(-1deg);
  box-shadow: 0 14px 0 var(--color-ink);
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
  transform: none;
  box-shadow: 0 6px 0 var(--color-ink);
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    text-align: center;
  }

  .vista-container {
    border-radius: 28px;
  }
}
</style>
