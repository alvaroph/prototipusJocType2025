<template>
  <div class="realtime-panel">
    <div v-if="progress.length" class="progress-panel">
      <h4>Progrés en temps real</h4>
      <div v-for="player in progress" :key="player.id" class="progress-item">
        <span class="progress-name">{{ player.name }}</span>
        <div class="progress-row">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: percentValue(player.charPercent) + '%' }"></div>
          </div>
          <span class="progress-value">{{ percentValue(player.charPercent) }}%</span>
        </div>
        <div class="progress-row words-row">
          <div class="progress-bar">
            <div class="progress-fill words" :style="{ width: wordsPercent(player) + '%' }"></div>
          </div>
          <span class="progress-value">{{ player.wordsCompleted }} / {{ player.totalWords || 0 }}</span>
        </div>
      </div>
    </div>

    <div v-if="notifications.length" class="notifications-panel">
      <transition-group name="notification" tag="ul" class="notifications-list">
        <li v-for="notification in notifications" :key="notification.id" class="notification-item">
          <span class="notification-highlight">{{ notification.name }}</span>
          <span class="notification-message">{{ formatMessage(notification) }}</span>
        </li>
      </transition-group>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import communicationManager from '../services/communicationManager.js';

const notifications = computed(() => communicationManager.state.notifications);
const progress = computed(() => communicationManager.state.progressSnapshot || []);

function formatMessage(notification) {
  const streak = Number(notification.streak) || 0;
  const target = Number(notification.target) || communicationManager.state.streakTarget;
  const pieces = [];

  if (notification.selfGenerated) {
    pieces.push('estàs en ratxa!');
  } else {
    pieces.push('està en ratxa!');
  }

  if (streak) {
    pieces.push(`${streak} paraules perfectes seguides`);
  } else if (target) {
    pieces.push(`ha encadenat ${target} paraules perfectes`);
  }

  if (notification.word) {
    pieces.push(`(última: ${notification.word})`);
  }

  return pieces.join(' ');
}

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
</script>

<style scoped>
.realtime-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.progress-panel {
  background: rgba(50, 52, 55, 0.85);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  max-width: 260px;
  color: #d1d0c5;
}

.progress-panel h4 {
  margin: 0 0 0.5rem;
  font-size: 0.95rem;
  color: #f7ca38;
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
  font-size: 0.75rem;
}

.progress-bar {
  flex: 1;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  height: 6px;
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

.words-row {
  margin-top: 0.2rem;
}

.progress-value {
  min-width: 48px;
  text-align: right;
}

.notifications-panel {
  background: rgba(50, 52, 55, 0.85);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin-top: 1rem;
  max-width: 240px;
  overflow: hidden;
}

.notifications-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.notification-item {
  background: rgba(226, 183, 20, 0.1);
  border-left: 4px solid #e2b714;
  padding: 0.5rem 0.75rem;
  color: #d1d0c5;
  font-size: 0.85rem;
  line-height: 1.3;
}

.notification-highlight {
  display: block;
  font-weight: 600;
  color: #f7ca38;
}

.notification-message {
  display: block;
  margin-top: 0.2rem;
}

.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from,
.notification-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
