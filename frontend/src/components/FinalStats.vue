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
  color: #d1d0c5;
  text-align: center;
}

.final-stats h2 {
  color: #e2b714;
}

.progress-panel {
  background: rgba(50, 52, 55, 0.85);
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
}

.progress-item {
  padding: 0.4rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.progress-item:last-child {
  border-bottom: none;
}

.progress-name {
  font-weight: 600;
  display: block;
  margin-bottom: 0.2rem;
}

.progress-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
}

.progress-bar {
  flex: 1;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  height: 8px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #e2b714;
  border-radius: 999px;
  transition: width 0.2s ease;
}

.progress-fill.words {
  background: #4caf50;
}

.progress-value {
  min-width: 48px;
  text-align: right;
}

.return-button {
  margin-top: 1.5rem;
  background-color: #e2b714;
  color: #2c2e31;
  border: none;
  border-radius: 8px;
  padding: 0.8rem 2rem;
  font-size: 1.1rem;
  font-weight: bold;
  font-family: 'Roboto Mono', 'Courier New', monospace;
  cursor: pointer;
  transition: background-color 0.2s;
}

.return-button:hover {
  background-color: #f7ca38;
}
</style>
