# Template
<template>
  <Teleport to="body">
    <div v-if="isModalOpen" class="modal-overlay" @click="closeModal">
      <div class="modal-wrapper" @click.stop>
        <div class="toast-container">
          <TransitionGroup name="toast">
            <div v-for="toast in toasts" :key="toast.id" :class="['toast', toast.type]">
              {{ toast.message }}
            </div>
          </TransitionGroup>
        </div>
        <div class="modal-header">
          <div class="modal-title">
            <h2>Gestion des Garages</h2>
            <p>{{ garages.length }} garage(s)</p>
          </div>
          <div class="modal-actions">
            <button v-if="userRole >= 2" class="add-garage-btn" @click="openCreateGarageModal">
              <i class="fas fa-plus"></i>
              Nouveau garage
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
                  <th>Adresse</th>
                  <th>Email du compte de service</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="garage in garages" :key="garage.id">
                  <td>{{ garage.name }}</td>
                  <td>{{ formatAddress(garage.address) }}</td>
                  <td>{{ garage.service_account_email || '-' }}</td>
                  <td class="action-cell">
                    <div class="action-buttons">
                      <button class="action-btn edit-btn" @click="openEditGarageModal(garage)">
                        <i class="fas fa-edit"></i>
                        Modifier
                      </button>
                      <button class="action-btn delete-btn" @click="deleteGarage(garage)">
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

  <!-- Modal de création/édition de garage -->
  <Teleport to="body">
    <div
      v-if="showGarageModal"
      class="modal-overlay create-modal-overlay"
      @click="closeGarageModal"
    >
      <div class="modal-content create-garage-modal" @click.stop>
        <div class="create-modal-header">
          <div class="create-modal-title">
            <i class="fas fa-building"></i>
            <h3>{{ isEditing ? 'Modifier le garage' : 'Nouveau Garage' }}</h3>
          </div>
          <button class="close-btn" @click="closeGarageModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="create-modal-body">
          <form class="create-garage-form" @submit.prevent="submitGarage">
            <div class="form-section">
              <div class="form-group">
                <label>Nom</label>
                <div class="input-wrapper">
                  <i class="fas fa-building"></i>
                  <input
                    v-model="garageForm.name"
                    type="text"
                    required
                    placeholder="Nom du garage"
                  />
                </div>
              </div>
            </div>

            <div class="form-section">
              <h4>Adresse</h4>
              <div class="form-group">
                <label>Rue</label>
                <div class="input-wrapper">
                  <i class="fas fa-road"></i>
                  <input
                    v-model="garageForm.address.street"
                    type="text"
                    required
                    placeholder="Numéro et nom de rue"
                  />
                </div>
              </div>

              <div class="form-group-row">
                <div class="form-group">
                  <label>Ville</label>
                  <div class="input-wrapper">
                    <i class="fas fa-city"></i>
                    <input
                      v-model="garageForm.address.city"
                      type="text"
                      required
                      placeholder="Ville"
                    />
                  </div>
                </div>
                <div class="form-group">
                  <label>Code postal</label>
                  <div class="input-wrapper">
                    <i class="fas fa-map-pin"></i>
                    <input
                      v-model="garageForm.address.postal_code"
                      type="text"
                      required
                      placeholder="Code postal"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div v-if="!isEditing" class="form-section">
              <h4>Compte de service</h4>
              <div class="form-group">
                <label>Mot de passe</label>
                <div class="input-wrapper">
                  <i class="fas fa-lock"></i>
                  <input
                    v-model="garageForm.service_account_password"
                    :type="showPassword ? 'text' : 'password'"
                    required
                    placeholder="Mot de passe du compte de service"
                  />
                  <button
                    type="button"
                    class="toggle-password-btn"
                    :title="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
                    @click="showPassword = !showPassword"
                  >
                    <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                  </button>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" class="cancel-btn" @click="closeGarageModal">
                <i class="fas fa-times"></i>
                Annuler
              </button>
              <button type="submit" class="confirm-btn">
                <i class="fas fa-check"></i>
                {{ isEditing ? 'Modifier' : 'Créer' }}
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
import garageService from '../../services/garage.service'
import authService from '../../services/auth.service'
import type { Garage, Address } from '../../types/garage'

const props = defineProps<{
  isModalOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const loading = ref(false)
const garages = ref<Garage[]>([])
const showGarageModal = ref(false)
const isEditing = ref(false)
const selectedGarage = ref<Garage | null>(null)
const userRole = computed(() => authService.getUser()?.role ?? 0)
const showPassword = ref(false)
const toasts = ref<Array<{ id: number; message: string; type: string }>>([])
let toastId = 0

interface GarageForm {
  name: string
  address: {
    street: string
    city: string
    postal_code: string
    country: string
  }
  service_account_password?: string
}

const garageForm = ref<GarageForm>({
  name: '',
  address: {
    street: '',
    city: '',
    postal_code: '',
    country: 'France'
  },
  service_account_password: ''
})

const showLocalToast = (message: string, type: 'success' | 'error') => {
  const id = toastId++
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }, 10000)
}

