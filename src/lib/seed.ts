import { getDb } from './db'

const CLIENTS = [
  { id: 1,  name: 'Panda',               currency: 'NIS', model: 'TIERED_SALES', status: 'Active',   fixed_fee: 2000, per_unit_rate: 0,    min_fee: 0,    max_fee: 0,    tiers: [{limit:100,price:25},{limit:200,price:35},{limit:300,price:45}], addon1: 0,    addon2: 0,    twilio_sid: null, notes: 'Base + tiered per sale' },
  { id: 2,  name: 'Libra',               currency: 'NIS', model: 'FIXED_ADDON',  status: 'Active',   fixed_fee: 13000,per_unit_rate: 0,    min_fee: 0,    max_fee: 0,    tiers: [], addon1: 4000, addon2: 4000, twilio_sid: null, notes: '₪13K car base + ₪4K apartment + ₪4K new clients' },
  { id: 3,  name: 'Calltact',            currency: 'NIS', model: 'FIXED',        status: 'Paused',   fixed_fee: 500,  per_unit_rate: 0,    min_fee: 0,    max_fee: 0,    tiers: [], addon1: 0,    addon2: 0,    twilio_sid: null, notes: 'Paused' },
  { id: 4,  name: 'Allstars',            currency: 'USD', model: 'PLAN_PLUS',    status: 'Active',   fixed_fee: 1000, per_unit_rate: 0,    min_fee: 0,    max_fee: 0,    tiers: [], addon1: 15,   addon2: 150,  twilio_sid: null, notes: '$500/mo + $15/meeting + $150/sale' },
  { id: 5,  name: 'Voom',                currency: 'USD', model: 'PER_UNIT',     status: 'Active',   fixed_fee: 0,    per_unit_rate: 2,    min_fee: 0,    max_fee: 1000, tiers: [], addon1: 0,    addon2: 0,    twilio_sid: null, notes: '$2/policy max $1K' },
  { id: 6,  name: 'Palais des Thes',     currency: 'USD', model: 'TIERED_REL',   status: 'Active',   fixed_fee: 0,    per_unit_rate: 0,    min_fee: 0,    max_fee: 0,    tiers: [{limit:500,price:1000},{limit:1000,price:1800},{limit:2000,price:3200},{limit:3000,price:4200},{limit:4000,price:4800}], addon1: 0, addon2: 0, twilio_sid: null, notes: 'Rel tiers — sits at floor $500 equiv' },
  { id: 7,  name: 'BPM',                 currency: 'NIS', model: 'FIXED',        status: 'Active',   fixed_fee: 1800, per_unit_rate: 0,    min_fee: 0,    max_fee: 0,    tiers: [], addon1: 0,    addon2: 0,    twilio_sid: null, notes: '1800 NIS/mo' },
  { id: 8,  name: 'Heavys',              currency: 'USD', model: 'PER_CONV',     status: 'Active',   fixed_fee: 0,    per_unit_rate: 1.2,  min_fee: 200,  max_fee: 0,    tiers: [], addon1: 0,    addon2: 0,    twilio_sid: null, notes: '$1.20/conv min $200' },
  { id: 9,  name: 'Miamily',             currency: 'USD', model: 'TIERED_CONV',  status: 'Active',   fixed_fee: 0,    per_unit_rate: 0,    min_fee: 0,    max_fee: 0,    tiers: [{limit:250,price:500},{limit:500,price:1000},{limit:750,price:1350},{limit:1000,price:1600},{limit:1500,price:2100},{limit:2000,price:2800}], addon1: 0, addon2: 0, twilio_sid: null, notes: 'Standard conv tiers' },
  { id: 10, name: 'Shade It',            currency: 'USD', model: 'TIERED_CONV',  status: 'Active',   fixed_fee: 0,    per_unit_rate: 0,    min_fee: 0,    max_fee: 0,    tiers: [{limit:250,price:500},{limit:500,price:1000},{limit:750,price:1350},{limit:1000,price:1600},{limit:1500,price:2100},{limit:2000,price:2800}], addon1: 0, addon2: 0, twilio_sid: null, notes: 'Standard conv tiers' },
  { id: 11, name: 'Evinature',           currency: 'USD', model: 'TIERED_CONV',  status: 'Active',   fixed_fee: 0,    per_unit_rate: 0,    min_fee: 0,    max_fee: 0,    tiers: [{limit:250,price:500},{limit:500,price:1000},{limit:750,price:1350},{limit:1000,price:1600},{limit:1500,price:2100},{limit:2000,price:2800}], addon1: 0, addon2: 0, twilio_sid: null, notes: 'Standard conv tiers' },
  { id: 12, name: 'Askrx / Beluga',      currency: 'USD', model: 'FIXED',        status: 'Reduced',  fixed_fee: 150,  per_unit_rate: 0,    min_fee: 0,    max_fee: 0,    tiers: [], addon1: 0,    addon2: 0,    twilio_sid: null, notes: '$150 reduced' },
  { id: 13, name: 'Leveraged',           currency: 'USD', model: 'TIERED_CONV',  status: 'Active',   fixed_fee: 0,    per_unit_rate: 0,    min_fee: 0,    max_fee: 0,    tiers: [{limit:250,price:500},{limit:500,price:1000},{limit:750,price:1350},{limit:1000,price:1600},{limit:1500,price:2100},{limit:2000,price:2800}], addon1: 0, addon2: 0, twilio_sid: null, notes: 'Standard conv tiers' },
  { id: 14, name: 'Israel Canada',       currency: 'USD', model: 'PLAN_PLUS',    status: 'Active',   fixed_fee: 1000, per_unit_rate: 0,    min_fee: 0,    max_fee: 0,    tiers: [], addon1: 15,   addon2: 150,  twilio_sid: null, notes: '$1K base + $15/meeting + $150/sale' },
  { id: 15, name: 'United Support',      currency: 'USD', model: 'TIERED_CONV',  status: 'Churned',  fixed_fee: 0,    per_unit_rate: 0,    min_fee: 0,    max_fee: 0,    tiers: [{limit:250,price:500},{limit:500,price:1000},{limit:750,price:1350},{limit:1000,price:1600},{limit:1500,price:2100},{limit:2000,price:2800}], addon1: 0, addon2: 0, twilio_sid: null, notes: 'Standard conv tiers' },
  { id: 16, name: 'Honeybook',           currency: 'USD', model: 'TIERED_REL',   status: 'Active',   fixed_fee: 3000, per_unit_rate: 0,    min_fee: 0,    max_fee: 0,    tiers: [{limit:500,price:1000},{limit:1000,price:1800},{limit:2000,price:3200},{limit:3000,price:4200},{limit:4000,price:4800}], addon1: 0, addon2: 0, twilio_sid: null, notes: 'Rel tiers + $3K SDR' },
  { id: 17, name: 'Best Brilliance',     currency: 'USD', model: 'TIERED_REL',   status: 'Active',   fixed_fee: 0,    per_unit_rate: 0,    min_fee: 0,    max_fee: 0,    tiers: [{limit:500,price:1000},{limit:1000,price:1800},{limit:2000,price:3200},{limit:3000,price:4200},{limit:4000,price:4800}], addon1: 0, addon2: 0, twilio_sid: null, notes: 'Rel tiers' },
  { id: 18, name: 'Headphones',          currency: 'USD', model: 'TIERED_CONV',  status: 'Active',   fixed_fee: 0,    per_unit_rate: 0,    min_fee: 0,    max_fee: 0,    tiers: [{limit:250,price:500},{limit:500,price:1000},{limit:750,price:1350},{limit:1000,price:1600},{limit:1500,price:2100},{limit:2000,price:2800}], addon1: 0, addon2: 0, twilio_sid: null, notes: 'Standard conv tiers' },
  { id: 19, name: 'Sela',               currency: 'NIS', model: 'FIXED',        status: 'Pilot',    fixed_fee: 5000, per_unit_rate: 0,    min_fee: 0,    max_fee: 0,    tiers: [], addon1: 0,    addon2: 0,    twilio_sid: null, notes: '5000 NIS pilot' },
  { id: 20, name: 'Cleandot',           currency: 'USD', model: 'TIERED_CONV',  status: 'Active',   fixed_fee: 0,    per_unit_rate: 0,    min_fee: 0,    max_fee: 0,    tiers: [{limit:250,price:500},{limit:500,price:1000},{limit:750,price:1350},{limit:1000,price:1600},{limit:1500,price:2100},{limit:2000,price:2800}], addon1: 0, addon2: 0, twilio_sid: null, notes: 'Standard conv tiers' },
  { id: 21, name: 'Roxy-Moxy',          currency: 'USD', model: 'FIXED',        status: 'Pilot',    fixed_fee: 1500, per_unit_rate: 0,    min_fee: 0,    max_fee: 0,    tiers: [], addon1: 0,    addon2: 0,    twilio_sid: null, notes: '$1500/mo pilot' },
  { id: 22, name: 'eTeacher',           currency: 'USD', model: 'HYBRID',       status: 'Active',   fixed_fee: 0,    per_unit_rate: 0.15, min_fee: 1500, max_fee: 0,    tiers: [], addon1: 15,   addon2: 0,    twilio_sid: null, notes: '$0.15/rel + $15/sale, min $1500' },
  { id: 23, name: 'Particle',           currency: 'USD', model: 'TIERED_REL',   status: 'Active',   fixed_fee: 0,    per_unit_rate: 0,    min_fee: 0,    max_fee: 0,    tiers: [{limit:500,price:1000},{limit:1000,price:1800},{limit:2000,price:3200},{limit:3000,price:4200},{limit:4000,price:4800}], addon1: 0, addon2: 0, twilio_sid: null, notes: 'Rel tiers' },
  { id: 24, name: 'Sweetch',            currency: 'USD', model: 'FIXED',        status: 'Active',   fixed_fee: 500,  per_unit_rate: 0,    min_fee: 0,    max_fee: 0,    tiers: [], addon1: 0,    addon2: 0,    twilio_sid: null, notes: '$500/mo fixed + $0.008/SMS' },
  { id: 25, name: 'Hulken',             currency: 'USD', model: 'TIERED_CONV',  status: 'Active',   fixed_fee: 0,    per_unit_rate: 0,    min_fee: 0,    max_fee: 0,    tiers: [{limit:250,price:500},{limit:500,price:1000},{limit:750,price:1350},{limit:1000,price:1600},{limit:1500,price:2100},{limit:2000,price:2800}], addon1: 0, addon2: 0, twilio_sid: null, notes: 'Custom conv tiers' },
  { id: 26, name: 'Opt Health',         currency: 'USD', model: 'FIXED',        status: 'Pilot',    fixed_fee: 1000, per_unit_rate: 0,    min_fee: 0,    max_fee: 0,    tiers: [], addon1: 0,    addon2: 0,    twilio_sid: null, notes: 'Signed pilot' },
  // Pipeline
  { id: 27, name: 'Bina',              currency: 'USD', model: 'FIXED',        status: 'Pipeline', fixed_fee: 500,  per_unit_rate: 0,    min_fee: 0,    max_fee: 0,    tiers: [], addon1: 0,    addon2: 0,    twilio_sid: null, notes: null },
  { id: 28, name: 'Targeta',           currency: 'USD', model: 'FIXED',        status: 'Pipeline', fixed_fee: 1000, per_unit_rate: 0,    min_fee: 0,    max_fee: 0,    tiers: [], addon1: 0,    addon2: 0,    twilio_sid: null, notes: null },
  { id: 29, name: 'Generali Insurance',currency: 'USD', model: 'FIXED',        status: 'Pipeline', fixed_fee: 5000, per_unit_rate: 0,    min_fee: 0,    max_fee: 0,    tiers: [], addon1: 0,    addon2: 0,    twilio_sid: null, notes: null },
  { id: 30, name: 'Tailor Brands',     currency: 'USD', model: 'FIXED',        status: 'Pipeline', fixed_fee: 1000, per_unit_rate: 0,    min_fee: 0,    max_fee: 0,    tiers: [], addon1: 0,    addon2: 0,    twilio_sid: null, notes: 'Wix affiliate' },
]

