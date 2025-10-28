<script setup>
import { onMounted, ref } from 'vue';
import GameEngine from './components/GameEngine.vue';
import { io } from "socket.io-client";
import communicationManager from './services/communicationManager.js';
import ListaJugadors from './components/ListaJugadors.vue';

// Estat per controlar quina vista es mostra
const vistaActual = ref('salaEspera'); // 'salaEspera', 'lobby', 'joc'

// Estat per a la connexió
const nomJugador = ref('');
const jugadors = ref([]);
let socket = null;

onMounted(() => {
  // Aquí podríem inicialitzar alguna cosa si cal
  // CANVIO LA CONEXIO DIRECTA PER FER-LA VIA communicationManager
  //socket = io('ws://localhost:8088');
  communicationManager.connect() //connecta al servidor

  /*ABANS TENIA AIXO
  socket.on('updatePlayerList', (data) => {
    console.log("Llista de jugadors rebuda: ", data);
    jugadors.value = data;
  }); 
  */
 /*ARA TINC AIXI */
 communicationManager.onUpdatePlayerList((data) => {
    console.log("Llista de jugadors rebuda: ", data);
    jugadors.value = data;
  })


});

 
function connectarAlServidor() {
  if (nomJugador.value.trim() === '') {
    alert('Si us plau, introdueix un nom vàlid.');
    return;
  }

  //ABANS TENIA AIXO
  // socket.emit('setPlayerName', nomJugador.value);

  //ARA HO TINC AIXI:
  communicationManager.enviarUsername(nomJugador.value)
  vistaActual.value = 'lobby';
}

</script>

<template>
  <main>
    <!-- VISTA 1: SALA D'ESPERA -->
    <div v-if="vistaActual === 'salaEspera'" class="vista-container">
      <h1>Type Racer Royale</h1>
      <input type="text" v-model="nomJugador" placeholder="Introdueix el teu nom" />
      <button @click="connectarAlServidor">Entra al Lobby</button>
    </div>

    <!-- VISTA 2: LOBBY -->
    <div v-else-if="vistaActual === 'lobby'" class="vista-container">
      <h2>Jugadors Connectats</h2>
      <ListaJugadors :jugadors="jugadors" />
      <button @click="vistaActual = 'joc'">Comença a Jugar!</button>
    </div>

    <!-- VISTA 3: JOC -->
    <div v-else-if="vistaActual === 'joc'" class="vista-container">
      <ListaJugadors :jugadors="jugadors" />
      <GameEngine />
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
