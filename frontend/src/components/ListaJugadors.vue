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
  gap: 0.8rem;
  padding: 0.75rem 0;
  font-family: 'Courier New', monospace;
  color: var(--color-ink);
}

.jugadors-container span {
  background: linear-gradient(120deg, rgba(64, 231, 185, 0.35), rgba(246, 195, 72, 0.4));
  color: var(--color-ink);
  padding: 0.5rem 1.1rem;
  border-radius: 24px;
  border: 3px solid var(--color-ink);
  box-shadow: 0 6px 0 rgba(27, 18, 48, 0.4);
  text-transform: uppercase;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
}
</style>
