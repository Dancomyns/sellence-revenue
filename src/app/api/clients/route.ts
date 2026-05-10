import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { calculateRevenue } from '@/lib/billing'
import type { Client, UsageEntry } from '@/lib/types'
import { format, startOfMonth } from 'date-fns'

export async function GET() {
  const { data, error } = await supabase.from('clients').select('*').order('id')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { data, error } = await supabase.from('clients').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const client = data as Client

  // Auto-generate revenue for models that don't need usage input (FIXED, FIXED_ADDON)
  if (['FIXED', 'FIXED_ADDON'].includes(client.model)) {
    const { data: settingsRows } = await supabase.from('settings').select('*')
    const exchangeRate = parseFloat(
      (settingsRows as {key:string,value:string}[])?.find(r => r.key === 'exchange_rate')?.value ?? '3.6'
    )
    const calc = calculateRevenue(client, [] as UsageEntry[], exchangeRate)
    const month = format(startOfMonth(new Date()), 'yyyy-MM')
    await supabase.from('monthly_revenue').upsert(
      { client_id: client.id, month, calculated_usd: calc, revenue_status: 'committed' },
      { onConflict: 'client_id,month', ignoreDuplicates: true }
    )
  }

  return NextResponse.json(client, { status: 201 })
}
