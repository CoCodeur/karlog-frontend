<template>
  <div class="home-container">
    <header class="header">
      <LogoText class="logo-text" />
      <div class="header-right">
        <div class="user-badge" :class="{ 'is-admin': userRole >= 2 }">
          <i class="fas" :class="userRole >= 2 ? 'fa-user-shield' : 'fa-user'"></i>
          {{ userRole >= 2 ? 'Administrateur' : 'Utilisateur' }}
        </div>
        <button class="logout-button" @click="handleLogout">
          <i class="fas fa-sign-out-alt"></i>
          Déconnexion
        </button>
      </div>
    </header>

    <div class="welcome-text">
      Bienvenue, {{ user?.first_name }} {{ user?.last_name }}
      <div class="company-name">{{ formatCompanyName(user?.companyName) }}</div>
    </div>

    <div class="cards-grid">
      <TaskCard v-if="userRole >= 1" />
      <!-- Autres cartes à venir en fonction du rôle -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import LogoText from './LogoText.vue'
import TaskCard from './cards/TaskCard.vue'
import authService from '../services/auth.service'
import type { User } from '../types/auth'

const router = useRouter()
const user = ref<User | null>(null)
const userRole = computed(() => user.value?.role ?? 0)

onMounted(() => {
  user.value = authService.getUser()
})

const formatCompanyName = (name?: string) => {
  if (!name) return ''
  return name.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

const handleLogout = () => {
  authService.clearSession()
  router.push('/login')
}
</script>

<style scoped>
.home-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 1rem 2rem;
}

.logo-text {
  font-size: 42px;
  font-weight: 600;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 1.5rem;
  border-radius: 20px;
  font-size: 14px;
  min-width: 160px;
  height: 32px;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
}

.user-badge i {
  font-size: 14px;
}

.user-badge.is-admin {
  color: var(--color-primary);
}

.welcome-text {
  text-align: center;
  font-size: 32px;
  color: var(--text-primary);
  margin: 2rem 0;
  font-weight: 600;
}

.company-name {
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--color-primary);
  margin-top: 0.75rem;
  opacity: 0.9;
  text-align: center;
  letter-spacing: 0.02em;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  padding: 2rem;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}

.logout-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 1rem;
  height: 32px;
  border-radius: 20px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
}

.logout-button:hover {
  background: rgba(220, 53, 69, 0.15);
  backdrop-filter: blur(12px);
  border-color: rgba(220, 53, 69, 0.3);
  color: rgb(220, 53, 69);
  box-shadow: 0 0 20px rgba(220, 53, 69, 0.1);
}

.logout-button i {
  font-size: 14px;
}

@media (max-width: 640px) {
  .header {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }

  .header-right {
    width: 100%;
    justify-content: center;
  }

  .cards-grid {
    grid-template-columns: 1fr;
    padding: 1rem;
    gap: 1rem;
  }
}
</style> 