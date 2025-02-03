<template>
  <div class="status-bar">
    <div class="status-content">
      <div class="status-item" :class="{ 'is-connected': isOnline }">
        <i class="fas" :class="isOnline ? 'fa-wifi' : 'fa-wifi-slash'"></i>
        <span>{{ isOnline ? 'Connecté' : 'Hors ligne' }}</span>
      </div>
      <div class="status-item" :class="{ 'is-connected': isNfcConnected }">
        <i class="fas fa-credit-card"></i>
        <span>{{ isNfcConnected ? 'Lecteur NFC connecté' : 'Lecteur NFC déconnecté' }}</span>
      </div>
      <div class="status-item">
        <i class="fas fa-clock"></i>
        <span>{{ currentTime }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const currentTime = ref(new Date().toLocaleTimeString())
const isOnline = ref(navigator.onLine)
const isNfcConnected = ref(false) // À connecter avec votre service NFC

let timer: ReturnType<typeof setInterval>

const updateOnlineStatus = () => {
  isOnline.value = navigator.onLine
}

onMounted(() => {
  timer = setInterval(() => {
    currentTime.value = new Date().toLocaleTimeString()
  }, 1000)

  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
})

onUnmounted(() => {
  clearInterval(timer)
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
})
</script>

<style scoped>
.status-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 32px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  z-index: 1000;
}

.status-content {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1.5rem;
  padding: 0 1rem;
  color: var(--text-secondary);
  font-size: 12px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  opacity: 0.5;
  transition: all 0.3s ease;
}

.status-item.is-connected {
  opacity: 1;
  color: var(--color-success, #4caf50);
}

.status-item i {
  font-size: 12px;
}
</style> 