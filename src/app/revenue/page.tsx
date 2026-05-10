'use client'

import { useEffect, useState } from 'react'
import { format, eachMonthOfInterval, subMonths, startOfMonth } from 'date-fns'
import type { Client, MonthlyRevenue } from '@/lib/types'

const STATUS_COLORS: Record<string, string> = {
  invoiced: 'text-green-700 bg-green-50',
  committed: 'text-blue-700 bg-blue-50',
  pipeline: 'text-amber-700 bg-amber-50',
}

function fmt(n: number) {
  if (n === 0) return '—'
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

export default function RevenuePage() {
  const [clients, setClients] = useState<Client[]>([])
  const [revenues, setRevenues] = useState<MonthlyRevenue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [c, r] = await Promise.all([
        fetch('/api/clients').then(r => r.json()),
        fetch('/api/revenue').then(r => r.json()),
      ])
      setClients(c)
      setRevenues(r)
      setLoading(false)
    }
    load()
  }, [])

  const months = eachMonthOfInterval({
    start: subMonths(startOfMonth(new Date()), 6),
    end: subMonths(startOfMonth(new Date()), -3),
  })

  function getRevenue(clientId: number, month: string) {
    return revenues.find(r => r.client_id === clientId && r.month === month)
  }

  const activeClients = clients.filter(c => c.status !== 'Churned')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Revenue Matrix</h1>
        <p className="text-sm text-gray-500">Last 6 months + next 3 months</p>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : (
        <div className="bg-white rounded-lg border overflow-auto">
          <table className="text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600 sticky left-0 bg-gray-50 z-10">Client</th>
                <th className="text-left px-3 py-3 font-medium text-gray-600 sticky left-32 bg-gray-50 z-10">Status</th>
                {months.map(m => (
                  <th key={format(m, 'yyyy-MM')} className="text-right px-3 py-3 font-medium text-gray-600 min-w-[90px]">
                    {format(m, 'MMM yy')}
                  </th>
                ))}
                <th className="text-right px-4 py-3 font-medium text-gray-600 min-w-[90px]">YTD</th>
              </tr>
            </thead>
            <tbody>
              {activeClients.map(client => {
                let ytd = 0
                return (
                  <tr key={client.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-gray-900 sticky left-0 bg-white z-10">{client.name}</td>
                    <td className="px-3 py-2.5 sticky left-32 bg-white z-10">
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-xs ${STATUS_COLORS[client.status] ?? 'text-gray-500'}`}>
                        {client.status}
                      </span>
                    </td>
                    {months.map(m => {
                      const key = format(m, 'yyyy-MM')
                      const rev = getRevenue(client.id, key)
                      const amount = rev?.manual_usd ?? rev?.calculated_usd ?? 0
                      if (amount > 0) ytd += amount
                      const statusClass = rev ? (STATUS_COLORS[rev.revenue_status] ?? '') : ''
                      return (
                        <td key={key} className={`px-3 py-2.5 text-right ${statusClass} rounded`}>
                          {amount > 0 ? fmt(amount) : '—'}
                        </td>
                      )
                    })}
                    <td className="px-4 py-2.5 text-right font-semibold text-gray-800">{ytd > 0 ? fmt(ytd) : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t font-semibold">
                <td className="px-4 py-3 text-gray-700 sticky left-0 bg-gray-50">Total</td>
                <td className="sticky left-32 bg-gray-50" />
                {months.map(m => {
                  const key = format(m, 'yyyy-MM')
                  const total = revenues
                    .filter(r => r.month === key)
                    .reduce((s, r) => s + (r.manual_usd ?? r.calculated_usd ?? 0), 0)
                  return (
                    <td key={key} className="px-3 py-3 text-right text-gray-900">{total > 0 ? fmt(total) : '—'}</td>
                  )
                })}
                <td className="px-4 py-3 text-right text-gray-900">
                  {fmt(revenues.reduce((s, r) => s + (r.manual_usd ?? r.calculated_usd ?? 0), 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
