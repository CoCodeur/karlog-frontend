<template>
  <Teleport to="body">
    <div v-if="isModalOpen" class="dashboard-overlay" @click="closeModal">
      <div class="dashboard-wrapper" @click.stop>
        <div class="dashboard-header">
          <div class="dashboard-title">
            <h2>Tableau de bord</h2>
            <div class="filters">
              <div class="filter-group">
                <select v-model="selectedGarageId" class="filter-select">
                  <option value="">Tous les garages</option>
                  <option
                    v-for="garage in analytics"
                    :key="garage.garage_id"
                    :value="garage.garage_id"
                  >
                    Garage {{ garage.garage_id }}
                  </option>
                </select>
              </div>
              <div class="filter-group">
                <select v-model="periodType" class="filter-select">
                  <option value="monthly">Par mois</option>
                  <option value="yearly">Par année</option>
                </select>
              </div>
              <div v-if="periodType === 'monthly'" class="filter-group">
                <input
                  v-model="selectedMonth"
                  type="month"
                  class="filter-select"
                  :max="currentMonth"
                />
              </div>
              <div v-else class="filter-group">
                <select v-model="selectedYear" class="filter-select">
                  <option v-for="year in availableYears" :key="year" :value="year">
                    {{ year }}
                  </option>
                </select>
              </div>
            </div>
          </div>
          <button class="close-btn" @click="closeModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="dashboard-content">
          <div class="view-selector">
            <button
              class="view-btn"
              :class="{ active: currentView === 'kpis' }"
              @click="currentView = 'kpis'"
            >
              <i class="fas fa-chart-pie"></i>
              Indicateurs
            </button>
            <button
              class="view-btn"
              :class="{ active: currentView === 'charts' }"
              @click="currentView = 'charts'"
            >
              <i class="fas fa-chart-bar"></i>
              Graphiques
            </button>
          </div>

          <template v-if="currentAnalytics">
            <!-- Vue Indicateurs -->
            <template v-if="currentView === 'kpis'">
              <!-- Indicateurs -->
              <div class="kpi-section">
                <h3>Indicateurs</h3>
                <div class="kpi-grid">
                  <div v-for="(kpi, index) in kpiCards" :key="index" class="kpi-card">
                    <div class="kpi-header">
                      <i :class="kpi.icon"></i>
                      <div class="info-icon">
                        <i
                          class="fas fa-info-circle"
                          @mouseenter="showTooltip(index)"
                          @mouseleave="hideTooltip(index)"
                        ></i>
                        <div class="tooltip" :class="{ show: activeTooltip === index }">
                          {{ kpi.description }}
                        </div>
                      </div>
                    </div>
                    <div class="kpi-body">
                      <h4>{{ kpi.label }}</h4>
                      <p class="kpi-value">{{ kpi.value }}</p>
                      <div
                        v-if="kpi.evolution !== undefined"
                        class="kpi-evolution"
                        :class="getEvolutionClass(kpi.evolution, kpi.isWarning)"
                      >
                        <i :class="getEvolutionIcon(kpi.evolution, kpi.isWarning)"></i>
                        {{ formatEvolution(kpi.evolution) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <!-- Vue Graphiques -->
            <template v-if="currentView === 'charts'">
              <div class="chart-controls">
                <select v-model="selectedChart" class="chart-select">
                  <option value="revenue">Chiffre d'affaires</option>
                  <option value="profitability">Rentabilité</option>
                  <option value="delay">Taux de retard</option>
                  <option value="cancellation">Taux d'annulation</option>
                  <option value="losses">Pertes estimées</option>
                  <option value="average">Revenu moyen par tâche</option>
                </select>
              </div>

              <div class="single-chart-container">
                <div class="chart-card full-screen">
                  <h3>{{ getChartTitle }}</h3>
                  <div class="chart-container">
                    <canvas ref="mainChart"></canvas>
                  </div>
                </div>
              </div>
            </template>
          </template>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick, onBeforeUnmount } from 'vue'
import { Chart, Scale, CoreScaleOptions } from 'chart.js/auto'
import { useToast } from '../../composables/useToast'
import type { AnalyticsPeriod } from '../../types/analytics'
import { formatCurrency, formatPercent } from '../../utils/formatters'
import { analyticsService } from '../../services/analytics.service'
import type { GarageAnalytics } from '../../types/analytics'

const props = defineProps<{
  isModalOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { show: showToast } = useToast()

const loading = ref(false)
const analytics = ref<GarageAnalytics[]>([])
const selectedGarageId = ref('')
const periodType = ref('monthly')
const selectedMonth = ref(new Date().toISOString().slice(0, 7))
const selectedYear = ref(new Date().getFullYear().toString())
const currentMonth = new Date().toISOString().slice(0, 7)
const activeTooltip = ref<string | number | null>(null)
const currentView = ref('kpis')
const selectedChart = ref('revenue')
const mainChart = ref<HTMLCanvasElement | null>(null)

const charts: { [key: string]: Chart | null } = {
  main: null
}

const availableYears = computed(() => {
  const years = new Set<number>()
  analytics.value.forEach((garage) => {
    garage.yearly_analytics.forEach((analytics) => {
      years.add(new Date(analytics.date).getFullYear())
    })
  })
  return Array.from(years).sort((a, b) => b - a)
})

const selectedAnalytics = computed(() => {
  if (!analytics.value) return []

  if (selectedGarageId.value) {
    return analytics.value.filter((garage) => garage.garage_id === selectedGarageId.value)
  }

  return analytics.value
})

const currentAnalytics = computed(() => {
  if (!selectedAnalytics.value.length) {
    return {
      date: periodType.value === 'monthly' ? selectedMonth.value : selectedYear.value,
      processing_timestamp: new Date().toISOString(),
      chiffre_affaires_total: 0,
      rentabilite: 0,
      taux_retard: 0,
      taux_annulation: 0,
      perte_estimee: 0,
      revenu_moyen_par_tache: 0,
      evolution: {
        chiffre_affaires_total: 0,
        rentabilite: 0,
        taux_retard: 0,
        taux_annulation: 0,
        perte_estimee: 0,
        revenu_moyen_par_tache: 0
      }
    }
  }

  if (selectedGarageId.value) {
    const garage = selectedAnalytics.value[0]
    const data =
      periodType.value === 'monthly'
        ? garage.monthly_analytics.find((a) => a.date === selectedMonth.value)
        : garage.yearly_analytics.find((a) => a.date.startsWith(selectedYear.value))

    if (!data) {
      return {
        date: periodType.value === 'monthly' ? selectedMonth.value : selectedYear.value,
        processing_timestamp: new Date().toISOString(),
        chiffre_affaires_total: 0,
        rentabilite: 0,
        taux_retard: 0,
        taux_annulation: 0,
        perte_estimee: 0,
        revenu_moyen_par_tache: 0,
        evolution: {
          chiffre_affaires_total: 0,
          rentabilite: 0,
          taux_retard: 0,
          taux_annulation: 0,
          perte_estimee: 0,
          revenu_moyen_par_tache: 0
        }
      }
    }

    return data
  }

  // Agréger les données de tous les garages
  const garagesData = selectedAnalytics.value
    .map((garage) => {
      if (periodType.value === 'monthly') {
        return garage.monthly_analytics.find((a) => a.date === selectedMonth.value)
      }
      return garage.yearly_analytics.find((a) => a.date.startsWith(selectedYear.value))
    })
    .filter((data) => data !== undefined) as AnalyticsPeriod[]

  if (!garagesData.length) {
    return {
      date: periodType.value === 'monthly' ? selectedMonth.value : selectedYear.value,
      processing_timestamp: new Date().toISOString(),
      chiffre_affaires_total: 0,
      rentabilite: 0,
      taux_retard: 0,
      taux_annulation: 0,
      perte_estimee: 0,
      revenu_moyen_par_tache: 0,
      evolution: {
        chiffre_affaires_total: 0,
        rentabilite: 0,
        taux_retard: 0,
        taux_annulation: 0,
        perte_estimee: 0,
        revenu_moyen_par_tache: 0
      }
    }
  }

  return {
    date: garagesData[0].date,
    processing_timestamp: garagesData[0].processing_timestamp,
    chiffre_affaires_total: garagesData.reduce((sum, data) => sum + data.chiffre_affaires_total, 0),
    rentabilite: garagesData.reduce((sum, data) => sum + data.rentabilite, 0) / garagesData.length,
    taux_retard: garagesData.reduce((sum, data) => sum + data.taux_retard, 0) / garagesData.length,
    taux_annulation:
      garagesData.reduce((sum, data) => sum + data.taux_annulation, 0) / garagesData.length,
    perte_estimee: garagesData.reduce((sum, data) => sum + data.perte_estimee, 0),
    revenu_moyen_par_tache:
      garagesData.reduce((sum, data) => sum + data.revenu_moyen_par_tache, 0) / garagesData.length,
    evolution: {
      chiffre_affaires_total: garagesData.reduce(
        (sum, data) => sum + data.evolution.chiffre_affaires_total,
        0
      ),
      rentabilite:
        garagesData.reduce((sum, data) => sum + data.evolution.rentabilite, 0) / garagesData.length,
      taux_retard:
        garagesData.reduce((sum, data) => sum + data.evolution.taux_retard, 0) / garagesData.length,
      taux_annulation:
        garagesData.reduce((sum, data) => sum + data.evolution.taux_annulation, 0) /
        garagesData.length,
      perte_estimee: garagesData.reduce((sum, data) => sum + data.evolution.perte_estimee, 0),
      revenu_moyen_par_tache:
        garagesData.reduce((sum, data) => sum + data.evolution.revenu_moyen_par_tache, 0) /
        garagesData.length
    }
  }
})

const kpiCards = computed(() => {
  if (!currentAnalytics.value) return []

  return [
    {
      label: "Chiffre d'affaires",
      value: formatCurrency(currentAnalytics.value.chiffre_affaires_total),
      icon: 'fas fa-euro-sign',
      evolution: currentAnalytics.value.evolution.chiffre_affaires_total,
      description: "Chiffre d'affaires total de la période",
      gradient: 'from-violet-500 to-purple-500'
    },
    {
      label: 'Rentabilité',
      value: formatPercent(currentAnalytics.value.rentabilite),
      icon: 'fas fa-chart-line',
      evolution: currentAnalytics.value.evolution.rentabilite,
      description: 'Taux de rentabilité',
      gradient:
        currentAnalytics.value.rentabilite < 0
          ? 'from-red-500 to-red-600'
          : 'from-violet-500 to-purple-500'
    },
    {
      label: 'Taux de retard',
      value: formatPercent(currentAnalytics.value.taux_retard),
      icon: 'fas fa-clock',
      evolution: -currentAnalytics.value.evolution.taux_retard,
      description: 'Pourcentage des tâches en retard',
      gradient:
        currentAnalytics.value.taux_retard > 20
          ? 'from-red-500 to-red-600'
          : 'from-violet-500 to-purple-500',
      isWarning: true
    },
    {
      label: "Taux d'annulation",
      value: formatPercent(currentAnalytics.value.taux_annulation),
      icon: 'fas fa-times-circle',
      evolution: -currentAnalytics.value.evolution.taux_annulation,
      description: 'Pourcentage des tâches annulées',
      gradient:
        currentAnalytics.value.taux_annulation > 15
          ? 'from-red-500 to-red-600'
          : 'from-violet-500 to-purple-500',
      isWarning: true
    },
    {
      label: 'Perte estimée',
      value: formatCurrency(currentAnalytics.value.perte_estimee),
      icon: 'fas fa-exclamation-triangle',
      evolution: -currentAnalytics.value.evolution.perte_estimee,
      description: 'Pertes financières estimées',
      gradient:
        currentAnalytics.value.perte_estimee > 0
          ? 'from-red-500 to-red-600'
          : 'from-violet-500 to-purple-500',
      isWarning: true
    },
    {
      label: 'Revenu moyen/tâche',
      value: formatCurrency(currentAnalytics.value.revenu_moyen_par_tache),
      icon: 'fas fa-tasks',
      evolution: currentAnalytics.value.evolution.revenu_moyen_par_tache,
      description: 'Revenu moyen par tâche',
      gradient: 'from-violet-500 to-purple-500'
    }
  ]
})

const closeModal = () => {
  emit('close')
}

const fetchAnalytics = async () => {
  try {
    loading.value = true
    console.log('Fetching analytics data...')
    analytics.value = await analyticsService.getAnalytics()
    console.log('Analytics data received:', analytics.value)
  } catch (error) {
    console.error('Erreur lors du chargement des analytics:', error)
    showToast('Erreur lors du chargement des analytics', 'error')
  } finally {
    loading.value = false
  }
}

const showTooltip = (index: string | number) => {
  activeTooltip.value = index
}

const hideTooltip = (index: string | number) => {
  if (activeTooltip.value === index) {
    activeTooltip.value = null
  }
}

const getChartTitle = computed(() => {
  const titles = {
    revenue: "Évolution du chiffre d'affaires",
    profitability: 'Évolution de la rentabilité',
    delay: 'Évolution du taux de retard',
    cancellation: "Évolution du taux d'annulation",
    losses: 'Évolution des pertes estimées',
    average: 'Évolution du revenu moyen par tâche'
  }
  return titles[selectedChart.value] || ''
})

const getHistoricalData = (type: string) => {
  const dates: string[] = []
  const data: number[] = []

  if (periodType.value === 'monthly') {
    // Utiliser le mois sélectionné comme référence
    const current = new Date(selectedMonth.value)
    const selectedDate = new Date(new Date(current).setMonth(current.getMonth() + 1))
    // Commencer par le mois sélectionné et remonter 3 mois en arrière
    for (let i = 0; i <= 3; i++) {
      const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - (3 - i), 1)
      const monthStr = date.toISOString().slice(0, 7)
      dates.push(monthStr)

      const monthData = selectedAnalytics.value
        .map((garage) => {
          const analytics = garage.monthly_analytics.find((a) => a.date === monthStr)
          if (!analytics) return 0
          switch (type) {
            case 'revenue':
              return analytics.chiffre_affaires_total
            case 'profitability':
              return analytics.rentabilite
            case 'delay':
              return analytics.taux_retard
            case 'cancellation':
              return analytics.taux_annulation
            case 'losses':
              return analytics.perte_estimee
            case 'average':
              return analytics.revenu_moyen_par_tache
            default:
              return 0
          }
        })
        .reduce((sum, val) => sum + val, 0)

      data.push(monthData)
    }
  } else {
    // Utiliser l'année sélectionnée comme référence
    const targetYear = parseInt(selectedYear.value)

    // Commencer par l'année sélectionnée et remonter 3 ans en arrière
    for (let i = 0; i <= 3; i++) {
      const year = targetYear - (3 - i)
      dates.push(year.toString())

      const yearData = selectedAnalytics.value
        .map((garage) => {
          const analytics = garage.yearly_analytics.find((a) => a.date.startsWith(year.toString()))
          if (!analytics) return 0
          switch (type) {
            case 'revenue':
              return analytics.chiffre_affaires_total
            case 'profitability':
              return analytics.rentabilite
            case 'delay':
              return analytics.taux_retard
            case 'cancellation':
              return analytics.taux_annulation
            case 'losses':
              return analytics.perte_estimee
            case 'average':
              return analytics.revenu_moyen_par_tache
            default:
              return 0
          }
        })
        .reduce((sum, val) => sum + val, 0)

      data.push(yearData)
    }
  }

  return { dates, data }
}

const initCharts = () => {
  // Destruction du graphique existant
  if (charts.main) {
    charts.main.destroy()
  }

  if (!mainChart.value) return

  const { dates, data } = getHistoricalData(selectedChart.value)

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'rgb(255, 255, 255)',
        bodyColor: 'rgb(255, 255, 255)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        callbacks: {
          label: (context: { parsed: { y: number } }) => {
            const value = context.parsed.y
            switch (selectedChart.value) {
              case 'revenue':
              case 'losses':
              case 'average':
                return formatCurrency(value)
              case 'profitability':
              case 'delay':
              case 'cancellation':
                return formatPercent(value)
              default:
                return value.toString()
            }
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear' as const,
        beginAtZero: true,
        ticks: {
          color: 'rgb(255, 255, 255)',
          font: { size: 12 },
          callback: function (this: Scale<CoreScaleOptions>, tickValue: number | string) {
            const value = typeof tickValue === 'string' ? parseFloat(tickValue) : tickValue
            switch (selectedChart.value) {
              case 'revenue':
              case 'losses':
              case 'average':
                return formatCurrency(value)
              case 'profitability':
              case 'delay':
              case 'cancellation':
                return formatPercent(value)
              default:
                return value
            }
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      x: {
        type: 'category' as const,
        ticks: {
          color: 'rgb(255, 255, 255)',
          font: { size: 12 }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    }
  }

  charts.main = new Chart(mainChart.value, {
    type: 'bar',
    data: {
      labels: dates.map((date) =>
        periodType.value === 'monthly'
          ? new Date(date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
          : date
      ),
      datasets: [
        {
          data: data.length > 0 ? data : Array(4).fill(0),
          backgroundColor: 'rgba(147, 51, 234, 0.5)',
          borderColor: 'rgb(147, 51, 234)',
          borderWidth: 1,
          borderRadius: 8,
          barThickness: 50,
          hoverBackgroundColor: 'rgba(147, 51, 234, 0.7)'
        }
      ]
    },
    options: chartOptions
  })
}

watch([currentView, selectedChart, currentAnalytics, selectedGarageId, periodType], () => {
  if (currentView.value === 'charts') {
    nextTick(() => {
      initCharts()
    })
  }
})

onBeforeUnmount(() => {
  Object.values(charts).forEach((chart) => {
    if (chart) {
      chart.destroy()
    }
  })
})

onMounted(async () => {
  console.log('DashboardCard mounted, isModalOpen:', props.isModalOpen)
  if (props.isModalOpen) {
    await fetchAnalytics()
  }
})

const formatEvolution = (value: number): string => {
  const absValue = Math.abs(value)
  return `${value >= 0 ? '+' : '-'}${absValue.toFixed(1)}%`
}

const getEvolutionClass = (value: number, isWarning = false): string => {
  if (isWarning) {
    return value < 0 ? 'evolution-positive' : 'evolution-negative'
  }
  return value >= 0 ? 'evolution-positive' : 'evolution-negative'
}

const getEvolutionIcon = (value: number, isWarning = false): string => {
  if (isWarning) {
    return value < 0 ? 'fas fa-arrow-down' : 'fas fa-arrow-up'
  }
  return value >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down'
}
</script>

<style scoped>
.dashboard-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.dashboard-wrapper {
  width: 95%;
  height: 95vh;
  background: var(--bg-primary);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideIn 0.4s ease;
}

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.dashboard-title {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.dashboard-title h2 {
  font-size: 2.5rem;
  font-weight: 700;
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

.filters {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-select {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
  font-size: 0.95rem;
  min-width: 150px;
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
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

.dashboard-content {
  flex: 1;
  overflow: auto;
  padding: 2rem;
}

.view-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  width: fit-content;
  margin: 0 auto 2rem;
}

.view-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: transparent;
  color: var(--text-secondary);
  border: none;
}

.view-btn.active {
  background: var(--color-primary);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.2);
}

.view-btn:hover:not(.active) {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.05);
}

.chart-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  width: fit-content;
  margin: 0 auto;
}

.chart-select {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
  font-size: 0.95rem;
  min-width: 150px;
}

.single-chart-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  width: 100%;
}

.chart-card {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 20px;
  padding: 2rem;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  min-height: 600px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  animation: slideIn 0.4s ease;
  animation-fill-mode: both;
  transition: all 0.3s ease;
}

.chart-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.2);
}

.chart-card h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
  text-align: center;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.chart-container {
  flex: 1;
  min-height: 500px;
  width: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Make the first chart (Chiffre d'affaires) span full width */
.chart-card:first-child {
  grid-column: 1 / -1;
  min-height: 500px;
}

.chart-card:first-child .chart-container {
  min-height: 400px;
}

@media (max-width: 1200px) {
  .chart-card {
    min-height: 400px;
  }

  .chart-card:first-child {
    min-height: 500px;
  }
}

.kpi-section {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.03);
  animation: slideIn 0.4s ease;
  animation-fill-mode: both;
}

.kpi-section:nth-child(1) {
  animation-delay: 0.1s;
}
.kpi-section:nth-child(2) {
  animation-delay: 0.2s;
}
.kpi-section:nth-child(3) {
  animation-delay: 0.3s;
}
.kpi-section:nth-child(4) {
  animation-delay: 0.4s;
}

.kpi-section h3 {
  font-size: 1.1rem;
  font-weight: 400;
  margin-bottom: 1.25rem;
  color: var(--text-secondary);
  letter-spacing: 0.5px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.kpi-card {
  background: rgba(255, 255, 255, 0.015);
  border-radius: 16px;
  padding: 2rem;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.02);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
  z-index: 1;
}

.kpi-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.03));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.kpi-card:hover {
  transform: translateY(-4px) scale(1.02);
  background: rgba(255, 255, 255, 0.03);
  box-shadow:
    0 20px 30px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  z-index: 2;
}

