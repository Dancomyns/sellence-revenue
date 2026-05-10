import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { format, subMonths, addMonths, startOfMonth, eachMonthOfInterval } from 'date-fns'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lookback = parseInt(searchParams.get('lookback') ?? '12')
  const lookahead = parseInt(searchParams.get('lookahead') ?? '3')

  const now = startOfMonth(new Date())
  const allMonths = eachMonthOfInterval({
    start: subMonths(now, lookback),
    end: addMonths(now, lookahead),
  }).map(d => format(d, 'yyyy-MM'))

  const { data, error } = await supabase
    .from('monthly_revenue')
    .select('month, revenue_status, calculated_usd, manual_usd')
    .gte('month', allMonths[0])
    .lte('month', allMonths[allMonths.length - 1])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Aggregate in JS
  const map: Record<string, { invoiced: number; committed: number; pipeline: number }> = {}
  for (const m of allMonths) map[m] = { invoiced: 0, committed: 0, pipeline: 0 }

  for (const row of (data ?? [])) {
    const amount = (row.manual_usd ?? row.calculated_usd ?? 0) as number
    const s = row.revenue_status as 'invoiced' | 'committed' | 'pipeline'
    if (map[row.month] && (s === 'invoiced' || s === 'committed' || s === 'pipeline')) {
      map[row.month][s] += amount
    }
  }

  const result = allMonths.map(month => {
    const v = map[month]
    return {
      month,
      invoiced_arr: v.invoiced * 12,
      committed_arr: v.committed * 12,
      pipeline_arr: v.pipeline * 12,
      contracted_arr: (v.invoiced + v.committed) * 12,
      total_arr: (v.invoiced + v.committed + v.pipeline) * 12,
    }
  })

  return NextResponse.json(result)
}
