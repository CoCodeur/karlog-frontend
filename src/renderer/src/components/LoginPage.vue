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
            :type="showPassword ? 'text' : 'password'"
            required
            class="input"
            :disabled="isLoading"
          />
          <button
            type="button"
            class="visibility-button"
            @click="showPassword = !showPassword"
            :disabled="isLoading"
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

    console.log(credentials)

    await authService.login(credentials)
    router.push('/')
  } catch (error: any) {
    if (error.response?.status === 401) {
      loginError.value = 'Email ou mot de passe incorrect'
    } else if (error.response?.data?.message) {
      loginError.value = error.response.data.message
    } else {
      loginError.value = JSON.stringify(error)
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
  }
  to {
    opacity: 1;
  }
}

@keyframes focusRing {
  0% {
    box-shadow: 0 0 0 0px var(--color-primary-light);
  }
  100% {
    box-shadow: 0 0 0 4px transparent;
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
}

.login-form {
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
  border: 1px solid var(--glass-border);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 14px;
  transition: all 0.3s ease;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary);
  animation: focusRing 2s ease-out;
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

.visibility-button:hover {
  color: var(--color-primary);
}

.visibility-button i {
  font-size: 18px;
}

.submit-button {
  width: 100%;
  padding: 12px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.submit-button:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
}

.submit-button:active {
  transform: translateY(0);
}

.error-message {
  color: var(--status-error);
  font-size: 13px;
  padding: 8px 12px;
  background: color-mix(in srgb, var(--status-error) 15%, transparent);
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  animation: errorFade 0.3s ease-out;
}
</style>
