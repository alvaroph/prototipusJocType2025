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
  background: linear-gradient(160deg, rgba(64, 231, 185, 0.25), rgba(246, 195, 72, 0.35));
  border-radius: 26px;
  padding: 1rem 1.2rem;
  max-width: 260px;
  color: var(--color-ink);
  border: 4px solid var(--color-ink);
  box-shadow: 0 12px 0 var(--color-ink);
}

.progress-panel h4 {
  margin: 0 0 0.5rem;
  font-size: 0.95rem;
  color: var(--color-pink);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.progress-item {
  padding: 0.4rem 0;
  border-bottom: 1px dashed rgba(27, 18, 48, 0.2);
}

.progress-item:last-child {
  border-bottom: none;
}

.progress-name {
  font-weight: 600;
  display: block;
  margin-bottom: 0.2rem;
  color: var(--color-blue);
}

.progress-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
}

.progress-bar {
  flex: 1;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 999px;
  height: 6px;
  overflow: hidden;
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

.words-row {
  margin-top: 0.2rem;
}

.progress-value {
  min-width: 48px;
  text-align: right;
  color: var(--color-ink);
}

.notifications-panel {
  background: linear-gradient(160deg, rgba(218, 101, 249, 0.8), rgba(79, 115, 244, 0.85));
  border-radius: 26px;
  padding: 0.95rem 1.2rem;
  margin-top: 1rem;
  max-width: 240px;
  overflow: hidden;
  color: #fff;
  border: 4px solid var(--color-ink);
  box-shadow: 0 12px 0 rgba(24, 6, 11, 0.7);
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
  background: rgba(246, 195, 72, 0.2);
  border-left: 5px solid var(--color-gold);
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
  line-height: 1.3;
  border-radius: 12px;
}

.notification-highlight {
  display: block;
  font-weight: 600;
  color: var(--color-gold);
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
