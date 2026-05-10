import type { Client, UsageEntry, Tier } from './types'

function applyTiers(amount: number, tiers: Tier[]): number {
  if (!tiers || tiers.length === 0) return 0
  const sorted = [...tiers].filter(t => t.limit > 0).sort((a, b) => a.limit - b.limit)
  for (const tier of sorted) {
    if (amount <= tier.limit) return tier.price
  }
  // above highest tier — use last tier price
  return sorted[sorted.length - 1]?.price ?? 0
}

function getUsage(entries: UsageEntry[], metric: string): number {
  const e = entries.find(u => u.metric.toLowerCase() === metric.toLowerCase())
  return e ? Number(e.value) : 0
}

function toUsd(amount: number, currency: string, exchangeRate: number): number {
  if (currency === 'NIS') return amount / exchangeRate
  return amount
}

export function calculateRevenue(
  client: Client,
  usageEntries: UsageEntry[],
  exchangeRate: number
): number {
  const { model, currency, fixed_fee, per_unit_rate, min_fee, max_fee, tiers, addon1, addon2 } = client

  let amount = 0

  switch (model) {
    case 'FIXED': {
      amount = fixed_fee
      break
    }

    case 'FIXED_ADDON': {
      // base + addons if active
      const addonActive = getUsage(usageEntries, 'Addon (0/1)')
      amount = fixed_fee + (addonActive ? addon1 : 0) + addon2
      break
    }

    case 'PER_UNIT': {
      const units = getUsage(usageEntries, 'Policies') ||
        getUsage(usageEntries, 'Units') ||
        getUsage(usageEntries, 'Conv')
      amount = units * per_unit_rate
      if (max_fee > 0) amount = Math.min(amount, max_fee)
      if (min_fee > 0) amount = Math.max(amount, min_fee)
      break
    }

    case 'PER_CONV': {
      const convs = getUsage(usageEntries, 'Conv')
      amount = Math.max(convs * per_unit_rate, min_fee)
      if (max_fee > 0) amount = Math.min(amount, max_fee)
      break
    }

    case 'TIERED_CONV': {
      const convs = getUsage(usageEntries, 'Conv')
      amount = applyTiers(convs, tiers)
      break
    }

    case 'TIERED_SALES': {
      const sales = getUsage(usageEntries, 'Sales')
      // Panda model: fixed base + tiered per sale
      const perSaleTier = applyTiers(sales, tiers)
      amount = fixed_fee + perSaleTier
      break
    }

    case 'TIERED_REL': {
      const rels = getUsage(usageEntries, 'Rels')
      const base = applyTiers(rels, tiers)
      // Honeybook has an SDR add-on on top
      const sdrActive = getUsage(usageEntries, 'SDR Active')
      amount = base + (sdrActive ? fixed_fee : 0)
      break
    }

    case 'PLAN_PLUS': {
      // base plan fee + per-meeting + per-sale addons
      const active = getUsage(usageEntries, 'Active')
      if (!active) { amount = 0; break }
      const meetings = getUsage(usageEntries, 'Meetings')
      const sales = getUsage(usageEntries, 'Sales')
      amount = fixed_fee + meetings * addon1 + sales * addon2
      break
    }

    case 'HYBRID': {
      // eTeacher: per_unit_rate/rel + addon1/sale, min = min_fee
      const rels = getUsage(usageEntries, 'Rels')
      const sales = getUsage(usageEntries, 'Sales')
      amount = Math.max(rels * per_unit_rate + sales * addon1, min_fee)
      break
    }

    default:
      amount = 0
  }

  return toUsd(amount, currency, exchangeRate)
}
