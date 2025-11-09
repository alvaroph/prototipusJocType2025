<template>
  <div class="final-stats">
    <h2>Partida finalitzada</h2>
    <p v-if="winner">
      <strong>{{ winner.winnerName || 'Algú' }}</strong> ha completat totes les paraules!
    </p>
    <p v-else>
      S'ha acabat la partida.
    </p>

    <div class="progress-panel" v-if="progress.length">
      <h3>Progrés dels jugadors</h3>
      <div v-for="player in progress" :key="player.id" class="progress-item">
        <span class="progress-name">{{ player.name }}</span>
        <div class="progress-row">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: percentValue(player.charPercent) + '%' }"></div>
          </div>
          <span class="progress-value">{{ percentValue(player.charPercent) }}%</span>
        </div>
        <div class="progress-row">
          <div class="progress-bar">
            <div class="progress-fill words" :style="{ width: wordsPercent(player) + '%' }"></div>
          </div>
          <span class="progress-value">{{ player.wordsCompleted }} / {{ player.totalWords || 0 }}</span>
        </div>
      </div>
    </div>

    <button class="return-button" @click="tornarAlLobby">Torna al lobby</button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import communicationManager from '../services/communicationManager.js';

const emit = defineEmits(['tornar']);

const winner = computed(() => communicationManager.state.gameFinished);
const progress = computed(() => communicationManager.state.progressSnapshot || []);

function percentValue(value) {
  const numeric = Number(value) || 0;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function wordsPercent(player) {
  if (!player || !player.totalWords) {
    return 0;
  }
  return percentValue((player.wordsCompleted / player.totalWords) * 100);
}

function tornarAlLobby() {
  communicationManager.state.gameFinished = null;
  emit('tornar');
}
</script>

<style scoped>
.final-stats {
  color: var(--color-ink);
  text-align: center;
  font-family: 'Courier New', monospace;
}

.final-stats h2 {
  color: var(--color-pink);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  text-shadow: 0 4px 0 var(--color-ink);
}

.progress-panel {
  background: linear-gradient(145deg, rgba(64, 231, 185, 0.25), rgba(246, 195, 72, 0.3));
  border: 5px solid var(--color-ink);
  border-radius: 32px;
  padding: 1.5rem;
  margin-top: 1rem;
  box-shadow: 0 18px 0 var(--color-ink);
}

.progress-item {
  padding: 0.65rem 0;
  border-bottom: 2px dashed rgba(27, 18, 48, 0.2);
}

.progress-item:last-child {
  border-bottom: none;
}

.progress-name {
  font-weight: 700;
  display: block;
  margin-bottom: 0.2rem;
  text-transform: uppercase;
  color: var(--color-blue);
}

.progress-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
}

.progress-bar {
  flex: 1;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 999px;
  height: 12px;
  overflow: hidden;
  border: 2px solid rgba(27, 18, 48, 0.25);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(120deg, var(--color-pink), var(--color-gold));
  border-radius: 999px;
  transition: width 0.2s ease;
}

.progress-fill.words {
  background: linear-gradient(120deg, var(--color-teal), var(--color-blue));
}

.progress-value {
  min-width: 48px;
  text-align: right;
  color: var(--color-ink);
}

.return-button {
  margin-top: 1.8rem;
  background: linear-gradient(120deg, var(--color-pink), var(--color-violet));
  color: var(--color-white);
  border: 4px solid var(--color-ink);
  border-radius: 36px;
  padding: 0.9rem 2.5rem;
  font-size: 1rem;
  font-weight: bold;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: transform 0.15s ease;
  box-shadow: 0 12px 0 var(--color-ink);
}

.return-button:hover {
  transform: translateY(-4px) rotate(-1deg);
  box-shadow: 0 16px 0 var(--color-ink);
}
</style>