.kpi-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.kpi-header i {
  font-size: 1.5rem;
  color: var(--text-secondary);
  opacity: 0.8;
}

.kpi-body h4 {
  font-size: 1rem;
  font-weight: 400;
  color: var(--text-secondary);
  margin: 0 0 1rem 0;
  opacity: 0.8;
}

.kpi-value {
  font-size: 2.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.5px;
  line-height: 1.2;
}

.kpi-card.warning {
  background: rgba(239, 68, 68, 0.03);
}

.kpi-card.warning .kpi-value {
  color: rgb(239, 68, 68);
}

.kpi-card.success {
  background: rgba(34, 197, 94, 0.03);
}

.kpi-card.success .kpi-value {
  color: rgb(34, 197, 94);
}

.info-icon {
  position: relative;
  cursor: help;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.info-icon i {
  font-size: 0.9rem;
  color: var(--text-secondary);
  opacity: 0.5;
  transition: all 0.2s ease;
}

.info-icon:hover i {
  opacity: 0.9;
}

.tooltip {
  position: absolute;
  top: calc(100% + 10px);
  right: -140px;
  width: 280px;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.95);
  border-radius: 12px;
  font-size: 0.9rem;
  line-height: 1.5;
  color: white;
  z-index: 9999;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  transform: translateY(5px);
  pointer-events: none;
}

.tooltip::before {
  content: '';
  position: absolute;
  top: -6px;
  right: 140px;
  width: 12px;
  height: 12px;
  background: rgba(0, 0, 0, 0.95);
  transform: rotate(45deg);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.tooltip.show {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.kpi-evolution {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  margin-top: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  width: fit-content;
}

.evolution-positive {
  color: rgb(34, 197, 94);
  background: rgba(34, 197, 94, 0.1);
}

.evolution-negative {
  color: rgb(239, 68, 68);
  background: rgba(239, 68, 68, 0.1);
}

@keyframes shine {
  to {
    background-position: 200% center;
  }
}

@media (max-width: 768px) {
  .dashboard-wrapper {
    width: 100%;
    height: 100vh;
    border-radius: 0;
  }

  .dashboard-header {
    padding: 1rem;
  }

  .dashboard-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .dashboard-content {
    padding: 1rem;
  }

  .kpi-grid {
    grid-template-columns: 1fr;
  }
}
</style>
