<template>
  <Transition name="toast">
    <div v-if="show" class="toast" :class="type">
      <div class="toast-content">
        <i class="fas" :class="icon"></i>
        <span>{{ message }}</span>
      </div>
      <div class="progress-bar" :style="{ animationDuration: `${duration}ms` }"></div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

const props = defineProps<{
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
}>()

const show = ref(false)
const icon = computed(() => {
  switch (props.type) {
    case 'success':
      return 'fa-check-circle'
    case 'error':
      return 'fa-exclamation-circle'
    default:
      return 'fa-info-circle'
  }
})

onMounted(() => {
  show.value = true
  setTimeout(() => {
    show.value = false
  }, props.duration || 3000)
})
</script>

<style scoped>
.toast {
  position: fixed;
  top: 1rem;
  right: 1rem;
  transform: translateX(0);
  background: rgba(var(--color-primary-rgb), 0.1);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(var(--color-primary-rgb), 0.2);
  border-radius: 12px;
  padding: 0.75rem 1.25rem;
  color: var(--text-primary);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  min-width: 300px;
  max-width: 400px;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.95rem;
}

.toast i {
  font-size: 1.25rem;
  color: var(--color-primary);
}

.toast.success {
  background: rgba(var(--color-primary-rgb), 0.1);
  border-color: rgba(var(--color-primary-rgb), 0.3);
}

.toast.error {
  background: rgba(var(--status-error-rgb), 0.1);
  border-color: rgba(var(--status-error-rgb), 0.3);
}

.progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
  border-radius: 0 0 12px 12px;
  animation: progress linear forwards;
  box-shadow: 0 0 10px rgba(var(--color-primary-rgb), 0.3);
}

@keyframes progress {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

@media (max-width: 640px) {
  .toast {
    min-width: calc(100% - 2rem);
    margin: 0 1rem;
  }
}
</style> 