const STANDARD_CONV_TIERS = [
  { limit: 250, price: 500 },
  { limit: 500, price: 1000 },
  { limit: 750, price: 1350 },
  { limit: 1000, price: 1600 },
  { limit: 1500, price: 2100 },
  { limit: 2000, price: 2800 },
]
void STANDARD_CONV_TIERS

export function seedIfEmpty() {
  const db = getDb()
  const count = (db.prepare('SELECT COUNT(*) as c FROM clients').get() as { c: number }).c
  if (count > 0) return

  const insertClient = db.prepare(`
    INSERT OR IGNORE INTO clients
      (id, name, currency, model, status, fixed_fee, per_unit_rate, min_fee, max_fee, tiers, addon1, addon2, twilio_sid, notes)
    VALUES
      (@id, @name, @currency, @model, @status, @fixed_fee, @per_unit_rate, @min_fee, @max_fee, @tiers, @addon1, @addon2, @twilio_sid, @notes)
  `)

  const tx = db.transaction(() => {
    for (const c of CLIENTS) {
      insertClient.run({ ...c, tiers: JSON.stringify(c.tiers) })
    }
  })
  tx()
  seedHistoricalRevenue()
}

// Revenue from Excel (native currency). NIS divided by 3 → USD.
// Months: 2025-05 … 2026-04 (12 months)
const MONTHS = ['2025-05','2025-06','2025-07','2025-08','2025-09','2025-10','2025-11','2025-12','2026-01','2026-02','2026-03','2026-04']

