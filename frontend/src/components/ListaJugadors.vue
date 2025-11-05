<script setup>

import communicationManager from '../services/communicationManager.js';
</script>

<template>
  <div class="jugadors-container">
    <span v-for="jugador in communicationManager.state.jugadors" :key="jugador.id">
      {{ jugador.name }}
    </span>
  </div>
</template>

<style scoped>
.jugadors-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
  padding: 0.5rem;
  font-family: 'Roboto Mono', 'Courier New', monospace;
  color: #646669; /* Color de texto secundario, como las palabras pendientes */
}
.jugador-item {
  background-color: #2c2e31; /* Fondo oscuro como los contenedores */
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.9rem;
}
</style>