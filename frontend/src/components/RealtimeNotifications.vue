<template>
  <div v-if="notifications.length" class="notifications-panel">
    <transition-group name="notification" tag="ul" class="notifications-list">
      <li v-for="notification in notifications" :key="notification.id" class="notification-item">
        <span class="notification-highlight">{{ notification.name }}</span>
        <span class="notification-message">{{ formatMessage(notification) }}</span>
      </li>
    </transition-group>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import communicationManager from '../services/communicationManager.js';

const notifications = computed(() => communicationManager.state.notifications);

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
</script>

<style scoped>
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
