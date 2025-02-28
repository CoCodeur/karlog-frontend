import { ref } from 'vue'

class NFCService {
  private isConnectedRef = ref(false)
  private lastCardUUID = ref<string | null>(null)
  private checkReaderInterval: NodeJS.Timeout | null = null

  constructor() {
    this.initNFCDetection()
  }

  private async initNFCDetection() {
    try {
      if (!window.api?.nfc) {
        console.error('API NFC non disponible')
        return
      }

      // Nettoyage des anciens listeners potentiels
      this.cleanup()

      // Écoute des changements d'état du lecteur
      window.api.nfc.onReaderStatus((connected: boolean) => {
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

      // Vérification initiale et périodique de l'état du lecteur
      const checkReader = () => {
        window.api.nfc.checkReader()
      }

      // Vérification immédiate au démarrage
      checkReader()

      // Vérification périodique
      this.checkReaderInterval = setInterval(checkReader, 1000)
    } catch (error) {
      console.error("Erreur lors de l'initialisation NFC:", error)
    }
  }

  private cleanup() {
    if (this.checkReaderInterval) {
      clearInterval(this.checkReaderInterval)
      this.checkReaderInterval = null
    }
    // Réinitialisation des états
    this.isConnectedRef.value = false
    this.lastCardUUID.value = null
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

  public dispose() {
    this.cleanup()
  }
}

export default new NFCService()
