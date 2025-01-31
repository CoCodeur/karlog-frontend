<template>
  <div class="login-container">
    <form class="form-container" @submit.prevent="handleSubmit">
      <LogoText />
      <div class="form-group">
        <label class="form-label">Email</label>
        <input
          type="email"
          class="form-input"
          v-model="email"
          required
          placeholder="exemple@email.com"
        />
      </div>
      <div class="form-group">
        <label class="form-label">Mot de passe</label>
        <input
          type="password"
          class="form-input"
          v-model="password"
          required
          placeholder="••••••••"
        />
      </div>
      <button type="submit" class="button-primary">
        <i class="fas fa-sign-in-alt"></i>
        <span>Se connecter</span>
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import LogoText from '../components/LogoText.vue'
import authService from '../services/auth.service'
import { useToast } from '../composables/useToast'

const router = useRouter()
const { show: showToast } = useToast()
const email = ref('')
const password = ref('')

const handleSubmit = async () => {
  try {
    await authService.login({
      email: email.value,
      password: password.value
    })
    router.push('/')
  } catch (error: any) {
    showToast(error.message || 'Erreur de connexion', 'error')
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
}

.form-container {
  width: 100%;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.form-input {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.75rem;
  color: var(--text-primary);
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.form-input:hover {
  border-color: rgba(var(--color-primary-rgb), 0.3);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  background: rgba(var(--color-primary-rgb), 0.05);
}

.button-primary {
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.button-primary i {
  font-size: 14px;
}

.button-primary:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
}

.button-primary:active {
  transform: translateY(0);
}

@media (max-width: 480px) {
  .form-container {
    max-width: 280px;
  }
}
</style> 