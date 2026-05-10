'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ClientModal from '@/components/ClientModal'
import type { Client } from '@/lib/types'

const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-emerald-100 text-emerald-700',
  Pilot: 'bg-blue-100 text-blue-700',
  Pipeline: 'bg-amber-100 text-amber-700',
  Paused: 'bg-gray-100 text-gray-500',
  Churned: 'bg-red-100 text-red-600',
  Reduced: 'bg-orange-100 text-orange-700',
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)

  async function loadClients() {
    setLoading(true)
    const data = await fetch('/api/clients').then(r => r.json())
    setClients(data)
    setLoading(false)
  }

  useEffect(() => { loadClients() }, [])

  const active = clients.filter(c => ['Active', 'Pilot', 'Reduced'].includes(c.status))
  const pipeline = clients.filter(c => c.status === 'Pipeline')
  const inactive = clients.filter(c => ['Paused', 'Churned'].includes(c.status))

  function openAdd() { setEditing(null); setModalOpen(true) }
  function openEdit(c: Client) { setEditing(c); setModalOpen(true) }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500">{active.length} active · {pipeline.length} pipeline · {inactive.length} inactive</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-1" />Add Client</Button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : (
        <div className="space-y-6">
          <ClientSection title="Active & Pilots" clients={active} onEdit={openEdit} />
          <ClientSection title="Pipeline" clients={pipeline} onEdit={openEdit} />
          <ClientSection title="Inactive" clients={inactive} onEdit={openEdit} />
        </div>
      )}

      <ClientModal
        open={modalOpen}
        client={editing}
        onClose={() => setModalOpen(false)}
        onSave={loadClients}
      />
    </div>
  )
}

function ClientSection({ title, clients, onEdit }: { title: string; clients: Client[]; onEdit: (c: Client) => void }) {
  if (clients.length === 0) return null
  return (
    <div>
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{title}</h2>
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th className="px-4 py-2 font-medium text-gray-600">Client</th>
              <th className="px-4 py-2 font-medium text-gray-600">Status</th>
              <th className="px-4 py-2 font-medium text-gray-600">Model</th>
              <th className="px-4 py-2 font-medium text-gray-600">Currency</th>
              <th className="px-4 py-2 font-medium text-gray-600">Fixed / Base</th>
              <th className="px-4 py-2 font-medium text-gray-600">Tiers</th>
              <th className="px-4 py-2 font-medium text-gray-600">Start Date</th>
              <th className="px-4 py-2 font-medium text-gray-600">Notes</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {clients.map(c => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[c.status] ?? ''}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">{c.model}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{c.currency}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">
                  {c.fixed_fee > 0 ? c.fixed_fee.toLocaleString() : '—'}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {c.tiers.length > 0 ? `${c.tiers.length} tiers` : '—'}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{c.start_date ?? '—'}</td>
                <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate">{c.notes ?? ''}</td>
                <td className="px-4 py-3">
                  <button onClick={() => onEdit(c)} className="text-gray-400 hover:text-gray-700">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
