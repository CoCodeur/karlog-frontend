import { autoUpdater } from 'electron-updater'
import { BrowserWindow, dialog, app } from 'electron'
import { is } from '@electron-toolkit/utils'

export class UpdateManager {
  private mainWindow: BrowserWindow | null = null
  private updateCheckInProgress = false

  constructor() {
    this.configureAutoUpdater()
    this.setupEventListeners()
  }

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window
  }

  private configureAutoUpdater(): void {
    // Configuration basée sur l'environnement
    if (is.dev) {
      // En développement, utiliser le fichier de dev
      autoUpdater.updateConfigPath = 'dev-app-update.yml'
      autoUpdater.forceDevUpdateConfig = true
    }

    // Configuration générale
    autoUpdater.autoDownload = false // Demander confirmation avant téléchargement
    autoUpdater.autoInstallOnAppQuit = true
    autoUpdater.allowPrerelease = false

    // Logs détaillés en développement
    if (is.dev) {
      autoUpdater.logger = console
    }
  }

  private setupEventListeners(): void {
    autoUpdater.on('checking-for-update', () => {
      this.sendUpdateStatus('checking', 'Vérification des mises à jour...')
    })

    autoUpdater.on('update-available', (info) => {
      this.sendUpdateStatus('available', `Mise à jour disponible: v${info.version}`, info)
      this.showUpdateAvailableDialog(info)
    })

    autoUpdater.on('update-not-available', () => {
      this.sendUpdateStatus('not-available', 'Aucune mise à jour disponible')
      this.updateCheckInProgress = false
    })

    autoUpdater.on('error', (error) => {
      this.sendUpdateStatus('error', `Erreur lors de la vérification: ${error.message}`, { error: error.message })
      this.updateCheckInProgress = false
      
      if (is.dev) {
        console.error('Update error:', error)
      }
    })

    autoUpdater.on('download-progress', (progressObj) => {
      const logMessage = `Téléchargement: ${Math.round(progressObj.percent)}%`
      this.sendUpdateStatus('downloading', logMessage, {
        percent: Math.round(progressObj.percent),
        bytesPerSecond: progressObj.bytesPerSecond,
        total: progressObj.total,
        transferred: progressObj.transferred
      })
    })

    autoUpdater.on('update-downloaded', (info) => {
      this.sendUpdateStatus('downloaded', 'Mise à jour téléchargée et prête à installer', info)
      this.showUpdateReadyDialog(info)
    })
  }

  private sendUpdateStatus(status: string, message: string, data?: any): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('update-status', {
        status,
        message,
        data,
        timestamp: Date.now()
      })
    }
  }

  private async showUpdateAvailableDialog(info: any): Promise<void> {
    if (!this.mainWindow) return

    const response = await dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'Mise à jour disponible',
      message: `Une nouvelle version (v${info.version}) est disponible.`,
      detail: 'Voulez-vous la télécharger maintenant ?',
      buttons: ['Télécharger', 'Plus tard'],
      defaultId: 0,
      cancelId: 1
    })

    if (response.response === 0) {
      this.downloadUpdate()
    }
  }

  private async showUpdateReadyDialog(info: any): Promise<void> {
    if (!this.mainWindow) return

    const response = await dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'Mise à jour prête',
      message: `La version ${info.version} a été téléchargée.`,
      detail: 'L\'application va redémarrer pour appliquer la mise à jour.',
      buttons: ['Redémarrer maintenant', 'Redémarrer plus tard'],
      defaultId: 0,
      cancelId: 1
    })

    if (response.response === 0) {
      this.installUpdate()
    }
  }

  async checkForUpdates(): Promise<void> {
    if (this.updateCheckInProgress) {
      return
    }

    this.updateCheckInProgress = true

    try {
      await autoUpdater.checkForUpdates()
    } catch (error) {
      this.updateCheckInProgress = false
      throw error
    }
  }

  async downloadUpdate(): Promise<void> {
    try {
      await autoUpdater.downloadUpdate()
    } catch (error) {
      this.sendUpdateStatus('error', `Erreur lors du téléchargement: ${error.message}`)
      throw error
    }
  }

  installUpdate(): void {
    autoUpdater.quitAndInstall(false, true)
  }

  // Vérification automatique au démarrage (après 10 secondes)
  startPeriodicUpdateCheck(): void {
    setTimeout(() => {
      this.checkForUpdates().catch(() => {
        // Erreur silencieuse pour la vérification automatique
      })
    }, 10000)

    // Vérification périodique toutes les 4 heures
    setInterval(() => {
      this.checkForUpdates().catch(() => {
        // Erreur silencieuse pour la vérification automatique
      })
    }, 4 * 60 * 60 * 1000)
  }
}

export const updateManager = new UpdateManager()