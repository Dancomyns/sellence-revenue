import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_DIR = path.join(process.cwd(), 'data')
const DB_PATH = path.join(DB_DIR, 'sellence.db')

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (_db) return _db
  fs.mkdirSync(DB_DIR, { recursive: true })
  _db = new Database(DB_PATH)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')
  migrate(_db)
  return _db
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      model TEXT NOT NULL DEFAULT 'FIXED',
      status TEXT NOT NULL DEFAULT 'Active',
      start_date TEXT,
      fixed_fee REAL NOT NULL DEFAULT 0,
      per_unit_rate REAL NOT NULL DEFAULT 0,
      min_fee REAL NOT NULL DEFAULT 0,
      max_fee REAL NOT NULL DEFAULT 0,
      tiers TEXT NOT NULL DEFAULT '[]',
      addon1 REAL NOT NULL DEFAULT 0,
      addon2 REAL NOT NULL DEFAULT 0,
      twilio_sid TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS usage_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      month TEXT NOT NULL,
      metric TEXT NOT NULL,
      value REAL NOT NULL DEFAULT 0,
      notes TEXT,
      UNIQUE(client_id, month, metric)
    );

    CREATE TABLE IF NOT EXISTS monthly_revenue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      month TEXT NOT NULL,
      calculated_usd REAL NOT NULL DEFAULT 0,
      manual_usd REAL,
      revenue_status TEXT NOT NULL DEFAULT 'committed',
      invoice_ref TEXT,
      notes TEXT,
      UNIQUE(client_id, month)
    );

    CREATE TABLE IF NOT EXISTS sms_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      month TEXT NOT NULL,
      sms_count REAL NOT NULL DEFAULT 0,
      twilio_cost REAL,
      UNIQUE(client_id, month)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)

  // Default settings
  const setSetting = db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`)
  setSetting.run('exchange_rate', '3.6')
  setSetting.run('twilio_cost_per_sms', '0.007')
  setSetting.run('sms_bill_rate', '0.008')
}

export function getSettings() {
  const db = getDb()
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[]
  return {
    exchange_rate: parseFloat(rows.find(r => r.key === 'exchange_rate')?.value ?? '3.6'),
    twilio_cost_per_sms: parseFloat(rows.find(r => r.key === 'twilio_cost_per_sms')?.value ?? '0.007'),
    sms_bill_rate: parseFloat(rows.find(r => r.key === 'sms_bill_rate')?.value ?? '0.008'),
  }
}
