import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

async function getSettings() {
  const { data } = await supabase.from('settings').select('*')
  const rows = (data ?? []) as { key: string; value: string }[]
  return {
    exchange_rate: parseFloat(rows.find(r => r.key === 'exchange_rate')?.value ?? '3.6'),
    twilio_cost_per_sms: parseFloat(rows.find(r => r.key === 'twilio_cost_per_sms')?.value ?? '0.007'),
    sms_bill_rate: parseFloat(rows.find(r => r.key === 'sms_bill_rate')?.value ?? '0.008'),
  }
}

export async function GET() {
  return NextResponse.json(await getSettings())
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const upserts = Object.entries(body).map(([key, value]) => ({ key, value: String(value) }))
  await supabase.from('settings').upsert(upserts, { onConflict: 'key', ignoreDuplicates: false })
  return NextResponse.json(await getSettings())
}
