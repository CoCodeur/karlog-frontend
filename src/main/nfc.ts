import { ipcMain } from 'electron'
import { NFC } from 'nfc-pcsc'

class NFCManager {
  private nfc: NFC
  private mainWindow: Electron.BrowserWindow | null = null
  private readers: Map<string, any> = new Map()

  constructor() {
    this.nfc = new NFC()
    this.setupNFCEvents()
    this.setupIPCHandlers()
  }

  public setMainWindow(window: Electron.BrowserWindow) {
    this.mainWindow = window
  }

  private setupIPCHandlers() {
    ipcMain.on('nfc:check-reader', () => {
      console.log('Checking NFC readers...', {
        readersCount: this.readers.size,
        readerNames: Array.from(this.readers.keys())
      })
      this.mainWindow?.webContents.send('nfc:reader-status', this.readers.size > 0)
    })
  }

  private setupNFCEvents() {
    // Événement déclenché lorsqu'un lecteur est connecté
    this.nfc.on('reader', reader => {
      console.log('Reader connected:', {
        name: reader.name,
        reader: reader
      })

      this.readers.set(reader.name, reader)
      this.mainWindow?.webContents.send('nfc:reader-status', true)

      // Événement déclenché lorsqu'une carte est présentée au lecteur
      reader.on('card', card => {
        console.log('Card detected:', {
          uid: card.uid,
          type: card.type,
          standard: card.standard
        })
        this.mainWindow?.webContents.send('nfc:card-detected', card.uid)
      })

      // Événement déclenché lorsqu'une carte est retirée
      reader.on('card.off', () => {
        console.log('Card removed')
        this.mainWindow?.webContents.send('nfc:card-removed')
      })

      // Gestion des erreurs du lecteur
      reader.on('error', error => {
        console.error(`Reader error (${reader.name}):`, error)
      })

      // Gestion de l'état du lecteur
      reader.on('end', () => {
        console.log(`Reader ${reader.name} removed`)
        this.readers.delete(reader.name)
        this.mainWindow?.webContents.send('nfc:reader-status', this.readers.size > 0)
      })
    })

    // Événement déclenché lorsqu'un lecteur est déconnecté
    this.nfc.on('reader.off', reader => {
      console.log('Reader disconnected:', reader.name)
      this.readers.delete(reader.name)
      this.mainWindow?.webContents.send('nfc:reader-status', this.readers.size > 0)
    })

    // Gestion des erreurs globales
    this.nfc.on('error', error => {
      console.error('Global NFC error:', error)
      this.mainWindow?.webContents.send('nfc:reader-status', false)
    })
  }
}

export const nfcManager = new NFCManager() 