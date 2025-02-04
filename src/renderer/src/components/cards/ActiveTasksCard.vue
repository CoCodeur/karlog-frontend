<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useAuthStore } from '@renderer/stores/auth'
import { UserRole } from '@renderer/types/auth'
import { taskService } from '@renderer/services/task.service'
import type { Task } from '@renderer/types/task'
import { useToast } from '@renderer/composables/useToast'

const authStore = useAuthStore()
const { show: showToast } = useToast()

const tasks = ref<Task[]>([])
const selectedTask = ref<Task | null>(null)
const isModalOpen = ref(false)
const loading = ref(false)

const fetchTasks = async () => {
  try {
    loading.value = true
    if (authStore.userRole >= UserRole.ADMINISTRATOR) {
      tasks.value = await taskService.getCompanyActiveTasks(authStore.companyId)
    } else {
      tasks.value = await taskService.getGarageActiveTasks(authStore.garageId)
    }
  } catch (error) {
    showToast('Erreur lors du chargement des tâches', 'error')
  } finally {
    loading.value = false
  }
}

const openTaskDetails = (task: Task) => {
  selectedTask.value = task
  isModalOpen.value = true
}

const closeModal = () => {
  selectedTask.value = null
  isModalOpen.value = false
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isModalOpen.value) {
    closeModal()
  }
}

const completeTask = async (taskId: string) => {
  try {
    await taskService.completeTask(taskId)
    showToast('Tâche terminée avec succès', 'success')
    // Rafraîchir la liste des tâches
    await fetchTasks()

    // Si plus aucune tâche, fermer le modal
    if (tasks.value.length === 0) {
      closeModal()
    }
  } catch (error) {
    showToast('Erreur lors de la terminaison de la tâche', 'error')
  }
}

onMounted(() => {
  fetchTasks()
  window.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="card">
    <div class="card-content" @click="tasks.length > 0 && openTaskDetails(tasks[0])">
      <div class="card-header">
        <div class="icon-wrapper">
          <i class="fas fa-tasks"></i>
        </div>
        <h2 class="card-title">Tâches Actives</h2>
      </div>

      <div v-if="loading" class="loading-container">
        <span class="loading loading-spinner loading-lg"></span>
      </div>
      <div v-else-if="tasks.length === 0" class="empty-state">
        <i class="fas fa-clipboard-list"></i>
        <p>Aucune tâche active</p>
      </div>
      <div v-else class="task-preview">
        <div class="task-count">{{ tasks.length }}</div>
        <p class="task-label">tâches en cours</p>
      </div>
    </div>
  </div>

  <!-- Modal -->
  <div v-if="isModalOpen" class="modal modal-open" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-card">
        <div class="modal-header">
          <div class="icon-wrapper">
            <i class="fas fa-tasks"></i>
          </div>
          <h2 class="modal-title">Tâches Actives</h2>
        </div>

        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Tâche</th>
                <th>Véhicule</th>
                <th>Immatriculation</th>
                <th>Prix</th>
                <th>Durée</th>
                <th>Travailleurs</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="task in tasks" :key="task.id" class="hover">
                <td class="font-medium">{{ task.name }}</td>
                <td>{{ task.vehicle_model }}</td>
                <td>{{ task.immatriculation }}</td>
                <td class="text-violet-500 font-medium">{{ task.price }}€</td>
                <td>{{ task.hours }}h</td>
                <td>
                  <div v-if="task.activeWorkers.length === 0" class="text-gray-500">
                    Aucun travailleur
                  </div>
                  <div v-else class="workers-list">
                    <div v-for="worker in task.activeWorkers" :key="worker.id" class="worker-item">
                      <i class="fas fa-user text-violet-500 mr-2"></i>
                      {{ worker.firstName }} {{ worker.lastName }}
                      <span class="text-sm text-gray-500">
                        (depuis {{ new Date(worker.startDate).toLocaleString() }})
                      </span>
                    </div>
                  </div>
                </td>
                <td class="text-center">
                  <button @click="completeTask(task.id)" class="modal-button">
                    <i class="fas fa-check mr-2"></i>
                    Terminer
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes shine {
  to {
    background-position: 200% center;
  }
}

.card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  width: 100%;
  max-width: 420px;
  overflow: hidden;
}

.card-content {
  height: 100%;
  cursor: pointer;
  transition: all 0.3s ease;
}

.card-content:hover {
  transform: translateY(-2px);
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
  color: var(--color-primary);
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

.task-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.25rem;
}

.task-count {
  font-size: 48px;
  font-weight: 600;
  color: var(--color-primary);
}

.task-label {
  color: var(--text-secondary);
  font-size: 16px;
}

.empty-state {
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
}

.empty-state i {
  font-size: 2rem;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100px;
  padding: 2rem;
}

/* Modal styles */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 1rem;
}

.modal-content {
  width: 95%;
  height: 95vh;
  position: relative;
}

.modal-card {
  height: 100%;
  background: rgba(30, 30, 30, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-title {
  font-size: 1.75rem;
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

.table-container {
  flex: 1;
  overflow: auto;
  padding: 0 2rem 2rem;
  margin-top: 1rem;
}

.table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 800px;
}

.table th {
  background: rgba(var(--color-primary-rgb), 0.1);
  color: var(--text-primary);
  font-weight: 600;
  text-align: left;
  padding: 1rem;
  white-space: nowrap;
  border-top: 1px solid rgba(var(--color-primary-rgb), 0.2);
  border-bottom: 1px solid rgba(var(--color-primary-rgb), 0.2);
  position: sticky;
  top: 0;
  backdrop-filter: blur(12px);
}

.table th:first-child {
  border-top-left-radius: 12px;
  border-left: 1px solid rgba(var(--color-primary-rgb), 0.2);
}

.table th:last-child {
  border-top-right-radius: 12px;
  border-right: 1px solid rgba(var(--color-primary-rgb), 0.2);
}

.table td {
  padding: 1rem;
  border-bottom: 1px solid rgba(var(--color-primary-rgb), 0.1);
  background: rgba(255, 255, 255, 0.03);
}

.table tr:last-child td:first-child {
  border-bottom-left-radius: 12px;
}

.table tr:last-child td:last-child {
  border-bottom-right-radius: 12px;
}

.table tr.hover:hover td {
  background: rgba(var(--color-primary-rgb), 0.05);
}

.workers-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.worker-item {
  font-size: 14px;
  display: flex;
  align-items: center;
}

.modal-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  background: rgb(139, 92, 246);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 10px rgba(139, 92, 246, 0.3);
}

.modal-button:hover {
  background: rgb(124, 58, 237);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}

.modal-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .modal {
    padding: 0.5rem;
  }

  .modal-content {
    width: 100%;
    height: 98vh;
  }

  .modal-header {
    padding: 1.5rem;
  }

  .table-container {
    padding: 0 1rem 1rem;
  }

  .modal-title {
    font-size: 1.5rem;
  }

  .table td,
  .table th {
    padding: 0.75rem;
  }
}

@media (max-width: 640px) {
  .card-content {
    padding: 1rem;
  }

  .icon-wrapper {
    width: 32px;
    height: 32px;
  }

  .icon-wrapper i {
    font-size: 0.875rem;
  }

  .card-title {
    font-size: 1.25rem;
  }

  .task-count {
    font-size: 36px;
  }
}
</style>
