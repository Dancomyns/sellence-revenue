'use client'

import { useEffect, useState, useCallback } from 'react'
import { format, subMonths, addMonths, startOfMonth } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Client, UsageEntry } from '@/lib/types'

const METRIC_BY_MODEL: Record<string, string[]> = {
  FIXED: [],
  FIXED_ADDON: ['Addon (0/1)'],
  PER_UNIT: ['Policies'],
  PER_CONV: ['Conv'],
  TIERED_CONV: ['Conv'],
  TIERED_SALES: ['Sales'],
  TIERED_REL: ['Rels', 'SDR Active'],
  PLAN_PLUS: ['Active', 'Meetings', 'Sales'],
  HYBRID: ['Rels', 'Sales'],
}

function monthKey(d: Date) { return format(d, 'yyyy-MM') }

export default function UsagePage() {
  const [month, setMonth] = useState<Date>(startOfMonth(new Date()))
  const [clients, setClients] = useState<Client[]>([])
  const [usage, setUsage] = useState<UsageEntry[]>([])
  const [saving, setSaving] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    const [c, u] = await Promise.all([
      fetch('/api/clients').then(r => r.json()),
      fetch(`/api/usage?month=${monthKey(month)}`).then(r => r.json()),
    ])
    setClients(c)
    setUsage(u)
  }, [month])

  useEffect(() => { fetchData() }, [fetchData])

  function getValue(clientId: number, metric: string) {
    return usage.find(u => u.client_id === clientId && u.metric === metric)?.value ?? ''
  }

  async function saveUsage(clientId: number, metric: string, value: string) {
    const key = `${clientId}:${metric}`
    setSaving(key)
    await fetch('/api/usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        month: monthKey(month),
        metric,
        value: parseFloat(value) || 0,
        notes: null,
      }),
    })
    await fetchData()
    setSaving(null)
  }

  const activeClients = clients.filter(c => !['Churned', 'Pipeline', 'Paused'].includes(c.status))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Usage Entry</h1>
          <p className="text-sm text-gray-500">Enter monthly usage to auto-calculate revenue</p>
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

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Client</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Model</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Metrics</th>
            </tr>
          </thead>
          <tbody>
            {activeClients.map(client => {
              const metrics = METRIC_BY_MODEL[client.model] ?? []
              return (
                <tr key={client.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium text-gray-900 align-top">{client.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs align-top">{client.model}</td>
                  <td className="px-4 py-3">
                    {metrics.length === 0 ? (
                      <span className="text-gray-400 text-xs">No usage input needed</span>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        {metrics.map(metric => {
                          const key = `${client.id}:${metric}`
                          return (
                            <div key={metric} className="flex items-center gap-2">
                              <label className="text-xs text-gray-500 w-24 shrink-0">{metric}</label>
                              <input
                                className={`w-24 border rounded px-2 py-1 text-sm text-right transition-colors ${
                                  saving === key ? 'border-blue-300 bg-blue-50' : ''
                                }`}
                                defaultValue={getValue(client.id, metric)}
                                key={`${monthKey(month)}-${client.id}-${metric}`}
                                onBlur={e => {
                                  const v = e.target.value
                                  if (v !== String(getValue(client.id, metric))) {
                                    saveUsage(client.id, metric, v)
                                  }
                                }}
                              />
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-3">Tab between fields. Revenue auto-calculates on save.</p>
    </div>
  )
}
