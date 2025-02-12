<template>
  <div class="card">
    <div class="card-header">
      <div class="icon-wrapper">
        <i class="fas fa-wave-square"></i>
      </div>
      <h2 class="card-title">Lecteur NFC</h2>
    </div>

    <div class="card-content">
      <div class="nfc-status" :class="{ connected: isConnected }">
        <div class="status-icon">
          <i
            class="fas"
            :class="{
              'fa-wave-square text-success': isConnected && !lastUser,
              'fa-user text-primary': isConnected && lastUser,
              'fa-plug text-warning': !isConnected
            }"
          ></i>
        </div>
        <div class="status-text">
          <div class="status-label" :class="{ 'text-success': isConnected }">
            <template v-if="!isConnected"> Lecteur NFC non connecté </template>
            <template v-else-if="lastUser">
              {{ lastUser.first_name }} {{ lastUser.last_name }}
            </template>
            <template v-else> Lecteur NFC connecté </template>
          </div>
          <div class="status-message">
            <template v-if="!isConnected"> Veuillez brancher le lecteur NFC </template>
            <template v-else-if="lastUser">
              <div class="user-actions">
                <template v-if="activeTask">
                  <div class="task-info">
                    <p>Tâche en cours : {{ activeTask.name }}</p>
                    <p class="task-details">
                      {{ activeTask.schedule_number }} - {{ activeTask.vehicle_model }}
                    </p>
                  </div>
                  <button class="action-btn stop-btn" @click="stopTask">
                    <i class="fas fa-stop"></i>
                    Arrêter la tâche
                  </button>
                </template>
                <template v-else>
                  <button class="action-btn start-btn" @click="showTaskSelection">
                    <i class="fas fa-play"></i>
                    Commencer une tâche
                  </button>
                </template>
                <button class="action-btn dissociate-btn" @click="dissociateCard">
                  <i class="fas fa-unlink"></i>
                  Dissocier la carte
                </button>
              </div>
            </template>
            <template v-else> Posez une carte pour commencer </template>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal de sélection de tâche -->
  <Teleport to="body">
    <div v-if="showTaskModal" class="modal-overlay" @click="closeTaskModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Sélection de tâche</h3>
          <button class="close-btn" @click="closeTaskModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p class="modal-message">Sélectionnez une tâche à commencer :</p>
          <select v-model="selectedTaskId" class="task-select">
            <option value="" disabled>Choisir une tâche</option>
            <option v-for="task in availableTasks" :key="task.id" :value="task.id">
              {{ task.schedule_number }} - {{ task.name }} - {{ task.vehicle_model }}
            </option>
          </select>
          <div class="modal-actions">
            <button class="cancel-btn" @click="closeTaskModal">Annuler</button>
            <button class="confirm-btn" :disabled="!selectedTaskId" @click="startTask">
              Commencer la tâche
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Modal d'association de carte -->
  <Teleport to="body">
    <div v-if="showAssociationModal" class="modal-overlay" @click="closeAssociationModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Association de carte</h3>
          <button class="close-btn" @click="closeAssociationModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p class="modal-message">
            Carte détectée : <span class="card-uid">{{ pendingCardUid }}</span>
          </p>
          <p>Sélectionnez un utilisateur pour associer cette carte :</p>
          <select v-model="selectedUserId" class="user-select">
            <option value="" disabled>Choisir un utilisateur</option>
            <option v-for="user in unassignedUsers" :key="user.id" :value="user.id">
              {{ user.first_name }} {{ user.last_name }}
            </option>
          </select>
          <div class="modal-actions">
            <button class="cancel-btn" @click="closeAssociationModal">Annuler</button>
            <button class="confirm-btn" :disabled="!selectedUserId" @click="confirmAssociation">
              Associer la carte
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import nfcService from '../../services/nfc.service'
import { useToast } from '../../composables/useToast'
import { userService } from '../../services/user.service'
import { taskService } from '../../services/task.service'
import type { User } from '../../types/auth'
import type { Task } from '../../types/task'

const { show: showToast } = useToast()
const isConnected = computed(() => nfcService.isConnected.value)
const cardUUID = computed(() => nfcService.cardUUID.value)
const lastCardUid = ref<string | null>(null)
const lastUser = ref<User | null>(null)
const activeTask = ref<Task | null>(null)
const activeTaskRecord = ref<string | null>(null)

// État pour le modal d'association
const showAssociationModal = ref(false)
const unassignedUsers = ref<User[]>([])
const selectedUserId = ref('')
const pendingCardUid = ref('')

// État pour le modal de sélection de tâche
const showTaskModal = ref(false)
const availableTasks = ref<Task[]>([])
const selectedTaskId = ref('')

