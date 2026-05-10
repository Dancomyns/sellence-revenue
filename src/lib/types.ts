export type PricingModel =
  | 'FIXED'
  | 'FIXED_ADDON'
  | 'PER_UNIT'
  | 'PER_CONV'
  | 'TIERED_CONV'
  | 'TIERED_SALES'
  | 'TIERED_REL'
  | 'PLAN_PLUS'
  | 'HYBRID'

export type ClientStatus = 'Active' | 'Paused' | 'Pilot' | 'Churned' | 'Pipeline' | 'Reduced'

export type Currency = 'USD' | 'NIS'

export type RevenueStatus = 'invoiced' | 'committed' | 'pipeline'

export interface Tier {
  limit: number
  price: number
}

export interface Client {
  id: number
  name: string
  currency: Currency
  model: PricingModel
  status: ClientStatus
  start_date: string | null
  fixed_fee: number
  per_unit_rate: number
  min_fee: number
  max_fee: number
  tiers: Tier[]
  addon1: number
  addon2: number
  twilio_sid: string | null
  notes: string | null
  created_at: string
}

export interface UsageEntry {
  id: number
  client_id: number
  month: string // 'YYYY-MM'
  metric: string
  value: number
  notes: string | null
}

export interface MonthlyRevenue {
  id: number
  client_id: number
  month: string // 'YYYY-MM'
  calculated_usd: number
  manual_usd: number | null
  revenue_status: RevenueStatus
  invoice_ref: string | null
  notes: string | null
}

export interface SmsEntry {
  id: number
  client_id: number
  month: string // 'YYYY-MM'
  sms_count: number
  twilio_cost: number | null
}

export interface Settings {
  exchange_rate: number        // NIS per USD
  twilio_cost_per_sms: number  // Twilio's charge
  sms_bill_rate: number        // what we charge clients
}

// Derived / view types
export interface ClientWithRevenue extends Client {
  revenue_this_month: number
  revenue_status: RevenueStatus
}

export interface DashboardMonth {
  month: string
  invoiced_usd: number
  committed_usd: number
  pipeline_usd: number
  total_usd: number
  sms_revenue_usd: number
}

export interface RevenueRow {
  client: Client
  revenues: Record<string, { amount_usd: number; status: RevenueStatus; manual: boolean }>
}
