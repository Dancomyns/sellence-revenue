'use client'

import { useEffect, useState, useCallback } from 'react'
import { format, subMonths, addMonths, startOfMonth, parse } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import type { Client, MonthlyRevenue } from '@/lib/types'

interface MonthlySummary {
  month: string
  invoiced_arr: number
  committed_arr: number
  pipeline_arr: number
  contracted_arr: number
  total_arr: number
}

const STATUS_COLORS: Record<string, string> = {
  invoiced: 'bg-green-100 text-green-800 border-green-200',
  committed: 'bg-blue-100 text-blue-800 border-blue-200',
  pipeline: 'bg-amber-100 text-amber-800 border-amber-200',
}

const CLIENT_STATUS_COLORS: Record<string, string> = {
  Active: 'bg-emerald-100 text-emerald-700',
  Pilot: 'bg-blue-100 text-blue-700',
  Pipeline: 'bg-amber-100 text-amber-700',
  Paused: 'bg-gray-100 text-gray-500',
  Churned: 'bg-red-100 text-red-600',
  Reduced: 'bg-orange-100 text-orange-700',
}

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function monthKey(d: Date) { return format(d, 'yyyy-MM') }

interface Row {
  client: Client
  revenue: MonthlyRevenue | null
  displayAmount: number
  status: 'invoiced' | 'committed' | 'pipeline' | null
}

const RANGE_OPTIONS = [
  { label: '6M', lookback: 6, lookahead: 0 },
  { label: '12M', lookback: 12, lookahead: 0 },
  { label: '12M + 3M forecast', lookback: 12, lookahead: 3 },
  { label: '24M', lookback: 24, lookahead: 3 },
]

