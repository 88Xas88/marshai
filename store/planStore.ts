'use client'

import { create } from 'zustand'
import type {
  Flight,
  Hotel,
  DayPlan,
  OptimalSelection,
  GenerationStep,
  EngageAnswers,
} from '@/types/plan'

interface PlanState {
  flightsThere: Flight[]
  flightsBack: Flight[]
  hotels: Hotel[]
  itinerary: DayPlan[]
  optimal: OptimalSelection | null
  steps: GenerationStep[]
  engageAnswers: EngageAnswers
  setFlights: (there: Flight[], back: Flight[]) => void
  setHotels: (hotels: Hotel[]) => void
  setItinerary: (days: DayPlan[]) => void
  setOptimal: (o: OptimalSelection) => void
  updateStep: (id: string, status: GenerationStep['status']) => void
  setEngageAnswer: (key: keyof EngageAnswers, value: string) => void
  reset: () => void
}

const INITIAL_STEPS: GenerationStep[] = [
  { id: 'received', label: 'Запрос принят', status: 'done' },
  { id: 'flights', label: 'Билеты найдены', status: 'pending' },
  { id: 'hotels', label: 'Подбираем жильё', status: 'pending' },
  { id: 'itinerary', label: 'Строим маршрут по дням', status: 'pending' },
  { id: 'map', label: 'Формируем карту', status: 'pending' },
  { id: 'final', label: 'Финальный план', status: 'pending' },
]

export const usePlanStore = create<PlanState>((set) => ({
  flightsThere: [],
  flightsBack: [],
  hotels: [],
  itinerary: [],
  optimal: null,
  steps: INITIAL_STEPS,
  engageAnswers: {},
  setFlights: (there, back) => set({ flightsThere: there, flightsBack: back }),
  setHotels: (hotels) => set({ hotels }),
  setItinerary: (itinerary) => set({ itinerary }),
  setOptimal: (optimal) => set({ optimal }),
  updateStep: (id, status) =>
    set((s) => ({
      steps: s.steps.map((step) => (step.id === id ? { ...step, status } : step)),
    })),
  setEngageAnswer: (key, value) =>
    set((s) => ({ engageAnswers: { ...s.engageAnswers, [key]: value } })),
  reset: () =>
    set({
      flightsThere: [],
      flightsBack: [],
      hotels: [],
      itinerary: [],
      optimal: null,
      steps: INITIAL_STEPS.map((s) => ({ ...s })),
      engageAnswers: {},
    }),
}))
