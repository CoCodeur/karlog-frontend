<template>
  <BaseCard title="Lecteur NFC" icon="fa-wave-square">
    <div class="nfc-status" :class="{ connected: isConnected }">
      <div class="status-icon">
        <i
          class="fas"
          :class="{
            'fa-wave-square text-success': isConnected,
            'fa-plug text-warning': !isConnected
          }"
        ></i>
      </div>
      <div class="status-text">
        <div class="status-label" :class="{ 'text-success': isConnected }">
          {{ isConnected ? 'Lecteur NFC connecté' : 'Lecteur NFC non connecté' }}
        </div>
        <div class="status-message">
          <template v-if="cardUUID">
            Carte détectée: <span class="card-uid">{{ cardUUID }}</span>
          </template>
          <template v-else>
            {{
              isConnected
                ? 'Posez une carte pour commencer une tâche'
                : 'Veuillez brancher le lecteur NFC'
            }}
          </template>
        </div>
      </div>
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseCard from '../base/BaseCard.vue'
import nfcService from '../../services/nfc.service'

const isConnected = computed(() => nfcService.isConnected.value)
const cardUUID = computed(() => nfcService.cardUUID.value)
</script>

<style scoped>
.nfc-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-lg);
  text-align: center;
  padding: var(--spacing-xl);
  background: var(--bg-overlay-light);
  border-radius: var(--radius-md);
  transition: var(--transition-normal);
  min-height: calc(100vh - 20rem);
  justify-content: center;
}

.status-icon i {
  font-size: var(--font-size-2xl);
  transition: var(--transition-normal);
}

.status-text {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.status-label {
  font-weight: 600;
  font-size: var(--font-size-lg);
  transition: var(--transition-normal);
}

.status-message {
  color: var(--text-secondary);
  font-size: var(--font-size-md);
  line-height: 1.5;
}

.card-uid {
  color: var(--color-primary);
  font-family: monospace;
  font-size: var(--font-size-lg);
  font-weight: 500;
}

.text-success {
  color: var(--color-success);
}

.text-warning {
  color: var(--color-warning);
}

@media (max-width: var(--breakpoint-sm)) {
  .nfc-status {
    padding: var(--spacing-lg);
    gap: var(--spacing-md);
    min-height: calc(100vh - 22rem);
  }

  .status-icon i {
    font-size: var(--font-size-xl);
  }

  .status-label {
    font-size: var(--font-size-md);
  }

  .status-message {
    font-size: var(--font-size-sm);
  }

  .card-uid {
    font-size: var(--font-size-md);
  }
}
</style>
