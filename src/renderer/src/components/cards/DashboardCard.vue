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
                  <option v-for="garage in analytics" :key="garage.garage_id" :value="garage.garage_id">
                    {{ garage.garage_name }}
                  </option>
                </select>
              </div>
              <div class="filter-group">
                <select v-model="periodType" class="filter-select">
                  <option value="monthly">Par mois</option>
                  <option value="yearly">Par année</option>
                </select>
              </div>
              <div class="filter-group" v-if="periodType === 'monthly'">
                <input type="month" v-model="selectedMonth" class="filter-select" :max="currentMonth">
              </div>
              <div class="filter-group" v-else>
                <select v-model="selectedYear" class="filter-select">
                  <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
                </select>
              </div>
            </div>
          </div>
          <button class="close-btn" @click="closeModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="dashboard-body">
          <div v-if="loading" class="loading-container">
            <span class="loading loading-spinner loading-lg"></span>
          </div>
          <template v-else>
            <!-- KPIs Financiers avec graphiques -->
            <div class="kpi-section">
              <h3>KPIs Financiers</h3>
              <div class="section-content">
                <div class="kpi-grid">
                  <div class="kpi-card" v-for="(kpi, index) in financialKPIs" :key="index">
                    <div class="tooltip-wrapper">
                      <div class="info-icon">
                        <i class="fas fa-question-circle"></i>
                        <div class="tooltip">{{ kpi.description }}</div>
                      </div>
                    </div>
                    <div class="kpi-icon">
                      <i :class="kpi.icon"></i>
                    </div>
                    <div class="kpi-content">
                      <h4>{{ kpi.label }}</h4>
                      <p class="kpi-value">{{ kpi.value }}</p>
                    </div>
                  </div>
                </div>
                <div class="chart-container">
                  <div class="chart-header">
                    <div class="tooltip-wrapper">
                      <div class="info-icon">
                        <i class="fas fa-question-circle"></i>
                        <div class="tooltip">{{ chartDescriptions.revenue }}</div>
                      </div>
                    </div>
                  </div>
                  <canvas ref="revenueChart"></canvas>
                </div>
              </div>
            </div>

            <!-- KPIs de Pertes avec graphiques -->
            <div class="kpi-section">
              <h3>Revenus perdus</h3>
              <div class="section-content">
                <div class="kpi-grid">
                  <div class="kpi-card" v-for="(kpi, index) in lostRevenueKPIs" :key="index">
                    <div class="tooltip-wrapper">
                      <div class="info-icon">
                        <i class="fas fa-question-circle"></i>
                        <div class="tooltip">{{ kpi.description }}</div>
                      </div>
                    </div>
                    <div class="kpi-icon warning">
                      <i :class="kpi.icon"></i>
                    </div>
                    <div class="kpi-content">
                      <h4>{{ kpi.label }}</h4>
                      <p class="kpi-value">{{ kpi.value }}</p>
                    </div>
                  </div>
                </div>
                <div class="chart-container">
                  <div class="chart-header">
                    <div class="tooltip-wrapper">
                      <div class="info-icon">
                        <i class="fas fa-question-circle"></i>
                        <div class="tooltip">{{ chartDescriptions.lostRevenue }}</div>
                      </div>
                    </div>
                  </div>
                  <canvas ref="lostRevenueChart"></canvas>
                </div>
              </div>
            </div>

            <!-- KPIs d'Optimisation avec graphiques -->
            <div class="kpi-section">
              <h3>Optimisation</h3>
              <div class="section-content">
                <div class="kpi-grid">
                  <div class="kpi-card" v-for="(kpi, index) in optimizationKPIs" :key="index">
                    <div class="tooltip-wrapper">
                      <div class="info-icon">
                        <i class="fas fa-question-circle"></i>
                        <div class="tooltip">{{ kpi.description }}</div>
                      </div>
                    </div>
                    <div class="kpi-icon" :class="{ warning: kpi.isWarning }">
                      <i :class="kpi.icon"></i>
                    </div>
                    <div class="kpi-content">
                      <h4>{{ kpi.label }}</h4>
                      <p class="kpi-value">{{ kpi.value }}</p>
                    </div>
                  </div>
                </div>
                <div class="chart-container">
                  <div class="chart-header">
                    <div class="tooltip-wrapper">
                      <div class="info-icon">
                        <i class="fas fa-question-circle"></i>
                        <div class="tooltip">{{ chartDescriptions.optimization }}</div>
                      </div>
                    </div>
                  </div>
                  <canvas ref="optimizationChart"></canvas>
                </div>
              </div>
            </div>

            <!-- KPIs de Simulation avec graphiques -->
            <div class="kpi-section">
              <h3>Simulations</h3>
              <div class="section-content">
                <div class="kpi-grid">
                  <div class="kpi-card" v-for="(kpi, index) in simulationKPIs" :key="index">
                    <div class="tooltip-wrapper">
                      <div class="info-icon">
                        <i class="fas fa-question-circle"></i>
                        <div class="tooltip">{{ kpi.description }}</div>
                      </div>
                    </div>
                    <div class="kpi-icon success">
                      <i :class="kpi.icon"></i>
                    </div>
                    <div class="kpi-content">
                      <h4>{{ kpi.label }}</h4>
                      <p class="kpi-value">{{ kpi.value }}</p>
                    </div>
                  </div>
                </div>
                <div class="chart-container">
                  <div class="chart-header">
                    <div class="tooltip-wrapper">
                      <div class="info-icon">
                        <i class="fas fa-question-circle"></i>
                        <div class="tooltip">{{ chartDescriptions.simulation }}</div>
                      </div>
                    </div>
                  </div>
                  <canvas ref="simulationChart"></canvas>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { analyticsService } from '../../services/analytics.service'
