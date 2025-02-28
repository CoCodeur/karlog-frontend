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
    const workersA = a.task_records?.filter((record) => !record.end_date)?.length || 0
    const workersB = b.task_records?.filter((record) => !record.end_date)?.length || 0
    if (workersA !== workersB) {
      return workersB - workersA
    }
    // Puis par numéro horaire
    return (a.schedule_number || '').localeCompare(b.schedule_number || '')
  })

  if (!query) return sorted

  return sorted.filter(
    (task) =>
      (task.schedule_number || '').toLowerCase().includes(query) ||
      task.name.toLowerCase().includes(query) ||
      task.vehicle_model.toLowerCase().includes(query) ||
      task.immatriculation.toLowerCase().includes(query)
  )
})

const fetchTasks = async () => {
  try {
    loading.value = true
    const fetchedTasks = await taskService.getActiveTasks()
    tasks.value = fetchedTasks
  } catch (error) {
    console.error('Erreur lors du chargement des tâches:', error)
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
    // Rafraîchir les tâches depuis l'API
    await fetchTasks()
    showToast('Tâche terminée avec succès', 'success')

    // Si plus aucune tâche, fermer le modal
    if (tasks.value.length === 0) {
      closeModal()
    }
  } catch (error) {
    showToast('Erreur lors de la terminaison de la tâche', 'error')
  }
}

const cancelTask = async (taskId: string) => {
  try {
    await taskService.cancelTask(taskId)
    // Rafraîchir les tâches depuis l'API
    await fetchTasks()
    showToast('Tâche annulée avec succès', 'success')

    // Si plus aucune tâche, fermer le modal
    if (tasks.value.length === 0) {
      closeModal()
    }
  } catch (error) {
    showToast("Erreur lors de l'annulation de la tâche", 'error')
  }
}

const deleteTask = async (taskId: string) => {
  try {
    await taskService.deleteTask(taskId)
    // Rafraîchir les tâches depuis l'API
    await fetchTasks()
    showToast('Tâche supprimée avec succès', 'success')

    // Si plus aucune tâche, fermer le modal
    if (tasks.value.length === 0) {
      closeModal()
    }
  } catch (error) {
    showToast('Erreur lors de la suppression de la tâche', 'error')
  }
}

onMounted(async () => {
  await fetchTasks()
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
    <div class="card-header">
      <div class="icon-wrapper">
        <i class="fas fa-tasks"></i>
      </div>
      <h2 class="card-title">Tâches Actives</h2>
      <p class="task-count">{{ filteredTasks.length }} tâche(s)</p>
    </div>

    <div class="card-content" @click="openTaskDetails(filteredTasks[0])">
      <div v-if="loading" class="loading-container">
        <span class="loading loading-spinner loading-lg"></span>
      </div>
      <div v-else-if="filteredTasks.length === 0" class="empty-state">
        <i class="fas fa-clipboard-list"></i>
        <p>Aucune tâche active</p>
      </div>
      <div v-else class="task-preview">
        <div class="task-count-large">{{ filteredTasks.length }}</div>
        <p class="task-label">tâches en cours</p>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <div v-if="isModalOpen" class="modal-overlay" @click="closeModal">
      <div class="modal-wrapper" @click.stop>
        <div class="modal-header">
          <div class="modal-title">
            <h2>Tâches Actives</h2>
            <p>{{ filteredTasks.length }} tâche(s)</p>
          </div>
          <div class="modal-actions">
            <button class="close-btn" @click="closeModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
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
          <div v-if="loading" class="loading-container">
            <span class="loading loading-spinner loading-lg"></span>
          </div>
          <div v-else class="table-container">
            <table>
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
                  <td class="schedule-number">{{ task.schedule_number }}</td>
                  <td>{{ task.name }}</td>
                  <td>{{ task.vehicle_model }}</td>
                  <td>{{ task.immatriculation }}</td>
                  <td>{{ task.price }}€</td>
                  <td>{{ task.hours }}h</td>
                  <td>
                    <div
                      v-if="!task.activeWorkers || task.activeWorkers.length === 0"
                      class="no-workers"
                    >
                      Aucun travailleur
                    </div>
                    <div v-else class="workers-list">
                      <div
                        v-for="worker in task.activeWorkers"
                        :key="worker.id"
                        class="worker-item"
                      >
                        <i class="fas fa-user"></i>
                        {{ worker.firstName }} {{ worker.lastName }}
                        <span class="worker-time">
                          (depuis {{ new Date(worker.startDate).toLocaleString() }})
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <button class="action-btn complete-btn" @click="completeTask(task.id)">
                        <i class="fas fa-check"></i>
                        Terminer
                      </button>
                      <button class="action-btn cancel-btn" @click="cancelTask(task.id)">
                        <i class="fas fa-times"></i>
                        Annuler
                      </button>
                      <button class="action-btn delete-btn" @click="deleteTask(task.id)">
                        <i class="fas fa-trash"></i>
                        Supprimer
                      </button>
                    </div>
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
  height: 600px;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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

.task-count {
  margin-left: auto;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.card-content {
  flex: 1;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: transparent;
}

.card-content:hover {
  background: rgba(255, 255, 255, 0.02);
}

.task-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  text-align: center;
}

.task-count-large {
  font-size: 72px;
  font-weight: 600;
  color: var(--color-primary);
  line-height: 1;
}

.task-label {
  color: var(--text-secondary);
  font-size: 1.1rem;
  opacity: 0.8;
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
  justify-content: space-between;
  padding: 1.5rem 2rem;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-title {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.modal-title h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.modal-title p {
  color: var(--text-secondary);
  margin: 0;
}

.modal-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid var(--border-light);
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.modal-body {
  flex: 1;
  overflow: hidden;
  padding: 1.5rem 2rem;
}

.table-container {
  height: 100%;
  overflow: auto;
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.9rem;
}

thead {
  position: sticky;
  top: 0;
  z-index: 1;
  background: rgba(var(--color-primary-rgb), 0.1);
}

th {
  text-align: left;
  padding: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  background: rgba(var(--color-primary-rgb), 0.1);
  border-bottom: 1px solid rgba(var(--color-primary-rgb), 0.2);
}

td {
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
  white-space: nowrap;
}

tr:hover td {
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

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  white-space: nowrap;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.complete-btn {
  background: var(--color-primary);
  border: none;
  color: white;
}

.complete-btn:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
}

.cancel-btn {
  background: rgb(220, 38, 38);
  border: none;
  color: white;
}

.cancel-btn:hover {
  background: rgb(185, 28, 28);
  transform: translateY(-1px);
}

.delete-btn {
  background: rgb(100, 100, 100);
  border: none;
  color: white;
}

.delete-btn:hover {
  background: rgb(75, 75, 75);
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

.schedule-number {
  color: rgb(147, 51, 234);
  font-weight: 500;
}
</style>
