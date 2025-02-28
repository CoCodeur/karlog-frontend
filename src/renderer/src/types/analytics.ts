export interface FinancialKPI {
  total_revenue: number
  average_hourly_revenue: number
  average_service_price: number
  real_billing_rate: number
}

export interface LostRevenueKPI {
  canceled_task_amount: number
  unfinished_task_amount: number
}

export interface OptimizationKPI {
  loss_due_to_overtime: number
  gain_from_faster_tasks: number
  percentage_of_overtime_tasks: number
  total_overtime_cost: number
  average_overtime_time: number
}

export interface SimulationKPI {
  revenue_if_billed_10_percent_more: number
  gain_if_20_percent_fewer_cancellations: number
}

//interface Evolution {
//  chiffre_affaires_total: number
//  rentabilite: number
//  taux_retard: number
//  taux_annulation: number
//  perte_estimee: number
//  revenu_moyen_par_tache: number
//}

export interface AnalyticsPeriod {
  date: string
  processing_timestamp: string
  chiffre_affaires_total: number
  rentabilite: number
  taux_retard: number
  taux_annulation: number
  perte_estimee: number
  revenu_moyen_par_tache: number
  evolution: {
    chiffre_affaires_total: number
    rentabilite: number
    taux_retard: number
    taux_annulation: number
    perte_estimee: number
    revenu_moyen_par_tache: number
  }
}

export interface GarageAnalytics {
  id: string
  garage_id: string
  monthly_analytics: AnalyticsPeriod[]
  yearly_analytics: AnalyticsPeriod[]
}
