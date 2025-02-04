import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {}

// NFC API
const nfcAPI = {
  onReaderStatus: (callback: (connected: boolean) => void) => {
    ipcRenderer.on('nfc:reader-status', (_event, status) => callback(status))
  },
  onCardDetected: (callback: (uuid: string) => void) => {
    ipcRenderer.on('nfc:card-detected', (_event, uuid) => callback(uuid))
  },
  onCardRemoved: (callback: () => void) => {
    ipcRenderer.on('nfc:card-removed', () => callback())
  },
  checkReader: () => ipcRenderer.send('nfc:check-reader')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', {
      ...api,
      nfc: nfcAPI
    })
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = {
    ...api,
    nfc: nfcAPI
  }
}