const fetchGarages = async () => {
  loading.value = true
  try {
    // Forcer le rechargement depuis le serveur
    const currentUser = authService.getUser()
    if (!currentUser?.company_id) throw new Error('Non authentifié')
    garages.value = await garageService.fetchCompanyGarages(currentUser.company_id)
  } catch (error) {
    showLocalToast('Erreur lors du chargement des garages', 'error')
  } finally {
    loading.value = false
  }
}

const closeModal = () => {
  emit('close')
}

const openCreateGarageModal = () => {
  isEditing.value = false
  selectedGarage.value = null
  garageForm.value = {
    name: '',
    address: {
      street: '',
      city: '',
      postal_code: '',
      country: 'France'
    },
    service_account_password: ''
  }
  showGarageModal.value = true
}

const openEditGarageModal = (garage: Garage) => {
  isEditing.value = true
  selectedGarage.value = garage
  garageForm.value = {
    name: garage.name,
    address: { ...garage.address }
  }
  showGarageModal.value = true
}

const closeGarageModal = () => {
  showGarageModal.value = false
  garageForm.value = {
    name: '',
    address: {
      street: '',
      city: '',
      postal_code: '',
      country: 'France'
    },
    service_account_password: ''
  }
}

const submitGarage = async () => {
  try {
    const currentUser = authService.getUser()
    if (!currentUser?.company_id) throw new Error('Non authentifié')

    if (isEditing.value && selectedGarage.value) {
      // Modification
      await garageService.updateGarage(selectedGarage.value.id, {
        name: garageForm.value.name,
        address: garageForm.value.address
      })

      // Mettre à jour la liste des garages
      garages.value = garageService.getGarages()
      showLocalToast('Garage modifié avec succès', 'success')
    } else {
      // Création
      const response = await garageService.createGarage({
        name: garageForm.value.name,
        address: garageForm.value.address,
        company_id: currentUser.company_id,
        service_account_password: garageForm.value.service_account_password || ''
      })

      // Mettre à jour la liste des garages
      garages.value = garageService.getGarages()
      showLocalToast(
        `Garage créé avec succès. Email du compte de service : ${response.service_account.email}`,
        'success'
      )
    }

    closeGarageModal()
  } catch (error) {
    console.error('Erreur:', error)
    const message = error instanceof Error ? error.message : 'Une erreur est survenue'
    showLocalToast(message, 'error')
  }
}

const deleteGarage = async (garage: Garage) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce garage ?')) return

  try {
    await garageService.deleteGarage(garage.id)
    garages.value = garages.value.filter((g) => g.id !== garage.id)
    // Mettre à jour le cache après la suppression
    garageService.saveToCache(garages.value)
    showLocalToast('Garage supprimé avec succès', 'success')
  } catch (error) {
    showLocalToast('Erreur lors de la suppression du garage', 'error')
  }
}

const formatAddress = (address: Address) => {
  return `${address.street}, ${address.postal_code} ${address.city}`
}

watch(
  () => props.isModalOpen,
  (newValue) => {
    if (newValue) {
      fetchGarages()
    }
  }
)

onMounted(() => {
  if (props.isModalOpen) {
    fetchGarages()
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
  max-width: 1200px;
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

.add-garage-btn {
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

.add-garage-btn:hover {
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

.edit-btn {
  background: rgba(var(--color-primary-rgb), 0.2);
  border: 1px solid rgba(var(--color-primary-rgb), 0.3);
  color: var(--color-primary);
}

.edit-btn:hover {
  background: rgba(var(--color-primary-rgb), 0.3);
  border-color: rgba(var(--color-primary-rgb), 0.4);
  box-shadow:
    0 10px 15px -3px rgba(var(--color-primary-rgb), 0.2),
    0 4px 6px -2px rgba(var(--color-primary-rgb), 0.1),
    0 0 0 1px rgba(var(--color-primary-rgb), 0.2) inset;
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
  z-index: 1001;
}

.modal-content.create-garage-modal {
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

.create-garage-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-section {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1.25rem;
}

.form-section h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: var(--text-primary);
  opacity: 0.9;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-wrapper i {
  position: absolute;
  left: 1rem;
  color: var(--text-secondary);
  font-size: 1rem;
  pointer-events: none;
}

.toggle-password-btn {
  position: absolute;
  right: 1rem;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.toggle-password-btn:hover {
  color: var(--text-primary);
}

.toggle-password-btn i {
  position: static;
  pointer-events: auto;
}

.input-wrapper input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.75rem;
  padding-right: 2.75rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.input-wrapper input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.input-wrapper input:hover {
  border-color: rgba(var(--color-primary-rgb), 0.3);
}

.input-wrapper input:focus {
  outline: none;
  border-color: var(--color-primary);
  background: rgba(var(--color-primary-rgb), 0.1);
  box-shadow:
    0 0 0 2px rgba(var(--color-primary-rgb), 0.2),
    0 2px 4px -1px rgba(0, 0, 0, 0.1);
}

.form-group label {
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  opacity: 0.9;
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

  th,
  td {
    padding: 1rem 1.5rem;
  }

  .action-buttons {
    flex-direction: column;
  }
}

.toast-container {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  pointer-events: none;
}

.toast {
  pointer-events: all;
  background: var(--bg-primary);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 8px;
  padding: 1rem;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  max-width: 400px;
  transition: all 0.3s ease;
}

.toast.success {
  border-left: 4px solid var(--color-success);
}

.toast.error {
  border-left: 4px solid var(--color-error);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
