// All API response types for CareQueue

export interface User {
  id: string
  email: string
  full_name: string
  role: 'super_admin' | 'clinic_admin' | 'analyst' | 'viewer'
  clinic_id?: string
  is_active: boolean
  created_at: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  user: User
}

export interface DaySchedule {
  open?: string
  close?: string
  is_open?: boolean
  start?: string
  end?: string
  break_start?: string
  break_end?: string
  is_working?: boolean
}

export interface WorkingHours {
  monday?: DaySchedule
  tuesday?: DaySchedule
  wednesday?: DaySchedule
  thursday?: DaySchedule
  friday?: DaySchedule
  saturday?: DaySchedule
  sunday?: DaySchedule
}

export interface Clinic {
  id: string
  name: string
  slug: string
  timezone: string
  working_hours: WorkingHours
  contact_email: string
  address?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Department {
  id: string
  clinic_id: string
  name: string
  code: string
  service_type: string
  avg_service_time_minutes: number
  max_concurrent_patients: number
  is_active: boolean
  created_at: string
}

export interface Doctor {
  id: string
  clinic_id: string
  department_id: string
  full_name: string
  specialization: string
  employee_id?: string
  avg_consultation_minutes: number
  max_patients_per_slot: number
  is_active: boolean
  created_at: string
}

export interface Visit {
  id: string
  clinic_id: string
  patient_token: string
  visit_date: string
  department_id: string
  doctor_id?: string
  arrival_time: string
  registration_time?: string
  triage_time?: string
  called_time?: string
  service_start_time?: string
  service_end_time?: string
  departure_time?: string
  visit_type: string
  notes?: string
  excluded: boolean
  registration_wait_minutes?: number
  queue_wait_minutes?: number
  service_time_minutes?: number
  total_visit_minutes?: number
  created_at: string
}

export interface PaginatedVisits {
  items: Visit[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface AnalyticsResult {
  source: 'historical'
  summary: {
    mean?: number
    median?: number
    p90?: number
    p95?: number
    count: number
    min?: number
    max?: number
  }
  breakdown: Array<{
    group: string
    group_label: string
    count: number
    stats: {
      mean?: number
      median?: number
      p90?: number
      p95?: number
      count: number
    }
  }>
  distribution: { bins: number[]; counts: number[] }
  total_visits: number
  generated_at: string
}

export interface SimConfig {
  id: string
  clinic_id: string
  name: string
  description?: string
  simulation_hours: number
  num_replications: number
  base_seed: number
  departments: Array<{
    department_id: string
    num_servers: number
    arrival_distribution: string
    arrival_params: Record<string, number>
    service_distribution: string
    service_params: Record<string, number>
  }>
  created_at: string
}

export interface SimResult {
  id: string
  clinic_id: string
  config_id: string
  source: 'simulation'
  overall: {
    queue_wait: { mean: number; p90: number; p95: number; count: number }
    service_time: { mean: number; p90: number; count: number }
    total_patients: number
  }
  by_department: Record<string, any>
  computed_at: string
}

export interface DashboardKPIs {
  total_visits: number
  mean_queue_wait_minutes?: number
  median_queue_wait_minutes?: number
  p90_queue_wait_minutes?: number
  mean_service_time_minutes?: number
  busiest_hour?: string
  data_quality_score: number
  trend: 'improving' | 'worsening' | 'stable'
  trend_change_pct: number
}

export interface Insight {
  source: 'historical' | 'simulation'
  type: string
  title: string
  description: string
  severity: 'info' | 'warning' | 'alert'
}

export interface DashboardSummary {
  clinic_id: string
  period: string
  kpis: DashboardKPIs
  insights: Insight[]
  generated_at: string
}

export interface ApiError {
  detail: string | Array<{ loc: string[]; msg: string; type: string }>
}
