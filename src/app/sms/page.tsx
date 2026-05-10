'use client'

import { useEffect, useState, useCallback } from 'react'
import { format, subMonths, addMonths, startOfMonth } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SmsRow {
  id: number
  client_id: number
  client_name: string
  month: string
  sms_count: number
  twilio_cost: number | null
}

interface Settings {
  twilio_cost_per_sms: number
  sms_bill_rate: number
  exchange_rate: number
}

function monthKey(d: Date) { return format(d, 'yyyy-MM') }
function fmt2(n: number) { return '$' + n.toFixed(2) }

export default function SmsPage() {
  const [month, setMonth] = useState<Date>(startOfMonth(new Date()))
  const [rows, setRows] = useState<SmsRow[]>([])
  const [settings, setSettings] = useState<Settings>({ twilio_cost_per_sms: 0.007, sms_bill_rate: 0.008, exchange_rate: 3.6 })
  const [saving, setSaving] = useState<number | null>(null)

  const fetchData = useCallback(async () => {
    const [s, r] = await Promise.all([
      fetch('/api/settings').then(r => r.json()),
      fetch(`/api/sms?month=${monthKey(month)}`).then(r => r.json()),
    ])
    setSettings(s)
    setRows(r)
  }, [month])

  useEffect(() => { fetchData() }, [fetchData])

  async function saveSms(clientId: number, smsCount: number) {
    setSaving(clientId)
    await fetch('/api/sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, month: monthKey(month), sms_count: smsCount }),
    })
    await fetchData()
    setSaving(null)
  }

  function getSmsCount(clientId: number) {
    return rows.find(r => r.client_id === clientId)?.sms_count ?? 0
  }

  const totalSms = rows.reduce((s, r) => s + r.sms_count, 0)
  const totalCost = totalSms * settings.twilio_cost_per_sms
  const totalBill = totalSms * settings.sms_bill_rate
  const totalMargin = totalBill - totalCost

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">SMS Costs</h1>
          <p className="text-sm text-gray-500">Twilio cost: ${settings.twilio_cost_per_sms}/SMS · Bill rate: ${settings.sms_bill_rate}/SMS</p>
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

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total SMS', value: totalSms.toLocaleString(), color: 'text-gray-800' },
          { label: 'Twilio Cost', value: fmt2(totalCost), color: 'text-red-600' },
          { label: 'Billed to Clients', value: fmt2(totalBill), color: 'text-green-700' },
          { label: 'Margin', value: fmt2(totalMargin), color: 'text-blue-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border rounded-lg p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
            <p className={`text-xl font-semibold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Client</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">SMS Count</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Twilio Cost</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Billed</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Margin</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">No SMS data for this month</td></tr>
            ) : rows.map(row => {
              const cost = row.sms_count * settings.twilio_cost_per_sms
              const bill = row.sms_count * settings.sms_bill_rate
              const margin = bill - cost
              return (
                <tr key={row.client_id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.client_name}</td>
                  <td className="px-4 py-3 text-right">
                    <input
                      className={`w-28 text-right border rounded px-2 py-1 text-sm ${saving === row.client_id ? 'border-blue-300' : ''}`}
                      defaultValue={getSmsCount(row.client_id)}
                      key={`${monthKey(month)}-${row.client_id}`}
                      onBlur={e => saveSms(row.client_id, parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className="px-4 py-3 text-right text-red-600">{fmt2(cost)}</td>
                  <td className="px-4 py-3 text-right text-green-700">{fmt2(bill)}</td>
                  <td className="px-4 py-3 text-right text-blue-700">{fmt2(margin)}</td>
                </tr>
              )
            })}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50 border-t font-semibold">
                <td className="px-4 py-3 text-gray-700">Total</td>
                <td className="px-4 py-3 text-right">{totalSms.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-red-600">{fmt2(totalCost)}</td>
                <td className="px-4 py-3 text-right text-green-700">{fmt2(totalBill)}</td>
                <td className="px-4 py-3 text-right text-blue-700">{fmt2(totalMargin)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
