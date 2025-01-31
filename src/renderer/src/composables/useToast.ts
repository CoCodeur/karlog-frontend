import { ref } from 'vue'

const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error' | 'info'>('success')

export function useToast() {
  const show = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    showToast.value = false // Reset d'abord
    setTimeout(() => {
      toastMessage.value = message
      toastType.value = type
      showToast.value = true
    }, 100)
  }

  return {
    showToast,
    toastMessage,
    toastType,
    show
  }
} 