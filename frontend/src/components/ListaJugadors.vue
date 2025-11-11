<script setup>
import communicationManager from '../services/communicationManager.js';
</script>

<template>
  <TransitionGroup name="list" tag="div" class="jugadors-container">
    <div v-for="jugador in communicationManager.state.jugadors" :key="jugador.id" class="jugador-item">
      {{ jugador.name }}
    </div>
  </TransitionGroup>
</template>

<style scoped>
.jugadors-container {
  display: flex;
  flex-direction: column; /* Align items vertically */
  gap: 1rem;
  padding: 0.5rem;
  font-family: 'Roboto Mono', 'Courier New', monospace;
  color: #646669;
  position: relative; /* Needed for absolute positioning of children during move */
}

.jugador-item {
  background-color: #323437;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 1rem;
  transition: all 0.5s ease;
  width: 100%;
  box-sizing: border-box;
  color: #d1d0c5;
  border: 2px solid #4a4d50;
}

/* TransitionGroup styles */
.list-move {
  transition: transform 0.5s ease;
}

.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* Ensure leaving items are taken out of layout flow so moving
   animations can be calculated correctly. */
.list-leave-active {
  position: absolute;
  width: 100%; /* Match the width */
}
</style>
