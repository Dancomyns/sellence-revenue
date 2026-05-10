'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Client, Tier, PricingModel, ClientStatus, Currency } from '@/lib/types'

const MODELS: PricingModel[] = ['FIXED', 'FIXED_ADDON', 'PER_UNIT', 'PER_CONV', 'TIERED_CONV', 'TIERED_SALES', 'TIERED_REL', 'PLAN_PLUS', 'HYBRID']
const STATUSES: ClientStatus[] = ['Active', 'Pilot', 'Pipeline', 'Paused', 'Reduced', 'Churned']
const CURRENCIES: Currency[] = ['USD', 'NIS']

const EMPTY: Omit<Client, 'id' | 'created_at'> = {
  name: '',
  currency: 'USD',
  model: 'FIXED',
  status: 'Active',
  start_date: null,
  fixed_fee: 0,
  per_unit_rate: 0,
  min_fee: 0,
  max_fee: 0,
  tiers: [],
  addon1: 0,
  addon2: 0,
  twilio_sid: null,
  notes: null,
}

const MODEL_HINTS: Record<PricingModel, string> = {
  FIXED: 'Fixed fee/mo — only "Fixed Fee" matters',
  FIXED_ADDON: 'Fixed base + Addon1/Addon2 toggled on usage. Usage metric: "Addon (0/1)"',
  PER_UNIT: 'Per unit × rate, optional min/max cap. Usage metric: "Policies" or "Conv"',
  PER_CONV: 'Per conversation × rate, with minimum floor. Usage metric: "Conv"',
  TIERED_CONV: 'Step tiers by conversation count. Usage metric: "Conv"',
  TIERED_SALES: 'Fixed base + tiered by sales count. Usage metric: "Sales"',
  TIERED_REL: 'Tiered by relationship count + optional fixed SDR fee. Usage metric: "Rels"',
  PLAN_PLUS: 'Base plan + Addon1×meetings + Addon2×sales. Usage metrics: "Active", "Meetings", "Sales"',
  HYBRID: 'Per-unit rate × rels + Addon1 × sales, min floor. Usage metrics: "Rels", "Sales"',
}

interface Props {
  open: boolean
  client: Client | null
  onClose: () => void
  onSave: () => void
}

