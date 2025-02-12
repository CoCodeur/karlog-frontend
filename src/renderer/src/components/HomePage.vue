<template>
  <div class="home-page">
    <header class="header">
      <LogoText />
      <div class="header-actions">
        <div class="user-info" :class="{ 'is-admin': userRole >= 2 }">
          <i class="fas" :class="userRole >= 2 ? 'fa-user-shield' : 'fa-user'"></i>
          <span>{{ userRole >= 2 ? 'Administrateur' : 'Utilisateur' }}</span>
        </div>
        <button class="logout-btn" @click="handleLogout">
          <i class="fas fa-sign-out-alt"></i>
          <span>Déconnexion</span>
        </button>
      </div>
    </header>

    <main class="main-content">
      <div class="welcome-section">
        <h1 class="welcome">Bienvenue, {{ user?.first_name }} {{ user?.last_name }}</h1>
        <p class="company">{{ company?.name }}</p>
      </div>

      <div class="cards-container">
        <NFCCard />
        <TaskCard v-if="userRole >= 1" @task-created="refreshTasks" />
        <ActiveTasksCard v-if="userRole >= 1" ref="activeTasksCard" />
        <AdminCard v-if="userRole >= 1" />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import LogoText from './LogoText.vue'
import TaskCard from './cards/TaskCard.vue'
import ActiveTasksCard from './cards/ActiveTasksCard.vue'
import NFCCard from './cards/NFCCard.vue'
import AdminCard from './cards/AdminCard.vue'
import authService from '../services/auth.service'
import { userService } from '../services/user.service'
import { taskService } from '../services/task.service'
import companyService from '../services/company.service'
import type { User } from '../types/auth'
import type { Company } from '../types/company'

const router = useRouter()
const user = ref<User | null>(null)
const company = ref<Company | null>(null)
const userRole = computed(() => user.value?.role ?? 0)
const activeTasksCard = ref<typeof ActiveTasksCard | null>(null)

onMounted(async () => {
  user.value = authService.getUser()
  if (user.value?.company_id) {
    try {
      company.value = await companyService.fetchCompany(user.value.company_id)
    } catch (error) {
      console.error('Erreur lors du chargement de l\'entreprise:', error)
    }
  }
  // Charger les tâches actives au démarrage
  await taskService.getActiveTasks()
})

const handleLogout = () => {
  userService.clearCache()
  taskService.clearCache()
  companyService.clearCompany()
  authService.clearSession()
  router.push('/login')
}

const refreshTasks = async () => {
  if (activeTasksCard.value) {
    await activeTasksCard.value.fetchTasks()
  }
}
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

#app {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}
</style>

<style scoped>
.home-page {
  height: 100vh;
  width: 100%;
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-y: auto;
}

.header {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
  width: 100%;
  height: 80px;
  background: rgba(var(--bg-primary-rgb), 0.8);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  padding: 1.5rem 3rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header :deep(.logo-text) {
  font-size: 2.5rem;
  margin-right: auto;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-left: auto;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 1.2rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-radius: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
}

.user-info i {
  color: var(--color-primary);
  font-size: 1rem;
}

.user-info.is-admin {
  background: rgba(var(--color-primary-rgb), 0.1);
  border: 1px solid rgba(var(--color-primary-rgb), 0.2);
  box-shadow: 0 4px 6px rgba(var(--color-primary-rgb), 0.1);
  color: var(--color-primary);
}

.user-info.is-admin i {
  color: var(--color-primary);
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  background: var(--color-primary);
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  font-weight: 500;
  color: white;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.logout-btn:hover {
  background: #dc3545;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(220, 53, 69, 0.2);
}

.logout-btn i {
  font-size: 0.9rem;
}

.main-content {
  flex: 1;
  padding: 1rem 2rem;
  max-width: 1800px;
  margin: 80px auto 0;
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
}

.welcome-section {
  text-align: center;
  margin: 2.5rem 0 3.5rem;
  padding: 1rem;
}

.welcome-section h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
  line-height: 1.2;
}

.company {
  font-size: 1.2rem;
  color: var(--color-primary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 0.25rem;
}

.cards-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  width: 100%;
  justify-items: center;
  padding-bottom: 2rem;
  flex: 1;
}

.cards-container > * {
  width: 100%;
  max-width: 420px;
  min-width: 360px;
  height: 600px;
}

@media (max-width: 1600px) {
  .cards-container {
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
  }

  .cards-container > * {
    max-width: 100%;
    min-width: 380px;
  }
}

@media (max-width: 768px) {
  .header {
    position: fixed;
    height: auto;
    min-height: 120px;
    padding: 1rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    background: rgba(var(--bg-primary-rgb), 0.8);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }

  .header :deep(.logo-text) {
    font-size: 2rem;
    margin: 0;
    align-self: flex-start;
    order: -2;
  }

  .header-actions {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
    order: -1;
  }

  .main-content {
    margin-top: 160px;
    padding: 1rem;
  }

  .welcome-section {
    margin: 1.5rem 0 2.5rem;
  }

  .welcome-section h1 {
    font-size: 2rem;
  }

  .company {
    font-size: 1rem;
  }

  .cards-container {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    padding: 0 1rem 2rem;
  }

  .cards-container > * {
    min-width: unset;
    max-width: 100%;
  }
}

@media (max-width: 480px) {
  .welcome-section h1 {
    font-size: 1.5rem;
  }

  .user-info, .logout-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