const loadUnassignedUsers = async () => {
  try {
    unassignedUsers.value = await userService.getUnassignedUsers()
  } catch (error) {
    console.error('Erreur lors du chargement des utilisateurs:', error)
    showToast('Erreur lors du chargement des utilisateurs', 'error')
  }
}

const openAssociationModal = async (cardUid: string) => {
  pendingCardUid.value = cardUid
  await loadUnassignedUsers()
  showAssociationModal.value = true
}

const closeAssociationModal = () => {
  showAssociationModal.value = false
  selectedUserId.value = ''
  pendingCardUid.value = ''
}

const confirmAssociation = async () => {
  try {
    if (!selectedUserId.value || !pendingCardUid.value) return

    const updatedUser = await userService.associateCard(selectedUserId.value, pendingCardUid.value)

    // Mettre à jour l'état local avec l'utilisateur mis à jour
    lastUser.value = updatedUser
    lastCardUid.value = pendingCardUid.value

    showToast(
      `Carte associée avec succès à ${updatedUser.first_name} ${updatedUser.last_name}`,
      'success'
    )
    closeAssociationModal()
  } catch (error) {
    console.error("Erreur lors de l'association:", error)
    showToast("Erreur lors de l'association de la carte", 'error')
  }
}

const showTaskSelection = async () => {
  try {
    // Utiliser directement les tâches du cache
    availableTasks.value = await taskService.getActiveTasks()
    showTaskModal.value = true
  } catch (error) {
    console.error('Erreur lors du chargement des tâches:', error)
    showToast('Erreur lors du chargement des tâches', 'error')
  }
}

const closeTaskModal = () => {
  showTaskModal.value = false
  selectedTaskId.value = ''
}

const handleCardDetected = async (uid: string) => {
  try {
    // Éviter les lectures multiples de la même carte
    if (lastCardUid.value === uid) return
    lastCardUid.value = uid

    // Rechercher l'utilisateur associé à la carte directement dans le cache
    const user = await userService.findUserByCardUid(uid)
    lastUser.value = user

    if (user) {
      showToast(`Carte détectée : ${user.first_name} ${user.last_name}`, 'success')
      // Charger les tâches actives depuis le cache
      const tasks = await taskService.getActiveTasks()
      availableTasks.value = tasks

      // Si l'utilisateur a déjà une tâche active
      if (user.task_id && user.record_task_id) {
        const activeUserTask = tasks.find(t => t.id === user.task_id)
        if (activeUserTask) {
          activeTask.value = activeUserTask
          activeTaskRecord.value = user.record_task_id
          console.log('Tâche active trouvée:', activeUserTask)
        }
      } else {
        // Réinitialiser si aucune tâche active
        activeTask.value = null
        activeTaskRecord.value = null
      }
    } else {
      // Proposer d'associer la carte à un utilisateur
      openAssociationModal(uid)
    }
  } catch (error) {
    console.error('Erreur lors de la lecture de la carte:', error)
    showToast('Erreur lors de la lecture de la carte', 'error')
  }
}

const dissociateCard = async () => {
  try {
    if (!lastUser.value?.id) return

    await userService.dissociateCard(lastUser.value.id)

    // Réinitialiser l'état local
    lastUser.value = null
    lastCardUid.value = null

    showToast('Carte dissociée avec succès', 'success')
  } catch (error) {
    console.error('Erreur lors de la dissociation:', error)
    showToast('Erreur lors de la dissociation de la carte', 'error')
  }
}

const startTask = async () => {
  try {
    if (!selectedTaskId.value || !lastUser.value?.id) return

    const updatedTask = await taskService.startTask(selectedTaskId.value, lastUser.value.id)

    // Vérifier si la tâche a des travailleurs actifs
    const userRecord = updatedTask.activeWorkers.find((w) => w.userId === lastUser.value?.id)
    if (!userRecord) {
      throw new Error('Erreur lors du démarrage de la tâche: aucun travailleur actif trouvé')
    }

    console.log('Record trouvé:', userRecord)
    activeTask.value = updatedTask
    activeTaskRecord.value = userRecord.id

    // Mettre à jour l'utilisateur local avec les nouveaux IDs
    lastUser.value = {
      ...lastUser.value,
      task_id: updatedTask.id,
      record_task_id: userRecord.id
    }

    showToast('Tâche démarrée avec succès', 'success')
    closeTaskModal()
  } catch (error) {
    console.error('Erreur:', error)
    showToast('Erreur lors du démarrage de la tâche', 'error')
  }
}

