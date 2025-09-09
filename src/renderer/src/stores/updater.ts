import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface UpdateInfo {
  version: string
  releaseDate?: string
  releaseName?: string
  releaseNotes?: string
}

export interface UpdateProgress {
  percent: number
  bytesPerSecond: number
  total: number
  transferred: number
}

export interface UpdateStatus {
  status: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'
  message: string
  data?: UpdateInfo | UpdateProgress | { error: string }
  timestamp: number
}

export const useUpdaterStore = defineStore('updater', () => {
  // État réactif
  const currentStatus = ref<UpdateStatus['status']>('idle')
  const message = ref<string>('')
  const updateInfo = ref<UpdateInfo | null>(null)
  const downloadProgress = ref<UpdateProgress | null>(null)
  const error = ref<string | null>(null)
  const lastCheck = ref<number | null>(null)
  const isUpdateAvailable = ref<boolean>(false)
  const isDownloading = ref<boolean>(false)
  const isUpdateReady = ref<boolean>(false)
  
  // Getters calculés
  const canCheckForUpdates = computed(() => 
    currentStatus.value === 'idle' || 
    currentStatus.value === 'not-available' || 
    currentStatus.value === 'error'
  )
  
  const canDownloadUpdate = computed(() => 
    currentStatus.value === 'available'
  )
  
  const canInstallUpdate = computed(() => 
    currentStatus.value === 'downloaded'
  )

  const downloadProgressPercentage = computed(() => 
    downloadProgress.value?.percent || 0
  )

  const formattedDownloadSpeed = computed(() => {
    if (!downloadProgress.value?.bytesPerSecond) return ''
    const speed = downloadProgress.value.bytesPerSecond
    if (speed > 1024 * 1024) {
      return `${(speed / (1024 * 1024)).toFixed(1)} MB/s`
    }
    return `${(speed / 1024).toFixed(1)} KB/s`
  })

  const formattedFileSize = computed(() => {
    if (!downloadProgress.value?.total) return ''
    const size = downloadProgress.value.total
    if (size > 1024 * 1024 * 1024) {
      return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`
    }
    if (size > 1024 * 1024) {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`
    }
    return `${(size / 1024).toFixed(1)} KB`
  })

  // Actions
  const updateStatus = (status: UpdateStatus) => {
    currentStatus.value = status.status
    message.value = status.message
    lastCheck.value = status.timestamp

    // Reset des états précédents
    error.value = null
    isUpdateAvailable.value = false
    isDownloading.value = false
    isUpdateReady.value = false
    downloadProgress.value = null

    // Traitement spécifique selon le status
    switch (status.status) {
      case 'available':
        isUpdateAvailable.value = true
        updateInfo.value = status.data as UpdateInfo
        break

      case 'downloading':
        isDownloading.value = true
        downloadProgress.value = status.data as UpdateProgress
        break

      case 'downloaded':
        isUpdateReady.value = true
        updateInfo.value = status.data as UpdateInfo
        break

      case 'error':
        error.value = (status.data as { error: string })?.error || 'Erreur inconnue'
        break

      case 'not-available':
        // Pas de mise à jour disponible
        break
    }
  }

  const checkForUpdates = async (): Promise<void> => {
    if (!canCheckForUpdates.value) return

    try {
      const result = await window.electron.ipcRenderer.invoke('check-for-updates')
      if (!result.success) {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des mises à jour:', error)
      updateStatus({
        status: 'error',
        message: `Erreur: ${error.message}`,
        data: { error: error.message },
        timestamp: Date.now()
      })
    }
  }

  const downloadUpdate = async (): Promise<void> => {
    if (!canDownloadUpdate.value) return

    try {
      const result = await window.electron.ipcRenderer.invoke('download-update')
      if (!result.success) {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error)
      updateStatus({
        status: 'error',
        message: `Erreur de téléchargement: ${error.message}`,
        data: { error: error.message },
        timestamp: Date.now()
      })
    }
  }

  const installUpdate = async (): Promise<void> => {
    if (!canInstallUpdate.value) return

    try {
      await window.electron.ipcRenderer.invoke('install-update')
    } catch (error) {
      console.error('Erreur lors de l\'installation:', error)
      updateStatus({
        status: 'error',
        message: `Erreur d'installation: ${error.message}`,
        data: { error: error.message },
        timestamp: Date.now()
      })
    }
  }

  const dismissUpdate = (): void => {
    if (currentStatus.value === 'available') {
      currentStatus.value = 'idle'
      isUpdateAvailable.value = false
      message.value = ''
    }
  }

  const dismissError = (): void => {
    if (currentStatus.value === 'error') {
      currentStatus.value = 'idle'
      error.value = null
      message.value = ''
    }
  }

  // Fonction d'initialisation pour écouter les événements
  const initializeUpdater = (): void => {
    // Écouter les mises à jour de status depuis le processus principal
    window.electron.ipcRenderer.on('update-status', (event, status: UpdateStatus) => {
      updateStatus(status)
    })
  }

  return {
    // État
    currentStatus: readonly(currentStatus),
    message: readonly(message),
    updateInfo: readonly(updateInfo),
    downloadProgress: readonly(downloadProgress),
    error: readonly(error),
    lastCheck: readonly(lastCheck),
    isUpdateAvailable: readonly(isUpdateAvailable),
    isDownloading: readonly(isDownloading),
    isUpdateReady: readonly(isUpdateReady),

    // Getters
    canCheckForUpdates,
    canDownloadUpdate,
    canInstallUpdate,
    downloadProgressPercentage,
    formattedDownloadSpeed,
    formattedFileSize,

    // Actions
    checkForUpdates,
    downloadUpdate,
    installUpdate,
    dismissUpdate,
    dismissError,
    initializeUpdater
  }
})