export default function ClientModal({ open, client, onClose, onSave }: Props) {
  const [form, setForm] = useState<Omit<Client, 'id' | 'created_at'>>(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (client) {
      const { id: _id, created_at: _ca, ...rest } = client
      void _id; void _ca
      setForm(rest)
    } else {
      setForm(EMPTY)
    }
  }, [client, open])

  function set<K extends keyof typeof form>(key: K, val: typeof form[K]) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function setTier(i: number, field: 'limit' | 'price', val: number) {
    setForm(f => {
      const tiers = [...f.tiers]
      tiers[i] = { ...tiers[i], [field]: val }
      return { ...f, tiers }
    })
  }

  function addTier() {
    setForm(f => ({ ...f, tiers: [...f.tiers, { limit: 0, price: 0 }] }))
  }

  function removeTier(i: number) {
    setForm(f => ({ ...f, tiers: f.tiers.filter((_, idx) => idx !== i) }))
  }

  function addStandardConvTiers() {
    setForm(f => ({
      ...f,
      tiers: [
        { limit: 250, price: 500 },
        { limit: 500, price: 1000 },
        { limit: 750, price: 1350 },
        { limit: 1000, price: 1600 },
        { limit: 1500, price: 2100 },
        { limit: 2000, price: 2800 },
      ] as Tier[]
    }))
  }

  function addStandardRelTiers() {
    setForm(f => ({
      ...f,
      tiers: [
        { limit: 500, price: 1000 },
        { limit: 1000, price: 1800 },
        { limit: 2000, price: 3200 },
        { limit: 3000, price: 4200 },
        { limit: 4000, price: 4800 },
      ] as Tier[]
    }))
  }

  async function save() {
    setSaving(true)
    const url = client ? `/api/clients/${client.id}` : '/api/clients'
    const method = client ? 'PUT' : 'POST'
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    onSave()
    onClose()
  }

  const showTiers = ['TIERED_CONV', 'TIERED_SALES', 'TIERED_REL'].includes(form.model)

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{client ? `Edit ${client.name}` : 'Add New Client'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Client Name</Label>
              <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Acme Corp" />
            </div>
            <div>
              <Label>Currency</Label>
              <Select value={form.currency} onValueChange={v => set('currency', v as Currency)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v as ClientStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={form.start_date ?? ''} onChange={e => set('start_date', e.target.value || null)} />
            </div>
          </div>

          {/* Pricing model */}
          <div>
            <Label>Pricing Model</Label>
            <Select value={form.model} onValueChange={v => set('model', v as PricingModel)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{MODELS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">{MODEL_HINTS[form.model]}</p>
          </div>

          {/* Pricing fields */}
          <div className="grid grid-cols-3 gap-3">
            {['FIXED', 'FIXED_ADDON', 'TIERED_SALES', 'TIERED_REL', 'PLAN_PLUS'].includes(form.model) && (
              <div>
                <Label>{form.model === 'TIERED_REL' ? 'Fixed SDR Fee' : 'Fixed Fee / Base'}</Label>
                <Input type="number" value={form.fixed_fee} onChange={e => set('fixed_fee', parseFloat(e.target.value) || 0)} />
              </div>
            )}
            {['PER_UNIT', 'PER_CONV', 'HYBRID'].includes(form.model) && (
              <div>
                <Label>Per Unit Rate</Label>
                <Input type="number" step="0.01" value={form.per_unit_rate} onChange={e => set('per_unit_rate', parseFloat(e.target.value) || 0)} />
              </div>
            )}
            {['PER_UNIT', 'PER_CONV', 'HYBRID'].includes(form.model) && (
              <div>
                <Label>Minimum Fee</Label>
                <Input type="number" value={form.min_fee} onChange={e => set('min_fee', parseFloat(e.target.value) || 0)} />
              </div>
            )}
            {['PER_UNIT'].includes(form.model) && (
              <div>
                <Label>Maximum Fee (0 = no cap)</Label>
                <Input type="number" value={form.max_fee} onChange={e => set('max_fee', parseFloat(e.target.value) || 0)} />
              </div>
            )}
            {['FIXED_ADDON', 'PLAN_PLUS', 'HYBRID'].includes(form.model) && (
              <div>
                <Label>{form.model === 'PLAN_PLUS' ? 'Per Meeting Rate' : form.model === 'HYBRID' ? 'Per Sale Rate' : 'Addon 1 Amount'}</Label>
                <Input type="number" step="0.01" value={form.addon1} onChange={e => set('addon1', parseFloat(e.target.value) || 0)} />
              </div>
            )}
            {['FIXED_ADDON', 'PLAN_PLUS'].includes(form.model) && (
              <div>
                <Label>{form.model === 'PLAN_PLUS' ? 'Per Sale Rate' : 'Addon 2 Amount'}</Label>
                <Input type="number" step="0.01" value={form.addon2} onChange={e => set('addon2', parseFloat(e.target.value) || 0)} />
              </div>
            )}
          </div>

          {/* Tiers */}
          {showTiers && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Tiers (up to N → price)</Label>
                <div className="flex gap-2">
                  {['TIERED_CONV', 'TIERED_SALES'].includes(form.model) && (
                    <Button type="button" variant="outline" size="sm" onClick={addStandardConvTiers}>
                      Use standard conv tiers
                    </Button>
                  )}
                  {form.model === 'TIERED_REL' && (
                    <Button type="button" variant="outline" size="sm" onClick={addStandardRelTiers}>
                      Use standard rel tiers
                    </Button>
                  )}
                  <Button type="button" variant="outline" size="sm" onClick={addTier}>+ Tier</Button>
                </div>
              </div>
              <div className="space-y-2">
                {form.tiers.map((tier, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <span className="text-xs text-gray-400 w-16 shrink-0">Up to</span>
                    <Input
                      type="number"
                      placeholder="limit"
                      value={tier.limit}
                      onChange={e => setTier(i, 'limit', parseFloat(e.target.value) || 0)}
                    />
                    <span className="text-xs text-gray-400 shrink-0">→</span>
                    <Input
                      type="number"
                      placeholder="price"
                      value={tier.price}
                      onChange={e => setTier(i, 'price', parseFloat(e.target.value) || 0)}
                    />
                    <button onClick={() => removeTier(i)} className="text-gray-400 hover:text-red-500 shrink-0 text-sm">✕</button>
                  </div>
                ))}
                {form.tiers.length === 0 && (
                  <p className="text-xs text-gray-400">No tiers yet — click "+ Tier" or use a preset above</p>
                )}
              </div>
            </div>
          )}

          {/* Twilio */}
          <div>
            <Label>Twilio Subaccount SID (optional)</Label>
            <Input
              value={form.twilio_sid ?? ''}
              onChange={e => set('twilio_sid', e.target.value || null)}
              placeholder="ACxxxxxxxx…"
              className="font-mono text-xs"
            />
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes ?? ''} onChange={e => set('notes', e.target.value || null)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving || !form.name}>
            {saving ? 'Saving…' : client ? 'Save Changes' : 'Add Client'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}