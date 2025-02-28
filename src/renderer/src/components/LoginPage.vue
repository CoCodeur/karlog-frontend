<template>
  <div class="login-container">
    <form class="login-form" @submit.prevent="handleSubmit">
      <LogoText />

      <div class="form-group">
        <label class="label">Email</label>
        <input
          v-model="email"
          type="email"
          required
          class="input"
          placeholder="exemple@karlog.fr"
          :disabled="isLoading"
        />
      </div>

      <div class="form-group">
        <label class="label">Mot de passe</label>
        <div class="password-input">
          <input
            v-model="password"
            placeholder="********"
            :type="showPassword ? 'text' : 'password'"
            required
            class="input"
            :disabled="isLoading"
          />
          <button
            type="button"
            class="visibility-button"
            :disabled="isLoading"
            @click="showPassword = !showPassword"
          >
            <i class="fas" :class="showPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
          </button>
        </div>
      </div>

      <div v-if="loginError" class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        {{ loginError }}
      </div>

      <button type="submit" class="submit-button" :disabled="isLoading">
        <span v-if="isLoading">Connexion en cours...</span>
        <span v-else>Se connecter</span>
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import LogoText from './LogoText.vue'
import authService from '../services/auth.service'
import type { LoginCredentials } from '../types/auth'

const router = useRouter()
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loginError = ref('')
const isLoading = ref(false)

const handleSubmit = async () => {
  if (isLoading.value) return

  try {
    isLoading.value = true
    loginError.value = ''

    const credentials: LoginCredentials = {
      email: email.value,
      password: password.value
    }

    await authService.login(credentials)
    router.push('/')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Login error:', error)
    if (error.response?.status === 401) {
      loginError.value = 'Email ou mot de passe incorrect'
    } else if (error.response?.data?.message) {
      loginError.value = error.response.data.message
    } else if (error.message) {
      const err = error as Error
      loginError.value = JSON.stringify(err)
    } else {
      loginError.value = 'Une erreur est survenue lors de la connexion'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes errorFade {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-container {
  background: var(--glass-morph-background);
  backdrop-filter: var(--glass-morph-backdrop-filter);
  border: var(--glass-morph-border);
  box-shadow: var(--glass-morph-box-shadow);
  padding: 2.5rem;
  width: 400px;
  border-radius: 16px;
  animation: fadeIn 0.8s ease-out;
  position: relative;
  overflow: hidden;
}

.login-form {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.login-form :deep(.logo-text) {
  margin-bottom: 2rem;
  text-align: center;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.label {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.input {
  width: 100%;
  padding: 12px;
  background: var(--glass-background);
  border: var(--glass-morph-border);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  transition: all 0.3s ease;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary);
  background: rgba(255, 255, 255, 0.1);
}

.input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input::placeholder {
  color: var(--text-secondary);
}

.password-input {
  position: relative;
  width: 100%;
}

.password-input input {
  padding-right: 40px;
}

.visibility-button {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.3s ease;
}

.visibility-button:not(:disabled):hover {
  color: var(--color-primary);
}

.visibility-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.visibility-button i {
  font-size: 18px;
}

.submit-button {
  width: 100%;
  padding: 1rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  letter-spacing: 0.02em;
}

.submit-button:disabled {
  background: rgba(137, 87, 229, 0.3);
  cursor: not-allowed;
  opacity: 0.7;
}

.submit-button:not(:disabled):hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
}

.submit-button:not(:disabled):active {
  transform: translateY(0);
}

.error-message {
  color: var(--status-error);
  font-size: 13px;
  padding: 8px 12px;
  background: rgba(255, 77, 77, 0.1);
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  animation: errorFade 0.3s ease-out;
  border: 1px solid rgba(255, 77, 77, 0.2);
}

.error-message i {
  font-size: 16px;
}
</style>
