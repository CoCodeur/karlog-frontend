<template>
  <div class="status-bar">
    <div class="status-content">
      <div class="status-item" :class="{ 'is-connected': isOnline, 'is-disconnected': !isOnline }">
        <i
          class="fas"
          :class="[
            isOnline ? 'fa-wifi' : 'fa-wifi-slash',
            isOnline ? 'text-success' : 'text-error'
          ]"
        ></i>
        <span :class="isOnline ? 'text-success' : 'text-error'">{{
          isOnline ? 'Connecté' : 'Hors ligne'
        }}</span>
      </div>
      <div
        class="status-item"
        :class="{ 'is-connected': isConnected, 'is-disconnected': !isConnected }"
      >
        <i class="fas fa-wave-square" :class="isConnected ? 'text-success' : 'text-error'"></i>
        <span :class="isConnected ? 'text-success' : 'text-error'">{{
          isConnected ? 'Lecteur NFC connecté' : 'Lecteur NFC déconnecté'
        }}</span>
      </div>
      <div class="status-item">
        <i class="fas fa-clock"></i>
        <span>{{ currentTime }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import nfcService from '@renderer/services/nfc.service'

const currentTime = ref(new Date().toLocaleTimeString())
const isOnline = ref(navigator.onLine)
const isConnected = computed(() => nfcService.isConnected.value)

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
  opacity: 0.8;
  transition: all 0.3s ease;
}

.status-item.is-connected {
  opacity: 1;
}

.status-item.is-disconnected {
  opacity: 1;
}

.status-item i {
  font-size: 12px;
}

.text-success {
  color: var(--color-success) !important;
}

.text-error {
  color: var(--color-error, #dc3545) !important;
}
</style>
