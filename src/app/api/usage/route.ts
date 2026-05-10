import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { calculateRevenue } from '@/lib/billing'
import type { Client, UsageEntry } from '@/lib/types'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month')
  const clientId = searchParams.get('client_id')

  let query = supabase.from('usage_entries').select('*').order('metric')
  if (month) query = query.eq('month', month)
  if (clientId) query = query.eq('client_id', clientId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  const { error } = await supabase.from('usage_entries').upsert(
    { client_id: body.client_id, month: body.month, metric: body.metric, value: body.value, notes: body.notes },
    { onConflict: 'client_id,month,metric' }
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await recalculateRevenue(body.client_id, body.month)
  return NextResponse.json({ ok: true })
}

async function recalculateRevenue(clientId: number, month: string) {
  const { data: clientRow } = await supabase.from('clients').select('*').eq('id', clientId).single()
  if (!clientRow) return

  const { data: usageRows } = await supabase.from('usage_entries')
    .select('*').eq('client_id', clientId).eq('month', month)

  const { data: settingsRows } = await supabase.from('settings').select('*')
  const exchangeRate = parseFloat(settingsRows?.find((r: {key:string}) => r.key === 'exchange_rate')?.value ?? '3.6')

  const calc = calculateRevenue(clientRow as Client, (usageRows ?? []) as UsageEntry[], exchangeRate)

  await supabase.from('monthly_revenue').upsert(
    { client_id: clientId, month, calculated_usd: calc, revenue_status: 'committed' },
    { onConflict: 'client_id,month', ignoreDuplicates: false }
  )
}
