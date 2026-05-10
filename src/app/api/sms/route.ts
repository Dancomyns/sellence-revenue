import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month')

  let query = supabase.from('sms_entries').select('*, clients(name)').order('client_id')
  if (month) query = query.eq('month', month)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (data ?? []).map((r: Record<string, unknown> & { clients?: { name: string } | null }) => ({
    ...r,
    client_name: r.clients?.name ?? '',
    clients: undefined,
  }))
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  const { data: settingsRows } = await supabase.from('settings').select('*')
  const rate = parseFloat(settingsRows?.find((r: {key:string}) => r.key === 'twilio_cost_per_sms')?.value ?? '0.007')
  const twilio_cost = body.sms_count * rate

  const { error } = await supabase.from('sms_entries').upsert(
    { client_id: body.client_id, month: body.month, sms_count: body.sms_count, twilio_cost },
    { onConflict: 'client_id,month', ignoreDuplicates: false }
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
