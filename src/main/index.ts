import { app, shell, BrowserWindow, ipcMain, session } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { nfcManager } from './nfc'

function createWindow(): void {
  console.log('Mode:', process.env.NODE_ENV)
  console.log('API URL:', process.env.VITE_API_URL)
  
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      devTools: true,
      webSecurity: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // CSP en production avec autorisation de l'API externe
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const apiUrl = process.env['VITE_API_URL'] || 'http://91.108.122.35:3000'
    console.log('🔒 Configuration CSP :', {
      mode: process.env.NODE_ENV,
      apiUrl: apiUrl
    })

    const headers = {
      ...details.responseHeaders,
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "font-src 'self' data:",
        "img-src 'self' data:",
        `connect-src 'self' ${apiUrl}`
      ].join('; ')
    }
    console.log('🚀 Headers CSP appliqués :', {
      csp: headers['Content-Security-Policy']
    })

    callback({ responseHeaders: headers })
  })

  // Set up NFC manager with the main window
  nfcManager.setMainWindow(mainWindow)

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    // Ouvrir les DevTools au démarrage
    mainWindow.webContents.openDevTools()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Simple test IPC
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
