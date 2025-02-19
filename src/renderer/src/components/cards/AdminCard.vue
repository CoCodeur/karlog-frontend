<template>
  <div class="card">
    <div class="card-header">
      <div class="icon-wrapper">
        <i class="fas fa-tools"></i>
      </div>
      <h2 class="card-title">Administration</h2>
    </div>

    <div class="admin-buttons">
      <template v-if="userRole >= 2">
        <button class="admin-btn" @click="showDashboardCard = true">
          <i class="fas fa-chart-pie"></i>
          <span>Tableau de bord</span>
        </button>
        <button class="admin-btn" @click="showUsersCard = true">
          <i class="fas fa-users"></i>
          <span>Utilisateurs</span>
        </button>
        <button class="admin-btn" @click="showGaragesCard = true">
          <i class="fas fa-building"></i>
          <span>Garages</span>
        </button>
      </template>
      <template v-else-if="userRole === 1">
        <button class="admin-btn" @click="showUsersCard = true">
          <i class="fas fa-users"></i>
          <span>Utilisateurs</span>
        </button>
      </template>
    </div>
  </div>

  <DashboardCard v-if="showDashboardCard" :is-modal-open="showDashboardCard" @close="showDashboardCard = false" />
  <UsersCard v-if="showUsersCard" :is-modal-open="showUsersCard" @close="showUsersCard = false" />
  <GaragesCard v-if="showGaragesCard" :is-modal-open="showGaragesCard" @close="showGaragesCard = false" />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import authService from '../../services/auth.service'
import UsersCard from './UsersCard.vue'
import GaragesCard from './GaragesCard.vue'
import DashboardCard from './DashboardCard.vue'

const userRole = computed(() => authService.getUser()?.role ?? 0)
const showUsersCard = ref(false)
const showGaragesCard = ref(false)
const showDashboardCard = ref(false)
</script>

<style scoped>
.card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  width: 100%;
  max-width: 420px;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  margin-bottom: 0.5rem;
}

.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(var(--color-primary-rgb), 0.1);
  border: 1px solid rgba(var(--color-primary-rgb), 0.2);
  backdrop-filter: blur(8px);
}

.icon-wrapper i {
  font-size: 1rem;
  color: var(--text-primary);
}

.card-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  background: linear-gradient(
    135deg,
    var(--text-primary) 0%,
    var(--text-primary) 30%,
    var(--color-primary) 50%,
    var(--text-primary) 70%,
    var(--text-primary) 100%
  );
  background-size: 200% auto;
  color: transparent;
  -webkit-background-clip: text;
  background-clip: text;
  animation: shine 4s linear infinite;
  letter-spacing: -0.02em;
}

@keyframes shine {
  0% {
    background-position: 200% center;
  }
  100% {
    background-position: -200% center;
  }
}

.admin-buttons {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  padding: 1.5rem;
}

.admin-btn {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.2rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 1.1rem;
  font-weight: 400;
  width: 100%;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.admin-btn span {
  background: linear-gradient(
    135deg,
    var(--text-primary) 0%,
    var(--text-primary) 30%,
    var(--color-primary) 50%,
    var(--text-primary) 70%,
    var(--text-primary) 100%
  );
  background-size: 200% auto;
  color: transparent;
  -webkit-background-clip: text;
  background-clip: text;
  animation: shine 4s linear infinite;
  font-weight: 500;
}

.admin-btn i {
  font-size: 1.3rem;
  color: rgba(255, 255, 255, 0.9);
  position: relative;
  transition: all 0.3s ease;
}

.admin-btn :deep(svg) {
  color: rgba(255, 255, 255, 0.9);
  width: 1.3rem;
  height: 1.3rem;
  transition: all 0.3s ease;
}

.admin-btn:hover {
  transform: translateY(-2px) scale(1.01);
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 
    0 10px 20px rgba(0, 0, 0, 0.1),
    0 6px 6px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.2) inset,
    0 8px 16px -4px rgba(255, 255, 255, 0.15);
}

.admin-btn:hover span {
  animation: shine 2s linear infinite;
}

.admin-btn:hover i,
.admin-btn:hover :deep(svg) {
  transform: scale(1.1);
  color: white;
}

.admin-btn:active {
  transform: translateY(0) scale(0.99);
}

@media (max-width: 480px) {
  .card {
    border-radius: 12px;
  }

  .card-header {
    padding: 1rem;
  }

  .admin-buttons {
    padding: 1rem;
  }
}
</style> 