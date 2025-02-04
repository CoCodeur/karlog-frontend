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

    <ContentLayout>
      <div class="welcome-text">
        Bienvenue, {{ user?.first_name }} {{ user?.last_name }}
        <div class="company-name">{{ formatCompanyName(user?.companyName) }}</div>
      </div>

      <CardsGrid :columns="3" gap="lg">
        <NFCCard />
        <TaskCard v-if="userRole >= 1" />
        <ActiveTasksCard v-if="userRole >= 1" />
      </CardsGrid>
    </ContentLayout>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import LogoText from './LogoText.vue'
import TaskCard from './cards/TaskCard.vue'
import ActiveTasksCard from './cards/ActiveTasksCard.vue'
import NFCCard from './cards/NFCCard.vue'
import ContentLayout from './layout/ContentLayout.vue'
import CardsGrid from './layout/CardsGrid.vue'
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
  gap: var(--spacing-lg);
  padding-bottom: calc(var(--status-bar-height) + var(--spacing-md));
  overflow-x: hidden;
}

.header {
  position: sticky;
  top: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: var(--spacing-md) var(--spacing-xl);
  background: var(--bg-overlay-light);
  backdrop-filter: blur(8px);
  z-index: var(--z-header);
  border-bottom: 1px solid var(--border-light);
}

.logo-text {
  font-size: var(--font-size-3xl);
  font-weight: 600;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.user-badge {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: calc(var(--spacing-sm) * 0.8) var(--spacing-lg);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-sm);
  min-width: 10rem;
  height: 2rem;
  justify-content: center;
  background: var(--bg-overlay-light);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-light);
  color: var(--text-secondary);
}

.user-badge i {
  font-size: var(--font-size-sm);
}

.user-badge.is-admin {
  color: var(--color-primary);
}

.welcome-text {
  text-align: center;
  font-size: var(--font-size-2xl);
  color: var(--text-primary);
  margin: 0;
  font-weight: 600;
  padding: 0 var(--spacing-md);
}

.company-name {
  font-size: var(--font-size-lg);
  font-weight: 500;
  color: var(--color-primary);
  margin-top: var(--spacing-sm);
  opacity: 0.9;
  text-align: center;
  letter-spacing: 0.02em;
}

.logout-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: calc(var(--spacing-sm) * 0.8) var(--spacing-md);
  height: 2rem;
  border-radius: var(--radius-lg);
  font-size: var(--font-size-sm);
  background: var(--bg-overlay-light);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-light);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-normal);
  white-space: nowrap;
}

.logout-button:hover {
  background: rgba(220, 53, 69, 0.15);
  backdrop-filter: blur(12px);
  border-color: rgba(220, 53, 69, 0.3);
  color: rgb(220, 53, 69);
  box-shadow: var(--shadow-md);
}

.logout-button i {
  font-size: var(--font-size-sm);
}

@media (max-width: var(--breakpoint-sm)) {
  .home-container {
    gap: var(--spacing-md);
    padding-bottom: calc(var(--status-bar-height) + var(--spacing-sm));
  }

  .header {
    flex-direction: column;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
  }

  .header-right {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
  }

  .user-badge {
    min-width: auto;
    padding: calc(var(--spacing-sm) * 0.8) var(--spacing-md);
  }

  .welcome-text {
    font-size: var(--font-size-xl);
  }

  .company-name {
    font-size: var(--font-size-md);
  }

  .logo-text {
    font-size: var(--font-size-2xl);
  }
}
</style> 