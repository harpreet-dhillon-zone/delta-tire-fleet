// Response and request shapes for the API in src/worker/routes/.
// Field names match the database columns and SQL aliases exactly.

export type Status = 'ok' | 'warning' | 'critical' | 'no_data'
export type AxleRole = 'steer' | 'drive' | 'trailer'
export type UnitClass = 'tractor' | 'trailer'
export type UnitStatus = 'active' | 'out_of_service' | 'retired'
export type TireType = 'new' | 'retread'
export type TireStatus = 'mounted' | 'in_stock' | 'scrapped'

export interface Issue {
  field: string
  message: string
}

export interface Carrier {
  id: number
  name: string
}

export interface DashboardSummary {
  tires: Record<Status, number>
  units: {
    total_units: number
    // SUM() over zero rows is NULL
    mvi_expired: number | null
    mvi_due_soon: number | null
  }
}

// One row of v_tire_status, as returned by GET /api/tires/attention
export interface AttentionRow {
  tire_id: number
  serial_number: string | null
  brand: string | null
  model: string | null
  size: string | null
  tire_type: TireType
  dot_week: number | null
  dot_year: number | null
  age_years: number | null
  unit_id: number
  unit_number: string
  unit_class: UnitClass
  equipment_type: string | null
  plate: string | null
  mvi_expiry: string | null
  carrier: string | null
  position: string
  axle_role: AxleRole
  last_inspected: string | null
  min_tread_32: number | null
  pressure_psi: number | null
  condition: string | null
  tread_status: Status
  age_status: Status
  severity: number
}

export interface AttentionFilters {
  carrier?: string
  unit_class?: UnitClass
  axle_role?: AxleRole
  unit?: string
  brand?: string
  tread_status?: Status
  age_status?: Status
  min_severity?: number
  limit?: number
}

// GET /api/units
export interface UnitSummary {
  id: number
  unit_number: string
  unit_class: UnitClass
  equipment_type: string | null
  plate: string | null
  vin: string | null
  axle_layout: string
  mvi_expiry: string | null
  status: UnitStatus
  carrier: string | null
  worst_severity: number // -1 when the unit has no tires with status
  critical_tires: number
  warning_tires: number
  tire_count: number
}

export interface UnitFilters {
  search?: string
  carrier_id?: number
  unit_class?: UnitClass
  status?: UnitStatus
}

export interface Unit {
  id: number
  unit_number: string
  unit_class: UnitClass
  equipment_type: string | null
  carrier_id: number | null
  carrier: string | null
  plate: string | null
  vin: string | null
  // From migration 0002; absent until it is applied
  make?: string | null
  model_year?: number | null
  axle_layout: string
  mvi_expiry: string | null
  status: UnitStatus
  notes: string | null
  created_at: string
  updated_at: string
}

// A tire as listed on GET /api/units/:id. Status fields are null when the
// unit is not active (v_tire_status only covers active units).
export interface UnitTire {
  tire_id: number
  position: string
  serial_number: string | null
  brand: string | null
  model: string | null
  size: string | null
  dot_week: number | null
  dot_year: number | null
  min_tread_32: number | null
  age_years: number | null
  last_inspected: string | null
  tread_status: Status | null
  age_status: Status | null
  severity: number | null
  axle_role: AxleRole | null
}

export interface UnitDetail {
  unit: Unit
  positions: string[]
  tires: UnitTire[]
}

export interface Tire {
  id: number
  serial_number: string | null
  dot_code: string | null
  dot_week: number | null
  dot_year: number | null
  brand: string | null
  model: string | null
  size: string | null
  tire_type: TireType
  original_tread_32: number | null
  unit_id: number | null
  unit_number: string | null
  position: string | null
  install_date: string | null
  status: TireStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Inspection {
  id: number
  tire_id: number
  unit_id: number | null
  position: string | null
  inspected_at: string
  tread_outer_32: number | null
  tread_center_32: number | null
  tread_inner_32: number | null
  pressure_psi: number | null
  condition: string | null
  notes: string | null
  inspector: string | null
  created_at: string
}

export interface TireMove {
  id: number
  tire_id: number
  from_unit_id: number | null
  from_position: string | null
  from_unit: string | null
  to_unit_id: number | null
  to_position: string | null
  to_unit: string | null
  moved_at: string
  reason: string | null
  created_at: string
}

export interface TireDetail {
  tire: Tire
  inspections: Inspection[]
  moves: TireMove[]
}

export interface Setting {
  key: string
  value: number
  label: string | null
}

export interface VinDecode {
  vin: string
  check_digit_ok: boolean
  make: string | null
  model: string | null
  year: number | null
  manufacturer: string | null
  body_class: string | null
  vehicle_type: string | null
}

// ---- Request bodies ----

export interface ReadingInput {
  tire_id: number
  tread_outer_32?: number
  tread_center_32?: number
  tread_inner_32?: number
  pressure_psi?: number
  condition?: string
  notes?: string
}

export interface InspectionInput {
  inspected_at?: string
  inspector?: string
  readings: ReadingInput[]
}

export interface TireFieldsInput {
  serial_number?: string
  dot_code?: string
  dot_week?: number
  dot_year?: number
  brand?: string
  model?: string
  size?: string
  tire_type?: TireType
  original_tread_32?: number
  notes?: string
}

export interface TireCreateInput extends TireFieldsInput {
  unit_id?: number
  position?: string
  install_date?: string
}

export interface TireMoveInput {
  to_unit_id: number | null
  to_position: string | null
  new_status: TireStatus
  reason: string
  moved_at?: string
}

export interface UnitInput {
  unit_number: string
  unit_class: UnitClass
  equipment_type?: string
  carrier_id?: number
  plate?: string
  vin?: string
  make?: string
  model_year?: number
  axle_layout: string
  mvi_expiry?: string
  status?: UnitStatus
  notes?: string
}
