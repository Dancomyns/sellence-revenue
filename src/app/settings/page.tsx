'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Settings {
  exchange_rate: number
  twilio_cost_per_sms: number
  sms_bill_rate: number
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({ exchange_rate: 3.6, twilio_cost_per_sms: 0.007, sms_bill_rate: 0.008 })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(setSettings)
  }, [])

  async function save() {
    setSaving(true)
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">Global rates used in all calculations</p>
      </div>

      <div className="bg-white border rounded-lg p-6 max-w-md space-y-4">
        <div>
          <Label>NIS → USD Exchange Rate</Label>
          <Input
            type="number"
            step="0.01"
            value={settings.exchange_rate}
            onChange={e => setSettings(s => ({ ...s, exchange_rate: parseFloat(e.target.value) || 0 }))}
          />
          <p className="text-xs text-gray-400 mt-1">NIS revenue is divided by this rate to get USD</p>
        </div>
        <div>
          <Label>Twilio Cost per SMS ($)</Label>
          <Input
            type="number"
            step="0.001"
            value={settings.twilio_cost_per_sms}
            onChange={e => setSettings(s => ({ ...s, twilio_cost_per_sms: parseFloat(e.target.value) || 0 }))}
          />
          <p className="text-xs text-gray-400 mt-1">What Twilio charges you per SMS</p>
        </div>
        <div>
          <Label>SMS Bill Rate ($)</Label>
          <Input
            type="number"
            step="0.001"
            value={settings.sms_bill_rate}
            onChange={e => setSettings(s => ({ ...s, sms_bill_rate: parseFloat(e.target.value) || 0 }))}
          />
          <p className="text-xs text-gray-400 mt-1">What you charge clients per SMS</p>
        </div>
        <Button onClick={save} disabled={saving}>
          {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}
