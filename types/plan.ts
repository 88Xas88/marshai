export type TransportType = 'plane' | 'train' | 'bus'
export type FlightBadge = 'best' | 'fastest' | 'cheapest'
export type POIType = 'museum' | 'restaurant' | 'walk' | 'other' | 'hotel'

export interface Flight {
  id: string
  type: TransportType
  badge?: FlightBadge
  carrier: string
  number?: string
  departTime: string
  arriveTime: string
  departCity: string
  arriveCity: string
  duration: string
  price: number
  url: string
}

export interface Hotel {
  id: string
  name: string
  stars: number
  rating: number
  reviews: number
  tags: string[]
  pricePerNight: number
  totalPrice: number
  thumbnail?: string
  url: string
  address?: string
  lat?: number
  lng?: number
}

export interface POI {
  time: string
  name: string
  type: POIType
  duration: string
  cost: string
  address: string
  description: string
  lat?: number
  lng?: number
}

export interface DayPlan {
  day: number
  title: string
  date: string
  pois: POI[]
}

export interface OptimalSelection {
  transport_there: { name: string; why: string; price: string }
  hotel: { name: string; why: string; price_per_night: string }
  transport_back: { name: string; why: string; price: string }
}

export interface Plan {
  id: string
  email?: string
  fromCity: string
  toCity: string
  dates: string
  days: number
  pax: number
  budget: BudgetType
  interests: InterestType
  flights: { there: Flight[]; back: Flight[] }
  hotels: Hotel[]
  itinerary: DayPlan[]
  optimal: OptimalSelection
  createdAt: string
  bookingStatus?: BookingStatus
  bookedItems?: BookedItems
}

// Бюджет на одного человека в рублях (3 000 – 200 000).
// Раньше был union 'econom'|'medium'|'free' — теперь числовое значение со слайдера.
// Старые URL вида ?budget=medium конвертируются в числа в lib/cityBudget.ts → parseBudget().
export type BudgetType = number
export type InterestType = 'museums' | 'food' | 'walks' | 'all'
export type BookingStatus = 'not_booked' | 'partial' | 'booked'
export interface BookedItems {
  transport_there?: boolean
  hotel?: boolean
  transport_back?: boolean
}

export interface SearchParams {
  from: string
  to: string
  dates: string
  days: number
  pax: number
  budget: BudgetType
  interests: InterestType
}

export interface EngageAnswers {
  priority?: string
  pace?: string
  dailyBudget?: string
}

export interface City {
  name: string
  code: string
  region?: string
}

export type StepStatus = 'pending' | 'active' | 'done' | 'error'

export interface GenerationStep {
  id: string
  label: string
  status: StepStatus
}