// [client_id, currency, ...12 monthly values]
const HISTORICAL: [number, 'USD'|'NIS', ...number[]][] = [
  [1,  'NIS', 13355, 21500, 24785, 15380, 16595, 24245, 40985, 18170, 10250, 25820, 26540, 19025],
  [2,  'NIS', 13000, 13000, 13000, 13000, 17000, 17000, 17000, 17000, 17000, 16000, 16000, 16000],
  [3,  'NIS',   500,   500,   500,   500,   500,   500,   500,   500,     0,     0,     0,     0],
  [4,  'USD',   500,   500,   500,   500,   500,   500,   500,   500,   630,   560,   585,     0],
  [5,  'USD',    48,    44,    30,    36,    34,    28,    16,    14,    94,    24,    40,    26],
  [6,  'USD',   500,   500,   500,   500,   500,   500,   500,   500,   500,   500,   500,   500],
  [7,  'NIS',  4130,  2700,  5370,  6800,  4800,  1800,  1800,  1800,  1800,  1800,     0,     0],
  [8,  'USD', 559.2,   906, 908.4, 586.8,   630,1039.2,1768.8,  1680, 916.8, 668.4,   756,   500],
  [9,  'USD',     0,     0,     0,   500,   500,   500,   500,   500,   500,   500,   500,   500],
  [10, 'USD',     0,     0,     0,     0,   500,   500,   500,   500,   500,   500,   500,   500],
  [11, 'USD',     0,     0,     0,     0,   500,   500,   500,   500,   500,   500,   500,     0],
  [12, 'USD',     0,     0,     0,     0,   150,   150,   150,   150,   150,   150,   150,   150],
  [13, 'USD',     0,     0,     0,     0,  1000,   500,   500,   500,  1600,  1600,  1350,   500],
  [14, 'USD',     0,     0,     0,     0,  1000,  1000,  1000,  1345,  1780,  1240,  1450,  1450],
  [15, 'USD',     0,     0,     0,     0,     0,   500,   500,   500,   500,     0,     0,     0],
  [16, 'USD',     0,     0,     0,     0,     0,     0,  1000,  1000,  4000,  4000,  4000,  4000],
  [17, 'USD',     0,     0,     0,     0,     0,     0,  1000,  1000,  1000,  1000,  1000,  1000],
  [18, 'USD',     0,     0,     0,     0,     0,     0,   500,   500,   500,   500,   500,   500],
  [19, 'NIS',     0,     0,     0,     0,     0,     0,     0,  5000,  5000,  5000,  5000,  5000],
  [20, 'USD',     0,     0,     0,     0,     0,     0,     0,     0,   500,   500,   500,   500],
  [21, 'USD',     0,     0,     0,     0,     0,     0,     0,     0,     0,     0,  1500,  1500],
  [22, 'USD',     0,     0,     0,     0,     0,     0,     0,     0,     0,  1500,  1500,  1500],
  [23, 'USD',     0,     0,     0,     0,     0,     0,     0,     0,     0,  1000,  1800,  1000],
  [24, 'USD',     0,     0,     0,     0,     0,     0,     0,     0,   500,   500,   500,   500],
  [25, 'USD',     0,     0,     0,     0,     0,     0,     0,     0,     0,     0,   500,   500],
]

const EXCHANGE_RATE = 3

function seedHistoricalRevenue() {
  const db = getDb()
  const existing = (db.prepare('SELECT COUNT(*) as c FROM monthly_revenue').get() as { c: number }).c
  if (existing > 0) return

  const insert = db.prepare(`
    INSERT OR IGNORE INTO monthly_revenue (client_id, month, calculated_usd, revenue_status)
    VALUES (@client_id, @month, @calculated_usd, @revenue_status)
  `)

  const tx = db.transaction(() => {
    for (const [clientId, currency, ...values] of HISTORICAL) {
      MONTHS.forEach((month, i) => {
        const native = values[i] ?? 0
        if (native === 0) return
        const usd = currency === 'NIS' ? native / EXCHANGE_RATE : native
        // Past months = invoiced, future months = committed
        const status = month < '2026-04' ? 'invoiced' : 'committed'
        insert.run({ client_id: clientId, month, calculated_usd: usd, revenue_status: status })
      })
    }
  })
  tx()
}