import type { GarageAnalytics } from '../../types/analytics'
import { useToast } from '../../composables/useToast'
import Chart from 'chart.js/auto'

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

// Références pour les graphiques
const revenueChart = ref<HTMLCanvasElement | null>(null)
const lostRevenueChart = ref<HTMLCanvasElement | null>(null)
const optimizationChart = ref<HTMLCanvasElement | null>(null)
const simulationChart = ref<HTMLCanvasElement | null>(null)

// Instances des graphiques
let revenueChartInstance: Chart | null = null
let lostRevenueChartInstance: Chart | null = null
let optimizationChartInstance: Chart | null = null
let simulationChartInstance: Chart | null = null

const availableYears = computed(() => {
  const years = new Set<number>()
  analytics.value.forEach(garage => {
    garage.yearly_analytics.forEach(analytics => {
      years.add(new Date(analytics.date).getFullYear())
    })
  })
  return Array.from(years).sort((a, b) => b - a)
})

const selectedAnalytics = computed(() => {
  if (!selectedGarageId.value) return analytics.value
  return analytics.value.filter(a => a.garage_id === selectedGarageId.value)
})

const currentAnalytics = computed(() => {
  if (selectedAnalytics.value.length === 0) return null

  const analytics = periodType.value === 'monthly' 
    ? selectedAnalytics.value.map(garage => garage.monthly_analytics.find(a => a.date.startsWith(selectedMonth.value)))
    : selectedAnalytics.value.map(garage => garage.yearly_analytics.find(a => a.date.startsWith(selectedYear.value)))

  if (!selectedGarageId.value) {
    // Agréger les données de tous les garages
    // ... (garder le code existant pour l'agrégation)
  }

  return analytics[0]
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
}

const formatPercent = (value: number) => {
  return new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 1 }).format(value / 100)
}

