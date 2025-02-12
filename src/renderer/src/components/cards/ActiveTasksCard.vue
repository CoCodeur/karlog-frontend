<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import type { Task } from '@renderer/types/task'
import { taskService } from '@renderer/services/task.service'
import { useToast } from '@renderer/composables/useToast'

const { show: showToast } = useToast()

const tasks = ref<Task[]>([])
const selectedTask = ref<Task | null>(null)
const isModalOpen = ref(false)
const loading = ref(false)
const searchQuery = ref('')

const filteredTasks = computed(() => {
  const query = searchQuery.value.toLowerCase()
  const sorted = [...tasks.value].sort((a, b) => {
    // Trier d'abord par nombre de travailleurs actifs (décroissant)
    const workersA = a.activeWorkers.length
    const workersB = b.activeWorkers.length
    if (workersA !== workersB) {
      return workersB - workersA
    }
    // Puis par numéro horaire
    return (a.schedule_number || '').localeCompare(b.schedule_number || '')
  })

  if (!query) return sorted

  return sorted.filter(task => 
    (task.schedule_number || '').toLowerCase().includes(query) ||
    task.name.toLowerCase().includes(query) ||
    task.vehicle_model.toLowerCase().includes(query) ||
    task.immatriculation.toLowerCase().includes(query)
  )
})

const fetchTasks = async () => {
  try {
    loading.value = true
    tasks.value = await taskService.getActiveTasks()
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

// Exposer la méthode pour qu'elle soit accessible depuis l'extérieur
defineExpose({
  fetchTasks
})
</script>

<template>
  <div class="card">
    <div class="card-content" 
      :class="{ 'has-tasks': tasks.length > 0 }"
      @click="tasks.length > 0 && openTaskDetails(tasks[0])">
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

  <Teleport to="body">
    <div v-if="isModalOpen" class="modal-overlay" @click="closeModal">
      <div class="modal-wrapper" @click.stop>
        <div class="modal-header">
          <div class="icon-wrapper">
            <i class="fas fa-tasks"></i>
          </div>
          <h2 class="modal-title">Tâches Actives</h2>
        </div>

        <div class="search-bar">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Rechercher par numéro horaire, nom, véhicule ou immatriculation..."
            class="search-input"
          />
        </div>

        <div class="modal-body">
          <div class="table-wrapper">
            <table class="tasks-table">
              <thead>
                <tr>
                  <th>Numéro Horaire</th>
                  <th>Tâche</th>
                  <th>Véhicule</th>
                  <th>Immatriculation</th>
                  <th>Prix</th>
                  <th>Durée</th>
                  <th>Travailleurs</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="task in filteredTasks" :key="task.id">
                  <td>{{ task.schedule_number }}</td>
                  <td>{{ task.name }}</td>
                  <td>{{ task.vehicle_model }}</td>
                  <td>{{ task.immatriculation }}</td>
                  <td>{{ task.price }}€</td>
                  <td>{{ task.hours }}h</td>
                  <td>
                    <div v-if="task.activeWorkers.length === 0" class="no-workers">
                      Aucun travailleur
                    </div>
                    <div v-else class="workers-list">
                      <div v-for="worker in task.activeWorkers" :key="worker.id" class="worker-item">
                        <i class="fas fa-user"></i>
                        {{ worker.firstName }} {{ worker.lastName }}
                        <span class="worker-time">
                          (depuis {{ new Date(worker.startDate).toLocaleString() }})
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <button class="complete-btn" @click="completeTask(task.id)">
                      <i class="fas fa-check"></i>
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
  </Teleport>
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
  cursor: default;
  transition: all 0.3s ease;

  &:hover {
    transform: none;
  }

  &[class*="has-tasks"] {
    cursor: pointer;

    &:hover {
      transform: translateY(-2px);
    }
  }
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

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-wrapper {
  width: 90%;
  max-width: 1400px;
  height: 85vh;
  background: var(--bg-primary);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem 2rem;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-body {
  flex: 1;
  overflow: hidden;
  padding: 1.5rem 2rem;
}

.table-wrapper {
  height: 100%;
  overflow: auto;
}

.tasks-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.9rem;
}

.tasks-table th {
  position: sticky;
  top: 0;
  background: rgba(var(--color-primary-rgb), 0.1);
  color: var(--text-primary);
  font-weight: 600;
  text-align: left;
  padding: 1rem;
  border-bottom: 1px solid rgba(var(--color-primary-rgb), 0.2);
}

.tasks-table td {
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
  white-space: nowrap;
}

.tasks-table td:first-child {
  font-family: monospace;
  font-size: 0.95rem;
  color: var(--color-primary);
}

.tasks-table tr:hover td {
  background: rgba(255, 255, 255, 0.02);
}

.no-workers {
  color: var(--text-secondary);
  font-style: italic;
}

.workers-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.worker-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.worker-item i {
  color: var(--color-primary);
}

.worker-time {
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.complete-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.complete-btn:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
}

.search-bar {
  padding: 1rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
}

.search-input {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  display: block;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  background: rgba(var(--color-primary-rgb), 0.1);
}

.search-input::placeholder {
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .modal-wrapper {
    width: 100%;
    height: 100vh;
    border-radius: 0;
  }

  .modal-header {
    padding: 1rem 1.5rem;
  }

  .modal-body {
    padding: 1rem 1.5rem;
  }

  .search-bar {
    padding: 0.75rem 1.5rem;
  }

  .search-input {
    padding: 0.6rem 1rem;
  }
}
</style>
