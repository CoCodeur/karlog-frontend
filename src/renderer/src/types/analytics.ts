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

export interface AnalyticsPeriod {
  date: string
  processing_timestamp: string
  financial_kpi: FinancialKPI
  lost_revenue_kpi: LostRevenueKPI
  optimization_kpi: OptimizationKPI
  simulation_kpi: SimulationKPI
}

export interface GarageAnalytics {
  garage_id: string
  garage_name: string
  company_id: string
  monthly_analytics: AnalyticsPeriod[]
  yearly_analytics: AnalyticsPeriod[]
} 