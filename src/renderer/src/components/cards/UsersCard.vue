<template>
  <Teleport to="body">
    <div v-if="isModalOpen" class="modal-overlay" @click="closeModal">
      <div class="modal-wrapper" @click.stop>
        <div class="modal-header">
          <div class="modal-title">
            <h2>Gestion des Utilisateurs</h2>
            <p>{{ filteredUsers.length }} utilisateur(s)</p>
          </div>
          <div class="modal-actions">
            <button v-if="userRole >= 2" class="add-user-btn" @click="openCreateUserModal">
              <i class="fas fa-plus"></i>
              Nouvel utilisateur
            </button>
            <button class="close-btn" @click="closeModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <div class="modal-body">
          <div v-if="loading" class="loading-container">
            <span class="loading loading-spinner loading-lg"></span>
          </div>
          <div v-else class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Carte NFC</th>
                  <th>Dissocier</th>
                  <th>Supprimer</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in filteredUsers" :key="user.id">
                  <td>{{ user.first_name }} {{ user.last_name }}</td>
                  <td>{{ user.email }}</td>
                  <td>{{ getRoleName(user.role) }}</td>
                  <td>
                    <span v-if="user.card_uid" class="card-status has-card">
                      <i class="fas fa-check"></i>
                      Associée
                    </span>
                    <span v-else class="card-status no-card">
                      <i class="fas fa-times"></i>
                      Non associée
                    </span>
                  </td>
                  <td class="action-cell">
                    <button v-if="user.card_uid" class="action-btn dissociate-btn" @click="dissociateCard(user)">
                      <i class="fas fa-unlink"></i>
                      Dissocier
                    </button>
                  </td>
                  <td class="action-cell">
                    <button class="action-btn delete-btn" @click="deleteUser(user)">
                      <i class="fas fa-trash"></i>
                      Supprimer
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

  <!-- Modal de création d'utilisateur -->
  <Teleport to="body">
    <div v-if="showCreateModal" class="modal-overlay create-modal-overlay" @click="closeCreateModal">
      <div class="modal-content create-user-modal" @click.stop>
        <div class="create-modal-header">
          <div class="create-modal-title">
            <i class="fas fa-user-plus"></i>
            <h3>Nouvel Utilisateur</h3>
          </div>
          <button class="close-btn" @click="closeCreateModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="create-modal-body">
          <form @submit.prevent="createUser" class="create-user-form">
            <div class="form-row">
              <div class="form-group">
                <label>Prénom</label>
                <div class="input-wrapper">
                  <i class="fas fa-user"></i>
                  <input v-model="newUser.first_name" type="text" required @input="generateEmail" placeholder="John" />
                </div>
              </div>
              <div class="form-group">
                <label>Nom</label>
                <div class="input-wrapper">
                  <i class="fas fa-user"></i>
                  <input v-model="newUser.last_name" type="text" required @input="generateEmail" placeholder="Doe" />
                </div>
              </div>
            </div>

            <div class="form-group">
              <label>Rôle</label>
              <div class="input-wrapper">
                <i class="fas fa-shield-alt"></i>
                <select v-model="newUser.role" required>
                  <option :value="0">Utilisateur</option>
                  <option :value="1">Compte de service</option>
                  <option v-if="userRole >= 2" :value="2">Administrateur</option>
                </select>
              </div>
            </div>

            <template v-if="newUser.role >= 2">
              <div class="form-group">
                <label>Email</label>
                <div class="input-wrapper">
                  <i class="fas fa-envelope"></i>
                  <input v-model="newUser.email" type="email" required placeholder="admin@example.com" />
                </div>
              </div>
              <div class="form-group">
                <label>Mot de passe</label>
                <div class="input-wrapper">
                  <i class="fas fa-lock"></i>
                  <input v-model="newUser.password" type="password" required placeholder="••••••••" />
                </div>
              </div>
            </template>

            <div class="form-actions">
              <button type="button" class="cancel-btn" @click="closeCreateModal">
                <i class="fas fa-times"></i>
                Annuler
              </button>
              <button type="submit" class="confirm-btn">
                <i class="fas fa-check"></i>
                Créer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { userService } from '../../services/user.service'
