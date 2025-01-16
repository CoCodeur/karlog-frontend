<template>
  <div class="status-bar">
    <div class="status-item" :class="{ active: isOnline }">
      <i class="fa-solid" :class="isOnline ? 'fa-wifi' : 'fa-circle-xmark'"></i>
      <span>{{ isOnline ? 'Connecté' : 'Hors ligne' }}</span>
    </div>
    <div class="status-item" :class="{ active: hasNFCReader }">
      <i class="fa-solid fa-usb"></i>
      <span>{{ hasNFCReader ? 'Lecteur NFC connecté' : 'Pas de lecteur NFC' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const isOnline = ref(navigator.onLine)
const hasNFCReader = ref(false)

const updateOnlineStatus = () => {
  isOnline.value = navigator.onLine
}

// Simulation de la détection du lecteur NFC
// À remplacer par votre logique réelle de détection NFC
const checkNFCReader = async () => {
  try {
    // Ici, ajoutez votre logique de détection du lecteur NFC
    // Par exemple, via une API Electron ou une autre méthode
    hasNFCReader.value = false // À remplacer par la vraie détection
  } catch (error) {
    hasNFCReader.value = false
    console.error('Erreur lors de la détection du lecteur NFC:', error)
  }
}

onMounted(() => {
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
  checkNFCReader()
})

onUnmounted(() => {
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
  background: var(--glass-morph-background);
  backdrop-filter: var(--glass-morph-backdrop-filter);
  border-top: var(--glass-morph-border);
  box-shadow: var(--glass-morph-box-shadow);
  padding: 12px 24px;
  display: flex;
  justify-content: flex-end;
  gap: 24px;
  z-index: 1000;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--status-error);
  transition: color 0.2s ease;
}

.status-item.active {
  color: var(--status-success);
}

.status-item i {
  font-size: 16px;
}
</style> 