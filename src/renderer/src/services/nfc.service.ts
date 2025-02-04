import { ref, watchEffect } from 'vue'

class NFCService {
  private isConnectedRef = ref(false)
  private lastCardUUID = ref<string | null>(null)

  constructor() {
    this.initNFCDetection()
  }

  private async initNFCDetection() {
    try {
      if (!window.api?.nfc) {
        console.error('API NFC non disponible')
        return
      }

      window.api.nfc.onReaderStatus((connected: boolean) => {
        console.log('Reader status changed:', connected)
        this.isConnectedRef.value = connected
        if (!connected) {
          this.lastCardUUID.value = null
        }
      })

      window.api.nfc.onCardDetected((uuid: string) => {
        console.log('Card detected:', uuid)
        this.lastCardUUID.value = uuid
      })

      window.api.nfc.onCardRemoved(() => {
        console.log('Card removed')
        this.lastCardUUID.value = null
      })

      // Vérification périodique de l'état du lecteur
      setInterval(() => {
        window.api.nfc.checkReader()
      }, 1000)

      // Vérification initiale
      window.api.nfc.checkReader()
    } catch (error) {
      console.error('Erreur lors de l\'initialisation NFC:', error)
    }
  }

  public get isConnected() {
    return this.isConnectedRef
  }

  public get cardUUID() {
    return this.lastCardUUID
  }

  public resetCardUUID() {
    this.lastCardUUID.value = null
  }
}

export default new NFCService() 