import authService from '../../services/auth.service'
import { useToast } from '../../composables/useToast'
import type { User } from '../../types/auth'
import { UserRole } from '../../types/auth'

const props = defineProps<{
  isModalOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { show: showToast } = useToast()
const loading = ref(false)
const users = ref<User[]>([])
const showCreateModal = ref(false)
const userRole = computed(() => authService.getUser()?.role ?? 0)
const currentUser = computed(() => authService.getUser())

const newUser = ref({
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  role: 0
})

const filteredUsers = computed(() => {
  return users.value.filter(user => user.role === UserRole.USER)
})

const getRoleName = (role: UserRole): string => {
  switch (role) {
    case UserRole.USER:
      return 'Utilisateur'
    case UserRole.SERVICE_ACCOUNT:
      return 'Compte de service'
    case UserRole.ADMINISTRATOR:
      return 'Administrateur'
    case UserRole.SUPER_ADMINISTRATOR:
      return 'Super Administrateur'
    default:
      return 'Inconnu'
  }
}

const fetchUsers = async () => {
  loading.value = true
  try {
    users.value = await userService.getUsers()
  } catch (error) {
    showToast('Erreur lors du chargement des utilisateurs', 'error')
  } finally {
    loading.value = false
  }
}

const openModal = () => {
  // isModalOpen.value = true
}

const closeModal = () => {
  // isModalOpen.value = false
  emit('close')
}

const openCreateUserModal = () => {
  showCreateModal.value = true
}

const closeCreateModal = () => {
  showCreateModal.value = false
  newUser.value = {
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 0
  }
}

const generateEmail = () => {
  if (newUser.value.first_name && newUser.value.last_name && currentUser.value?.company_name) {
    const firstName = newUser.value.first_name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    const lastName = newUser.value.last_name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    newUser.value.email = `${firstName}.${lastName}@${currentUser.value.company_name.toLowerCase()}.com`
  }
}

const createUser = async () => {
  try {
    const token = authService.getAccessToken()
    const currentUser = authService.getUser()
    if (!token || !currentUser?.company_id) throw new Error('Non authentifié')

    const userData = {
      ...newUser.value,
      company_id: currentUser.company_id,
      is_service_account: newUser.value.role === UserRole.SERVICE_ACCOUNT,
      card_uid: null
    }

    // Si ce n'est pas un admin, on génère un mot de passe aléatoire
    if (newUser.value.role < 2) {
      userData.password = uuidv4()
    }

    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(userData)
    })

    if (!response.ok) {
      throw new Error("Erreur lors de la création de l'utilisateur")
    }

    const createdUser = await response.json()
    users.value.push(createdUser)
    showToast('Utilisateur créé avec succès', 'success')
    closeCreateModal()
  } catch (error) {
    console.error('Erreur:', error)
    showToast("Erreur lors de la création de l'utilisateur", 'error')
  }
}

const dissociateCard = async (user: User) => {
  try {
    await userService.dissociateCard(user.id)
    await fetchUsers()
    showToast('Carte dissociée avec succès', 'success')
  } catch (error) {
    showToast('Erreur lors de la dissociation de la carte', 'error')
  }
}

