<template>
  <teleport to="body">
    <!-- Notification de mise à jour disponible -->
    <transition name="slide-down">
      <div
        v-if="updaterStore.isUpdateAvailable"
        class="update-notification update-available"
      >
        <div class="update-content">
          <div class="update-icon">
            <i class="fas fa-download"></i>
          </div>
          <div class="update-info">
            <h4>Mise à jour disponible</h4>
            <p>Version {{ updaterStore.updateInfo?.version }} est disponible</p>
          </div>
          <div class="update-actions">
            <button 
              class="btn btn-primary btn-sm" 
              @click="downloadUpdate"
              :disabled="updaterStore.isDownloading"
            >
              Télécharger
            </button>
            <button 
              class="btn btn-secondary btn-sm" 
              @click="dismissUpdate"
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Notification de téléchargement en cours -->
    <transition name="slide-down">
      <div
        v-if="updaterStore.isDownloading"
        class="update-notification update-downloading"
      >
        <div class="update-content">
          <div class="update-icon">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <div class="update-info">
            <h4>Téléchargement en cours</h4>
            <p>{{ updaterStore.message }}</p>
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: updaterStore.downloadProgressPercentage + '%' }"
              ></div>
            </div>
            <div class="download-stats">
              <span>{{ updaterStore.downloadProgressPercentage }}%</span>
              <span v-if="updaterStore.formattedDownloadSpeed">
                {{ updaterStore.formattedDownloadSpeed }}
              </span>
              <span v-if="updaterStore.formattedFileSize">
                {{ updaterStore.formattedFileSize }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Notification de mise à jour prête -->
    <transition name="slide-down">
      <div
        v-if="updaterStore.isUpdateReady"
        class="update-notification update-ready"
      >
        <div class="update-content">
          <div class="update-icon">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="update-info">
            <h4>Mise à jour prête</h4>
            <p>L'application va redémarrer pour installer la mise à jour</p>
          </div>
          <div class="update-actions">
            <button 
              class="btn btn-primary btn-sm" 
              @click="installUpdate"
            >
              Redémarrer maintenant
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Notification d'erreur -->
    <transition name="slide-down">
      <div
        v-if="updaterStore.error"
        class="update-notification update-error"
      >
        <div class="update-content">
          <div class="update-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <div class="update-info">
            <h4>Erreur de mise à jour</h4>
            <p>{{ updaterStore.error }}</p>
          </div>
          <div class="update-actions">
            <button 
              class="btn btn-secondary btn-sm" 
              @click="dismissError"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { useUpdaterStore } from '@renderer/stores/updater'

const updaterStore = useUpdaterStore()

const downloadUpdate = async (): Promise<void> => {
  await updaterStore.downloadUpdate()
}

const installUpdate = async (): Promise<void> => {
  await updaterStore.installUpdate()
}

const dismissUpdate = (): void => {
  updaterStore.dismissUpdate()
}

const dismissError = (): void => {
  updaterStore.dismissError()
}
</script>

<style scoped>
.update-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  max-width: 400px;
  min-width: 300px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-left: 4px solid;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.update-available {
  border-left-color: #3b82f6;
}

.update-downloading {
  border-left-color: #f59e0b;
}

.update-ready {
  border-left-color: #10b981;
}

.update-error {
  border-left-color: #ef4444;
}

.update-content {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  gap: 12px;
}

.update-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.update-available .update-icon {
  color: #3b82f6;
}

.update-downloading .update-icon {
  color: #f59e0b;
}

.update-ready .update-icon {
  color: #10b981;
}

.update-error .update-icon {
  color: #ef4444;
}

.update-info {
  flex: 1;
}

.update-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.update-info p {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.4;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
  margin: 8px 0 4px 0;
}

.progress-fill {
  height: 100%;
  background: #3b82f6;
  transition: width 0.3s ease;
  border-radius: 2px;
}

.download-stats {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: #6b7280;
  margin-top: 4px;
}

.download-stats span {
  padding: 0 4px;
  background: #f3f4f6;
  border-radius: 3px;
}

.update-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
}

.btn {
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  min-width: 80px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-secondary {
  background: #e5e7eb;
  color: #374151;
}

.btn-secondary:hover {
  background: #d1d5db;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 11px;
}

/* Animations */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}

.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>