const stopTask = async () => {
  try {
    if (!lastUser.value?.task_id || !lastUser.value?.record_task_id) {
      console.error(
        "Impossible d'arrêter la tâche: ID de tâche ou de record manquant dans l'utilisateur",
        {
          taskId: lastUser.value?.task_id,
          recordId: lastUser.value?.record_task_id
        }
      )
      return
    }

    console.log('Arrêt de la tâche:', {
      taskId: lastUser.value.task_id,
      recordId: lastUser.value.record_task_id
    })

    await taskService.stopTask(lastUser.value.task_id, lastUser.value.record_task_id)

    // Réinitialiser l'état
    activeTask.value = null
    activeTaskRecord.value = null

    // Mettre à jour l'utilisateur local
    lastUser.value = {
      ...lastUser.value,
      task_id: null,
      record_task_id: null
    }

    showToast('Tâche terminée avec succès', 'success')
  } catch (error) {
    console.error('Erreur:', error)
    showToast("Erreur lors de l'arrêt de la tâche", 'error')
  }
}

// Observer les changements de carte
watch(cardUUID, (newUid) => {
  if (newUid) {
    handleCardDetected(newUid)
  } else {
    // Réinitialiser l'état quand la carte est retirée
    lastCardUid.value = null
    lastUser.value = null
  }
})

// Charger les données au montage du composant
onMounted(async () => {
  try {
    // Précharger les utilisateurs et les tâches pour une réponse plus rapide
    await Promise.all([userService.getUsers(), taskService.getActiveTasks()])
  } catch (error) {
    console.error('Erreur lors du chargement initial des données:', error)
  }
})
</script>

<style scoped>
.card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  width: 100%;
  height: 100%;
  overflow: hidden;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: rgba(255, 255, 255, 0.2);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  margin-bottom: 0.5rem;
  flex-shrink: 0;
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

@keyframes shine {
  0% {
    background-position: 200% center;
  }
  100% {
    background-position: -200% center;
  }
}

.card-content {
  padding: 1.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.nfc-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2.5rem;
  text-align: center;
  padding: 3rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  flex: 1;
  justify-content: center;
}

.status-icon i {
  font-size: 3rem;
  transition: all 0.3s ease;
}

.status-text {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.status-label {
  font-weight: 600;
  font-size: 1.25rem;
  transition: all 0.3s ease;
}

.status-message {
  color: var(--text-secondary);
  font-size: 1rem;
  line-height: 1.5;
}

.card-uid {
  color: var(--color-primary);
  font-family: monospace;
  font-size: 1.1rem;
  font-weight: 500;
  background: rgba(var(--color-primary-rgb), 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.text-success {
  color: var(--color-success);
}

.text-warning {
  color: var(--color-warning);
}

@media (max-width: 768px) {
  .card {
    max-width: 100%;
  }

  .nfc-status {
    padding: 2rem;
    gap: 2rem;
  }

  .status-icon i {
    font-size: 2.5rem;
  }

  .status-label {
    font-size: 1.1rem;
  }

  .status-message {
    font-size: 0.95rem;
  }

  .card-uid {
    font-size: 1rem;
  }
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

.modal-content {
  background: var(--bg-primary);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 90%;
  max-width: 500px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.5rem;
  transition: all 0.2s ease;
}

.close-btn:hover {
  color: var(--text-primary);
}

.modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.modal-message {
  margin: 0;
  color: var(--text-primary);
}

.user-select {
  width: 100%;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 1rem;
  transition: all 0.2s ease;
}

.user-select:hover {
  border-color: rgba(var(--color-primary-rgb), 0.3);
}

.user-select:focus {
  outline: none;
  border-color: var(--color-primary);
  background: rgba(var(--color-primary-rgb), 0.1);
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

.cancel-btn,
.confirm-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--text-primary);
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.confirm-btn {
  background: var(--color-primary);
  border: none;
  color: white;
}

.confirm-btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
}

.confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.user-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.task-info {
  text-align: center;
  margin-bottom: 1rem;
}

.task-info p {
  margin: 0;
}

.task-details {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  color: white;
  width: 100%;
}

.start-btn {
  background: var(--color-success);
}

.start-btn:hover {
  background: var(--color-success-hover);
  transform: translateY(-1px);
}

.stop-btn {
  background: var(--color-danger);
}

.stop-btn:hover {
  background: var(--color-danger-hover);
  transform: translateY(-1px);
}

.task-select {
  width: 100%;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 1rem;
  transition: all 0.2s ease;
}

.task-select:hover {
  border-color: rgba(var(--color-primary-rgb), 0.3);
}

.task-select:focus {
  outline: none;
  border-color: var(--color-primary);
  background: rgba(var(--color-primary-rgb), 0.1);
}

.dissociate-btn {
  background: var(--color-warning);
  margin-top: 1rem;
}

.dissociate-btn:hover {
  background: var(--color-warning-hover);
  transform: translateY(-1px);
}
</style>
