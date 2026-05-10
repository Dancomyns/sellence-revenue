import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month')

  let query = supabase.from('monthly_revenue').select('*').order('client_id')
  if (month) query = query.eq('month', month)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { error } = await supabase.from('monthly_revenue').upsert(
    {
      calculated_usd: 0,
      manual_usd: null,
      invoice_ref: null,
      notes: null,
      ...body,
    },
    { onConflict: 'client_id,month', ignoreDuplicates: false }
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