export default function Dashboard() {
  const [month, setMonth] = useState<Date>(startOfMonth(new Date()))
  const [clients, setClients] = useState<Client[]>([])
  const [revenues, setRevenues] = useState<MonthlyRevenue[]>([])
  const [summary, setSummary] = useState<MonthlySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [chartRange, setChartRange] = useState(RANGE_OPTIONS[1])

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [c, r, s] = await Promise.all([
      fetch('/api/clients').then(r => r.json()),
      fetch(`/api/revenue?month=${monthKey(month)}`).then(r => r.json()),
      fetch(`/api/revenue/summary?lookback=${chartRange.lookback}&lookahead=${chartRange.lookahead}`).then(r => r.json()),
    ])
    setClients(c)
    setRevenues(r)
    setSummary(s)
    setLoading(false)
  }, [month, chartRange])

  useEffect(() => { fetchData() }, [fetchData])

  const rows: Row[] = clients
    .filter(c => c.status !== 'Churned')
    .map(c => {
      const rev = revenues.find(r => r.client_id === c.id) ?? null
      const displayAmount = rev?.manual_usd ?? rev?.calculated_usd ?? 0
      const status = rev?.revenue_status ?? (c.status === 'Pipeline' ? 'pipeline' : null)
      return { client: c, revenue: rev, displayAmount, status }
    })

  const invoicedTotal = rows.filter(r => r.status === 'invoiced').reduce((s, r) => s + r.displayAmount, 0)
  const committedTotal = rows.filter(r => r.status === 'committed').reduce((s, r) => s + r.displayAmount, 0)
  const pipelineTotal = rows.filter(r => r.status === 'pipeline').reduce((s, r) => s + r.displayAmount, 0)

  async function setStatus(clientId: number, status: 'invoiced' | 'committed' | 'pipeline') {
    const existing = revenues.find(r => r.client_id === clientId)
    await fetch('/api/revenue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        month: monthKey(month),
        calculated_usd: existing?.calculated_usd ?? 0,
        manual_usd: existing?.manual_usd ?? null,
        revenue_status: status,
        invoice_ref: existing?.invoice_ref ?? null,
        notes: existing?.notes ?? null,
      }),
    })
    fetchData()
  }

  async function setManualAmount(clientId: number, amount: number) {
    const existing = revenues.find(r => r.client_id === clientId)
    await fetch('/api/revenue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        month: monthKey(month),
        calculated_usd: existing?.calculated_usd ?? 0,
        manual_usd: amount || null,
        revenue_status: existing?.revenue_status ?? 'pipeline',
        invoice_ref: existing?.invoice_ref ?? null,
        notes: existing?.notes ?? null,
      }),
    })
    fetchData()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Monthly revenue overview</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setMonth(m => startOfMonth(subMonths(m, 1)))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium w-28 text-center">{format(month, 'MMMM yyyy')}</span>
          <Button variant="outline" size="sm" onClick={() => setMonth(m => startOfMonth(addMonths(m, 1)))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <SummaryCard label="Invoiced MRR" amount={invoicedTotal} color="text-green-700" bg="bg-green-50 border-green-200" />
        <SummaryCard label="Committed MRR" amount={committedTotal} color="text-blue-700" bg="bg-blue-50 border-blue-200" />
        <SummaryCard label="Pipeline MRR" amount={pipelineTotal} color="text-amber-700" bg="bg-amber-50 border-amber-200" />
        <SummaryCard label="Contracted ARR" amount={(invoicedTotal + committedTotal) * 12} color="text-gray-800" bg="bg-white border-gray-200" bold />
      </div>

      {/* ARR chart */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">ARR Trend</h2>
          <div className="flex gap-1">
            {RANGE_OPTIONS.map(opt => (
              <button
                key={opt.label}
                onClick={() => setChartRange(opt)}
                className={`px-2.5 py-1 text-xs rounded font-medium border transition-colors ${
                  chartRange.label === opt.label
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'text-gray-500 border-gray-200 hover:border-gray-400'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {summary.every(s => s.contracted_arr === 0) ? (
          <p className="text-sm text-gray-400 text-center py-8">No revenue data yet — enter usage to populate the chart</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={summary.map(s => ({
              ...s,
              label: format(parse(s.month, 'yyyy-MM', new Date()), 'MMM yy'),
            }))} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis
                tickFormatter={v => '$' + (v >= 1000 ? Math.round(v / 1000) + 'K' : v)}
                tick={{ fontSize: 11 }}
                width={55}
              />
              <Tooltip
                formatter={(value) => [
                  '$' + Number(value).toLocaleString('en-US', { maximumFractionDigits: 0 }),
                ]}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="contracted_arr"
                name="Contracted ARR"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="invoiced_arr"
                name="Invoiced ARR"
                stroke="#16a34a"
                strokeWidth={2}
                strokeDasharray="4 2"
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="pipeline_arr"
                name="Pipeline ARR"
                stroke="#d97706"
                strokeWidth={2}
                strokeDasharray="4 2"
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Client</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Amount (USD)</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Revenue Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Model</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400">Loading…</td></tr>
            ) : rows.map(({ client, revenue, displayAmount, status }) => (
              <tr key={client.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{client.name}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CLIENT_STATUS_COLORS[client.status] ?? ''}`}>
                    {client.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {client.status === 'Pipeline' ? (
                    <input
                      className="w-28 text-right border rounded px-2 py-1 text-sm"
                      defaultValue={displayAmount || ''}
                      placeholder="0"
                      onBlur={e => setManualAmount(client.id, parseFloat(e.target.value) || 0)}
                    />
                  ) : (
                    <span className="font-medium">{displayAmount > 0 ? fmt(displayAmount) : '—'}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {client.status !== 'Paused' && client.status !== 'Churned' && (
                    <div className="flex gap-1 justify-center">
                      {(['invoiced', 'committed', 'pipeline'] as const).map(s => (
                        <button
                          key={s}
                          onClick={() => setStatus(client.id, s)}
                          className={`px-2 py-0.5 rounded text-xs font-medium border transition-colors ${
                            status === s ? STATUS_COLORS[s] : 'border-gray-200 text-gray-400 hover:border-gray-300'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{client.model} · {client.currency}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 border-t font-semibold">
              <td colSpan={2} className="px-4 py-3 text-gray-700">Total</td>
              <td className="px-4 py-3 text-right">{fmt(invoicedTotal + committedTotal + pipelineTotal)}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex gap-4 mt-4 text-xs text-gray-500 items-center">
        <span className="flex items-center gap-1"><Badge className={STATUS_COLORS.invoiced + ' text-xs'}>invoiced</Badge> invoice sent</span>
        <span className="flex items-center gap-1"><Badge className={STATUS_COLORS.committed + ' text-xs'}>committed</Badge> signed, not invoiced yet</span>
        <span className="flex items-center gap-1"><Badge className={STATUS_COLORS.pipeline + ' text-xs'}>pipeline</Badge> not yet signed</span>
      </div>
    </div>
  )
}

function SummaryCard({ label, amount, color, bg, bold }: { label: string; amount: number; color: string; bg: string; bold?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${bg}`}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl ${bold ? 'font-bold' : 'font-semibold'} ${color}`}>{fmt(amount)}</p>
    </div>
  )
}
