<template>
  <div class="card">
    <div class="card-header">
      <div class="icon-wrapper">
        <i class="fas fa-plus"></i>
      </div>
      <h2 class="card-title">Nouvelle Tâche</h2>
    </div>

    <form class="card-form" @submit.prevent="handleSubmit">
      <div class="form-grid">
        <div v-if="isAdmin" class="form-group span-full">
          <label class="form-label">Garage</label>
          <div class="select-wrapper">
            <select v-model="selectedGarageId" class="form-select" required>
              <option value="" disabled>Sélectionner un garage</option>
              <option v-for="garage in garages" :key="garage.id" :value="garage.id">
                {{ garage.name }} - {{ garage.address.city }}
              </option>
            </select>
            <i class="fas fa-chevron-down select-icon"></i>
          </div>
        </div>

        <div class="form-group span-full">
          <label class="form-label">Numéro Horaire</label>
          <input
            v-model="formData.schedule_number"
            class="form-input"
            type="text"
            required
            placeholder="ex: H2024-001"
          />
        </div>

        <div class="form-group span-full">
          <label class="form-label">Nom de la tâche</label>
          <input
            v-model="formData.name"
            class="form-input"
            type="text"
            required
            placeholder="ex: Vidange"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Immatriculation</label>
          <input
            v-model="formData.immatriculation"
            class="form-input"
            type="text"
            required
            placeholder="AB-123-CD"
            pattern="[A-Z]{2}-[0-9]{3}-[A-Z]{2}"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Modèle du véhicule</label>
          <input
            v-model="formData.vehicle_model"
            class="form-input"
            type="text"
            required
            placeholder="ex: Renault Clio"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Temps estimé</label>
          <input
            v-model="formData.hours"
            class="form-input"
            type="number"
            required
            min="0"
            step="0.5"
            placeholder="Heures"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Prix</label>
          <input
            v-model="formData.price"
            class="form-input"
            type="number"
            required
            min="0"
            step="0.01"
            placeholder="€"
          />
        </div>
      </div>

      <button type="submit" class="button-primary">
        <i class="fas fa-plus"></i>
        <span>Créer la tâche</span>
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import authService from '../../services/auth.service'
import garageService from '../../services/garage.service'
import { useToast } from '../../composables/useToast'
import type { Garage } from '../../types/garage'
import type { User } from '../../types/auth'
import { taskService } from '../../services/task.service'

const emit = defineEmits(['taskCreated'])

const { show: showToast } = useToast()
const user = ref<User | null>(authService.getUser())
const garages = ref<Garage[]>([])
const selectedGarageId = ref('')

const isAdmin = computed(() => (user.value?.role ?? 0) >= 2)

const formData = ref({
  name: '',
  immatriculation: '',
  vehicle_model: '',
  hours: 0,
  price: 0,
  schedule_number: ''
})

onMounted(() => {
  garages.value = garageService.getGarages()
  if (!isAdmin.value && user.value?.garage_id) {
    selectedGarageId.value = user.value.garage_id
  }
})

const handleSubmit = async () => {
  try {
    if (!user.value?.garage_id && !selectedGarageId.value) {
      throw new Error('Veuillez sélectionner un garage')
    }

    const token = authService.getAccessToken()
    if (!token) {
      throw new Error('Non authentifié')
    }

    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        ...formData.value,
        garage_id: isAdmin.value ? selectedGarageId.value : user.value?.garage_id
      })
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.message || 'Erreur lors de la création de la tâche')
    }

    const newTask = await response.json()

    // Mettre à jour le cache des tâches actives
    const currentTasks = taskService.getFromCache()
    currentTasks.push(newTask)
    taskService.saveToCache(currentTasks)

    formData.value = {
      name: '',
      immatriculation: '',
      vehicle_model: '',
      hours: 0,
      price: 0,
      schedule_number: ''
    }

    showToast('Tâche créée avec succès', 'success')
    emit('taskCreated')
  } catch (error: any) {
    console.error('Erreur:', error)
    showToast(error.message || 'Une erreur est survenue', 'error')
  }
}
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
  padding: 1.25rem;
  margin-bottom: 0;
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

.card-form {
  padding: 1rem 1.25rem 1.25rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.span-full {
  grid-column: 1 / -1;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.form-input, .form-select {
  padding: 0.6rem 0.75rem;
  height: 38px;
}

.form-input {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.form-input:hover {
  border-color: rgba(var(--color-primary-rgb), 0.3);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  background: rgba(var(--color-primary-rgb), 0.05);
}

.button-primary {
  width: 100%;
  padding: 12px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.button-primary i {
  font-size: 14px;
}

.button-primary:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
}

.button-primary:active {
  transform: translateY(0);
}

@media (max-width: 480px) {
  .card {
    border-radius: 12px;
  }

  .form-grid {
    gap: 0.6rem;
    margin-bottom: 0.75rem;
  }

  .card-form {
    padding: 0.75rem 1rem 1rem;
  }

  .card-header {
    padding: 1rem;
  }
}

.select-wrapper {
  position: relative;
  width: 100%;
  height: 38px;
}

.form-select {
  width: 100%;
  appearance: none;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.6rem 0.75rem;
  padding-right: 2.5rem;
  color: var(--text-primary);
  font-size: 0.875rem;
  transition: all 0.2s ease;
  cursor: pointer;
}

.form-select:hover {
  border-color: rgba(var(--color-primary-rgb), 0.3);
}

.form-select:focus {
  outline: none;
  border-color: var(--color-primary);
  background: rgba(var(--color-primary-rgb), 0.05);
}

.select-icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
  pointer-events: none;
  font-size: 0.75rem;
  transition: all 0.2s ease;
}

.form-select:hover + .select-icon {
  color: var(--color-primary);
}
</style>
