// Базовая стоимость в сутки на одного человека (рубли).
// Транспорт = одна поездка туда (умножается ×2 для туда+обратно), остальное считается ×days.
interface DailyCosts {
  transport: number
  hotel: number
  food: number
  museums: number
}

const CITY_COSTS: Record<string, DailyCosts> = {
  'Санкт-Петербург': { transport: 600, hotel: 3200, food: 800,  museums: 500 },
  'Казань':          { transport: 400, hotel: 2500, food: 700,  museums: 300 },
  'Сочи':            { transport: 500, hotel: 3500, food: 900,  museums: 200 },
  'Калининград':     { transport: 500, hotel: 2800, food: 750,  museums: 400 },
  'Владивосток':     { transport: 800, hotel: 3000, food: 1000, museums: 300 },
  'Екатеринбург':    { transport: 400, hotel: 2200, food: 650,  museums: 250 },
  'Новосибирск':     { transport: 400, hotel: 2000, food: 600,  museums: 200 },
  'Нижний Новгород': { transport: 350, hotel: 2200, food: 650,  museums: 300 },
}

const DEFAULT_COSTS: DailyCosts = {
  transport: 500,
  hotel: 2500,
  food: 700,
  museums: 300,
}

export interface BudgetBreakdown {
  transport: number
  hotel: number
  food: number
  museums: number
}

export interface BudgetRecommendation {
  min: number
  recommended: number
  max: number
  breakdown: BudgetBreakdown
  isDefault: boolean
}

function roundTo1k(n: number): number {
  return Math.round(n / 1000) * 1000
}

export function getBudgetRecommendation(
  toCity: string | undefined,
  days: number
): BudgetRecommendation | null {
  if (!toCity || !days || days < 1) return null

  const costs = CITY_COSTS[toCity] ?? DEFAULT_COSTS
  const isDefault = !CITY_COSTS[toCity]

  // Транспорт фиксирован (туда+обратно) — не масштабируется по дням.
  const transport = costs.transport * 2
  const hotel = costs.hotel * Math.max(days - 1, 1) // ночей = дней - 1, минимум 1
  const food = costs.food * days
  const museums = costs.museums * days

  const total = transport + hotel + food + museums

  return {
    min: roundTo1k(total * 0.8),
    recommended: roundTo1k(total),
    max: roundTo1k(total * 1.3),
    breakdown: {
      transport,
      hotel,
      food,
      museums,
    },
    isDefault,
  }
}

// Метки на слайдере и их пороги. Используется и для выбора цвета подсказки,
// и для маппинга старых строковых budget из URL.
export const BUDGET_LABELS: { value: number; label: string }[] = [
  { value: 3000,   label: 'Эконом' },
  { value: 15000,  label: 'Средний' },
  { value: 50000,  label: 'Комфорт' },
  { value: 100000, label: 'Бизнес' },
  { value: 200000, label: 'Свободно' },
]

export const BUDGET_MIN = 3000
export const BUDGET_MAX = 200000
export const BUDGET_STEP = 1000
export const BUDGET_DEFAULT = 15000

// Обратная совместимость со старыми URL: budget=economy/medium/free.
const LEGACY_BUDGET_MAP: Record<string, number> = {
  econom: 8000,
  economy: 8000,
  medium: 20000,
  free: 80000,
}

export function parseBudget(raw: string | null | undefined): number {
  if (!raw) return BUDGET_DEFAULT
  const legacy = LEGACY_BUDGET_MAP[raw.toLowerCase()]
  if (legacy) return legacy
  const n = parseInt(raw, 10)
  if (Number.isFinite(n) && n > 0) {
    // clamp
    return Math.min(Math.max(n, BUDGET_MIN), BUDGET_MAX)
  }
  return BUDGET_DEFAULT
}

export function nearestLabel(value: number): string {
  let best = BUDGET_LABELS[0]
  for (const l of BUDGET_LABELS) {
    if (Math.abs(value - l.value) < Math.abs(value - best.value)) best = l
  }
  return best.label
}