const deleteUser = async (user: User) => {
  try {
    const token = authService.getAccessToken()
    if (!token) throw new Error('Non authentifié')

    const response = await fetch(`/api/users/${user.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error("Erreur lors de la suppression de l'utilisateur")
    }

    users.value = users.value.filter(u => u.id !== user.id)
    userService.saveToCache(users.value) // Mettre à jour le cache
    showToast('Utilisateur supprimé avec succès', 'success')
  } catch (error) {
    console.error('Erreur:', error)
    showToast("Erreur lors de la suppression de l'utilisateur", 'error')
  }
}

watch(() => props.isModalOpen, (newValue) => {
  if (newValue) {
    fetchUsers()
  }
})

onMounted(() => {
  if (props.isModalOpen) {
    fetchUsers()
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
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

.add-user-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: none;
  background: var(--color-primary);
  color: white;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.add-user-btn:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
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

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.card-status {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 100px;
  font-size: 0.9rem;
}

.has-card {
  background: rgba(var(--color-success-rgb), 0.1);
  color: var(--color-success);
}

.no-card {
  background: rgba(var(--color-warning-rgb), 0.1);
  color: var(--color-warning);
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
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

.action-btn:hover {
  transform: translateY(-1px);
}

.action-btn i {
  font-size: 0.9rem;
}

.dissociate-btn {
  background: rgba(147, 51, 234, 0.2);
  border: 1px solid rgba(147, 51, 234, 0.3);
  color: rgb(216, 180, 254);
  box-shadow: 
    0 4px 6px -1px rgba(147, 51, 234, 0.1),
    0 2px 4px -1px rgba(147, 51, 234, 0.06);
}

.dissociate-btn:hover {
  background: rgba(147, 51, 234, 0.3);
  border-color: rgba(147, 51, 234, 0.4);
  box-shadow: 
    0 10px 15px -3px rgba(147, 51, 234, 0.2),
    0 4px 6px -2px rgba(147, 51, 234, 0.1),
    0 0 0 1px rgba(147, 51, 234, 0.2) inset;
}

.delete-btn {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: rgb(252, 165, 165);
  box-shadow: 
    0 4px 6px -1px rgba(239, 68, 68, 0.1),
    0 2px 4px -1px rgba(239, 68, 68, 0.06);
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.3);
  border-color: rgba(239, 68, 68, 0.4);
  box-shadow: 
    0 10px 15px -3px rgba(239, 68, 68, 0.2),
    0 4px 6px -2px rgba(239, 68, 68, 0.1),
    0 0 0 1px rgba(239, 68, 68, 0.2) inset;
}

.create-modal-overlay {
  background: rgba(0, 0, 0, 0.85);
}

.modal-content.create-user-modal {
  width: 500px;
  max-width: 95%;
  background: var(--bg-primary);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.2),
    0 10px 10px -5px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.create-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  background: rgba(var(--color-primary-rgb), 0.1);
  border-bottom: 1px solid rgba(var(--color-primary-rgb), 0.2);
}

.create-modal-title {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.create-modal-title i {
  font-size: 1.5rem;
  color: var(--color-primary);
}

.create-modal-title h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  background: linear-gradient(135deg, var(--text-primary), var(--color-primary));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.create-modal-body {
  padding: 1.5rem;
}

.create-user-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-group label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-left: 0.25rem;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-wrapper i {
  position: absolute;
  left: 0.75rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
  pointer-events: none;
}

.input-wrapper input,
.input-wrapper select {
  width: 100%;
  padding: 0.6rem 0.75rem 0.6rem 2.25rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.input-wrapper input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.input-wrapper input:hover,
.input-wrapper select:hover {
  border-color: rgba(var(--color-primary-rgb), 0.3);
}

.input-wrapper input:focus,
.input-wrapper select:focus {
  outline: none;
  border-color: var(--color-primary);
  background: rgba(var(--color-primary-rgb), 0.1);
  box-shadow: 
    0 0 0 2px rgba(var(--color-primary-rgb), 0.2),
    0 2px 4px -1px rgba(0, 0, 0, 0.1);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.cancel-btn,
.confirm-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem 1.5rem;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-1px);
}

.confirm-btn {
  background: var(--color-primary);
  border: none;
  color: white;
  box-shadow: 
    0 4px 6px -1px rgba(var(--color-primary-rgb), 0.2),
    0 2px 4px -1px rgba(var(--color-primary-rgb), 0.1);
}

.confirm-btn:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: 
    0 10px 15px -3px rgba(var(--color-primary-rgb), 0.3),
    0 4px 6px -2px rgba(var(--color-primary-rgb), 0.15);
}

.confirm-btn:active,
.cancel-btn:active {
  transform: translateY(0);
}

.action-cell {
  text-align: center;
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

  th, td {
    padding: 1rem 1.5rem;
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style> 