const formatTime = (hours: number) => {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h}h${m.toString().padStart(2, '0')}`
}

const chartDescriptions = {
  revenue: "Visualisation de l'évolution du chiffre d'affaires dans le temps. La courbe permet d'identifier les tendances et les périodes de croissance ou de ralentissement.",
  lostRevenue: "Comparaison des revenus perdus entre les tâches annulées et non terminées. Les barres empilées permettent de voir la répartition des pertes par type.",
  optimization: "Analyse des pertes dues aux heures supplémentaires vs les gains d'optimisation. Le graphique met en évidence l'équilibre entre pertes et gains d'efficacité.",
  simulation: "Projection des gains potentiels basée sur deux scénarios : augmentation des tarifs et réduction des annulations. Permet d'identifier les opportunités d'amélioration."
}

const financialKPIs = computed(() => {
  if (!currentAnalytics.value) return []
  
  return [
    {
      label: 'Chiffre d\'affaires',
      value: formatCurrency(currentAnalytics.value.financial_kpi.total_revenue),
      icon: 'fas fa-euro-sign',
      description: 'Somme totale des revenus générés par les services sur la période sélectionnée. Inclut toutes les prestations facturées.'
    },
    {
      label: 'CA horaire moyen',
      value: formatCurrency(currentAnalytics.value.financial_kpi.average_hourly_revenue),
      icon: 'fas fa-clock',
      description: 'Revenu moyen généré par heure de travail. Indicateur clé de la rentabilité horaire des services.'
    },
    {
      label: 'Prix moyen service',
      value: formatCurrency(currentAnalytics.value.financial_kpi.average_service_price),
      icon: 'fas fa-tag',
      description: 'Prix moyen facturé par intervention. Permet de suivre l\'évolution des tarifs et la valorisation des services.'
    },
    {
      label: 'Taux de facturation réel',
      value: formatPercent(currentAnalytics.value.financial_kpi.real_billing_rate),
      icon: 'fas fa-percentage',
      description: 'Pourcentage du temps effectivement facturé par rapport au temps total travaillé. Mesure l\'efficacité de la facturation.'
    }
  ]
})

const lostRevenueKPIs = computed(() => {
  if (!currentAnalytics.value) return []
  
  return [
    {
      label: 'Montant tâches annulées',
      value: formatCurrency(currentAnalytics.value.lost_revenue_kpi.canceled_task_amount),
      icon: 'fas fa-ban',
      description: 'Revenus perdus dus aux annulations de services. Représente le manque à gagner direct des annulations.'
    },
    {
      label: 'Montant tâches non terminées',
      value: formatCurrency(currentAnalytics.value.lost_revenue_kpi.unfinished_task_amount),
      icon: 'fas fa-exclamation-triangle',
      description: 'Revenus non perçus sur les tâches inachevées. Impact financier des interventions qui n\'ont pas été menées à terme.'
    }
  ]
})

const optimizationKPIs = computed(() => {
  if (!currentAnalytics.value) return []
  
  return [
    {
      label: 'Pertes dues aux heures sup',
      value: formatCurrency(currentAnalytics.value.optimization_kpi.loss_due_to_overtime),
      icon: 'fas fa-business-time',
      isWarning: true,
      description: 'Coût financier des dépassements horaires. Inclut les surcoûts liés aux heures supplémentaires et à la sous-optimisation du temps.'
    },
    {
      label: 'Gains tâches plus rapides',
      value: formatCurrency(currentAnalytics.value.optimization_kpi.gain_from_faster_tasks),
      icon: 'fas fa-tachometer-alt',
      description: 'Gains réalisés grâce aux interventions terminées plus rapidement que prévu. Mesure de l\'efficacité opérationnelle.'
    },
    {
      label: 'Tâches en heures sup',
      value: formatPercent(currentAnalytics.value.optimization_kpi.percentage_of_overtime_tasks),
      icon: 'fas fa-clock',
      isWarning: true,
      description: 'Pourcentage des interventions ayant dépassé le temps prévu. Indicateur de la précision des estimations et de la gestion du temps.'
    },
    {
      label: 'Temps moyen heures sup',
      value: formatTime(currentAnalytics.value.optimization_kpi.average_overtime_time),
      icon: 'fas fa-hourglass-half',
      isWarning: true,
      description: 'Durée moyenne des dépassements horaires par intervention. Permet d\'évaluer l\'ampleur des dépassements de temps.'
    }
  ]
})

const simulationKPIs = computed(() => {
  if (!currentAnalytics.value) return []
  
  return [
    {
      label: 'CA si +10% facturation',
      value: formatCurrency(currentAnalytics.value.simulation_kpi.revenue_if_billed_10_percent_more),
      icon: 'fas fa-chart-line',
      description: 'Projection du chiffre d\'affaires avec une augmentation de 10% des tarifs. Simulation de l\'impact d\'une revalorisation des services.'
    },
    {
      label: 'Gain si -20% annulations',
      value: formatCurrency(currentAnalytics.value.simulation_kpi.gain_if_20_percent_fewer_cancellations),
      icon: 'fas fa-chart-bar',
      description: 'Gains potentiels si le taux d\'annulation était réduit de 20%. Mesure de l\'opportunité d\'amélioration de la gestion des annulations.'
    }
  ]
})

const closeModal = () => {
  emit('close')
}

const fetchAnalytics = async () => {
  try {
    loading.value = true
    analytics.value = await analyticsService.getAnalytics()
  } catch (error) {
    console.error('Erreur:', error)
    showToast('Erreur lors du chargement des analytics', 'error')
  } finally {
    loading.value = false
  }
}

const updateCharts = () => {
  if (!currentAnalytics.value) return

  // Mise à jour du graphique de revenus
  if (revenueChartInstance) {
    const data = periodType.value === 'monthly' 
      ? selectedAnalytics.value.map(garage => ({
          label: garage.garage_name,
          data: garage.monthly_analytics
            .filter(a => a.date.startsWith(selectedYear.value))
            .map(a => a.financial_kpi.total_revenue),
          borderColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
          tension: 0.4
        }))
      : selectedAnalytics.value.map(garage => ({
          label: garage.garage_name,
          data: garage.yearly_analytics
            .map(a => a.financial_kpi.total_revenue),
          borderColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
          tension: 0.4
        }))

    const labels = periodType.value === 'monthly'
      ? ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
      : availableYears.value

    revenueChartInstance.data.labels = labels
    revenueChartInstance.data.datasets = data
    revenueChartInstance.update()
  }

  // Mise à jour du graphique des revenus perdus
  if (lostRevenueChartInstance) {
    const data = periodType.value === 'monthly'
      ? selectedAnalytics.value.map(garage => [
          {
            label: `${garage.garage_name} - Tâches annulées`,
            data: garage.monthly_analytics
              .filter(a => a.date.startsWith(selectedYear.value))
              .map(a => a.lost_revenue_kpi.canceled_task_amount),
            backgroundColor: `hsla(0, 70%, 50%, 0.8)`,
            stack: garage.garage_name
          },
          {
            label: `${garage.garage_name} - Tâches non terminées`,
            data: garage.monthly_analytics
              .filter(a => a.date.startsWith(selectedYear.value))
              .map(a => a.lost_revenue_kpi.unfinished_task_amount),
            backgroundColor: `hsla(30, 70%, 50%, 0.8)`,
            stack: garage.garage_name
          }
        ]).flat()
      : selectedAnalytics.value.map(garage => [
          {
            label: `${garage.garage_name} - Tâches annulées`,
            data: garage.yearly_analytics
              .map(a => a.lost_revenue_kpi.canceled_task_amount),
            backgroundColor: `hsla(0, 70%, 50%, 0.8)`,
            stack: garage.garage_name
          },
          {
            label: `${garage.garage_name} - Tâches non terminées`,
            data: garage.yearly_analytics
              .map(a => a.lost_revenue_kpi.unfinished_task_amount),
            backgroundColor: `hsla(30, 70%, 50%, 0.8)`,
            stack: garage.garage_name
          }
        ]).flat()

    const labels = periodType.value === 'monthly'
      ? ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
      : availableYears.value

    lostRevenueChartInstance.data.labels = labels
    lostRevenueChartInstance.data.datasets = data
    lostRevenueChartInstance.update()
  }

  // Mise à jour du graphique d'optimisation
  if (optimizationChartInstance) {
    const data = periodType.value === 'monthly'
      ? selectedAnalytics.value.map(garage => [
          {
            label: `${garage.garage_name} - Pertes heures sup`,
            data: garage.monthly_analytics
              .filter(a => a.date.startsWith(selectedYear.value))
              .map(a => a.optimization_kpi.loss_due_to_overtime),
            backgroundColor: `hsla(0, 70%, 50%, 0.8)`,
            stack: 'pertes'
          },
          {
            label: `${garage.garage_name} - Gains optimisation`,
            data: garage.monthly_analytics
              .filter(a => a.date.startsWith(selectedYear.value))
              .map(a => a.optimization_kpi.gain_from_faster_tasks),
            backgroundColor: `hsla(120, 70%, 50%, 0.8)`,
            stack: 'gains'
          }
        ]).flat()
      : selectedAnalytics.value.map(garage => [
          {
            label: `${garage.garage_name} - Pertes heures sup`,
            data: garage.yearly_analytics
              .map(a => a.optimization_kpi.loss_due_to_overtime),
            backgroundColor: `hsla(0, 70%, 50%, 0.8)`,
            stack: 'pertes'
          },
          {
            label: `${garage.garage_name} - Gains optimisation`,
            data: garage.yearly_analytics
              .map(a => a.optimization_kpi.gain_from_faster_tasks),
            backgroundColor: `hsla(120, 70%, 50%, 0.8)`,
            stack: 'gains'
          }
        ]).flat()

    const labels = periodType.value === 'monthly'
      ? ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
      : availableYears.value

    optimizationChartInstance.data.labels = labels
    optimizationChartInstance.data.datasets = data
    optimizationChartInstance.update()
  }

  // Mise à jour du graphique de simulation
  if (simulationChartInstance) {
    const data = periodType.value === 'monthly'
      ? selectedAnalytics.value.map(garage => [
          {
            label: `${garage.garage_name} - CA +10% facturation`,
            data: garage.monthly_analytics
              .filter(a => a.date.startsWith(selectedYear.value))
              .map(a => a.simulation_kpi.revenue_if_billed_10_percent_more),
            backgroundColor: `hsla(200, 70%, 50%, 0.8)`,
            stack: garage.garage_name
          },
          {
            label: `${garage.garage_name} - Gain -20% annulations`,
            data: garage.monthly_analytics
              .filter(a => a.date.startsWith(selectedYear.value))
              .map(a => a.simulation_kpi.gain_if_20_percent_fewer_cancellations),
            backgroundColor: `hsla(270, 70%, 50%, 0.8)`,
            stack: garage.garage_name
          }
        ]).flat()
      : selectedAnalytics.value.map(garage => [
          {
            label: `${garage.garage_name} - CA +10% facturation`,
            data: garage.yearly_analytics
              .map(a => a.simulation_kpi.revenue_if_billed_10_percent_more),
            backgroundColor: `hsla(200, 70%, 50%, 0.8)`,
            stack: garage.garage_name
          },
          {
            label: `${garage.garage_name} - Gain -20% annulations`,
            data: garage.yearly_analytics
              .map(a => a.simulation_kpi.gain_if_20_percent_fewer_cancellations),
            backgroundColor: `hsla(270, 70%, 50%, 0.8)`,
            stack: garage.garage_name
          }
        ]).flat()

    const labels = periodType.value === 'monthly'
      ? ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
      : availableYears.value

    simulationChartInstance.data.labels = labels
    simulationChartInstance.data.datasets = data
    simulationChartInstance.update()
  }
}

const initCharts = () => {
  // Configuration commune pour les graphiques
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.8)'
        }
      }
    },
    scales: {
      y: {
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
          callback: (value: number) => formatCurrency(value)
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      x: {
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    }
  }

  // Initialiser le graphique de revenus
  if (revenueChart.value) {
    revenueChartInstance = new Chart(revenueChart.value, {
      type: 'line',
      data: {
        labels: [],
        datasets: []
      },
      options: {
        ...commonOptions,
        plugins: {
          ...commonOptions.plugins,
          title: {
            display: true,
            text: 'Évolution du chiffre d\'affaires',
            color: 'rgba(255, 255, 255, 0.8)',
            font: {
              size: 16
            }
          }
        }
      }
    })
  }

  // Initialiser le graphique des revenus perdus
  if (lostRevenueChart.value) {
    lostRevenueChartInstance = new Chart(lostRevenueChart.value, {
      type: 'bar',
      data: {
        labels: [],
        datasets: []
      },
      options: {
        ...commonOptions,
        plugins: {
          ...commonOptions.plugins,
          title: {
            display: true,
            text: 'Revenus perdus par type',
            color: 'rgba(255, 255, 255, 0.8)',
            font: {
              size: 16
            }
          }
        }
      }
    })
  }

  // Initialiser le graphique d'optimisation
  if (optimizationChart.value) {
    optimizationChartInstance = new Chart(optimizationChart.value, {
      type: 'bar',
      data: {
        labels: [],
        datasets: []
      },
      options: {
        ...commonOptions,
        plugins: {
          ...commonOptions.plugins,
          title: {
            display: true,
            text: 'Pertes et gains d\'optimisation',
            color: 'rgba(255, 255, 255, 0.8)',
            font: {
              size: 16
            }
          }
        }
      }
    })
  }

  // Initialiser le graphique de simulation
  if (simulationChart.value) {
    simulationChartInstance = new Chart(simulationChart.value, {
      type: 'bar',
      data: {
        labels: [],
        datasets: []
      },
      options: {
        ...commonOptions,
        plugins: {
          ...commonOptions.plugins,
          title: {
            display: true,
            text: 'Simulations d\'amélioration',
            color: 'rgba(255, 255, 255, 0.8)',
            font: {
              size: 16
            }
          }
        }
      }
    })
  }

  // Mettre à jour les graphiques avec les données initiales
  updateCharts()
}

watch([periodType, selectedMonth, selectedYear, selectedGarageId], () => {
  updateCharts()
})

onMounted(async () => {
  if (props.isModalOpen) {
    await fetchAnalytics()
    initCharts()
  }
})
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
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0;
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

.dashboard-body {
  flex: 1;
  overflow: auto;
  padding: 2rem;
}

.kpi-section {
  margin-bottom: 2.5rem;
}

.kpi-section h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: var(--text-primary);
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.kpi-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  position: relative;
}

.kpi-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(var(--color-primary-rgb), 0.1);
  border: 1px solid rgba(var(--color-primary-rgb), 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.kpi-icon i {
  font-size: 1.25rem;
  color: var(--color-primary);
}

.kpi-icon.warning {
  background: rgba(var(--color-warning-rgb), 0.1);
  border-color: rgba(var(--color-warning-rgb), 0.2);
}

.kpi-icon.warning i {
  color: var(--color-warning);
}

.kpi-icon.success {
  background: rgba(var(--color-success-rgb), 0.1);
  border-color: rgba(var(--color-success-rgb), 0.2);
}

.kpi-icon.success i {
  color: var(--color-success);
}

.kpi-content {
  flex: 1;
}

.kpi-content h4 {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin: 0 0 0.5rem;
}

.kpi-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.section-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.chart-container {
  height: 300px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1rem;
  position: relative;
}

.chart-header {
  position: relative;
  height: 0;
}

.tooltip-wrapper {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 1;
}

.info-icon {
  position: relative;
  display: inline-block;
  cursor: help;
}

.info-icon i {
  color: var(--text-secondary);
  font-size: 0.9rem;
  opacity: 0.6;
  transition: opacity 0.2s ease;
}

.info-icon:hover i {
  opacity: 1;
}

.tooltip {
  visibility: hidden;
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 5px;
  width: 300px;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.85rem;
  line-height: 1.4;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  opacity: 0;
  transform: translateY(-10px);
  transition: opacity 0.3s ease, transform 0.3s ease, visibility 0.3s;
  z-index: 1000;
}

.info-icon:hover .tooltip {
  visibility: visible;
  opacity: 1;
  transform: translateY(0);
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

  .dashboard-body {
    padding: 1rem;
  }

  .kpi-grid {
    grid-template-columns: 1fr;
  }
}
</style> 