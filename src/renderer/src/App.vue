<script setup lang="ts">
import StatusBar from './components/StatusBar.vue'
import Toaster from './components/Toaster.vue'
import { useToast } from './composables/useToast'

const { showToast, toastMessage, toastType } = useToast()
</script>

<template>
  <div class="app-container">
    <router-view />
    <StatusBar />
  </div>
  <Toaster 
    v-if="showToast"
    :message="toastMessage"
    :type="toastType"
    :duration="3000"
  />
</template>

<style>
:root {
  --color-primary: #8957E5;
  --color-primary-hover: #7B4FCC;
  --color-primary-light: #A37EE8;
  --text-primary: #FFFFFF;
  --text-secondary: rgba(255, 255, 255, 0.7);
  --status-error: #FF4D4D;
  --glass-morph-background: rgba(255, 255, 255, 0.05);
  --glass-morph-backdrop-filter: blur(12px);
  --glass-morph-border: 1px solid rgba(255, 255, 255, 0.1);
  --glass-morph-box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  --glass-background: rgba(255, 255, 255, 0.05);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-shine: linear-gradient(120deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0) 70%);
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
  background: 
    radial-gradient(circle at 100% 0%, rgba(137, 87, 229, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 0% 100%, rgba(137, 87, 229, 0.15) 0%, transparent 50%),
    linear-gradient(135deg, #1F1F1F 0%, #2D2B42 100%);
  font-family: Inter, system-ui, -apple-system, sans-serif;
  color: var(--text-primary);
}

#app {
  width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

/* Animation pour le glassmorphisme */
@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* Style global pour les conteneurs avec effet glassmorphisme */
.glass-container {
  background: var(--glass-morph-background);
  backdrop-filter: var(--glass-morph-backdrop-filter);
  border: var(--glass-morph-border);
  box-shadow: var(--glass-morph-box-shadow);
  border-radius: 16px;
  position: relative;  
  overflow: hidden;
}

.glass-container::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: var(--glass-shine);
  transform: rotate(25deg);
  animation: shine 8s ease-in-out infinite;
  pointer-events: none;
  opacity: 0.5;
}

@keyframes shine {
  0% {
    transform: rotate(25deg) translateY(-50%);
  }
  50% {
    transform: rotate(25deg) translateY(0%);
  }
  100% {
    transform: rotate(25deg) translateY(-50%);
  }
}

.app-container {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.app {
  min-height: 100vh;
  position: relative;
}

/* Ajout du style pour le nom de la company */
.company-name {
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--color-primary);
  margin-top: 0.75rem;
  opacity: 0.9;
  text-align: center;
  letter-spacing: 0.02em;
}
</style>
