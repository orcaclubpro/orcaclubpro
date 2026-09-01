// Timeframe selection shared by the home dashboard and RevenueChart. Lived in
// PortfolioTimeline until that component was retired in favour of <Spine>;
// the range itself outlived it because the charts still window by it.

export type Range = 'week' | 'month' | 'year'

export const RANGE_CFG = {
  week:  { back: 3,  forward: 11,  pxPerDay: 58, label: 'Week'  },
  month: { back: 10, forward: 50,  pxPerDay: 14, label: 'Month' },
  year:  { back: 90, forward: 275, pxPerDay: 3,  label: 'Year'  },
} as const satisfies Record<Range, { back: number; forward: number; pxPerDay: number; label: string }>
