import { create } from 'zustand'
import type { FinancialState } from '@/types'

const INITIAL_STATE: FinancialState = {
  rawMaterialCost: 0,
  laborCost: 0,
  cifCost: 0,
  cifBreakdown: { energy: 0, maintenance: 0, waste: 0 },
  productionCost: 0,
  revenue: 0,
  salesCost: 0,
  profit: 0,
}

interface FinanceStore {
  state: FinancialState
  accumulateMPD: (amount: number) => void
  accumulateMOD: (amount: number) => void
  accumulateCIF: (energy: number, maintenance: number, waste: number) => void
  recordSale: (quantity: number, unitPrice: number, unitCost: number) => void
  resetPeriod: () => void
}

export const useFinanceStore = create<FinanceStore>((set) => ({
  state: { ...INITIAL_STATE, cifBreakdown: { ...INITIAL_STATE.cifBreakdown } },

  accumulateMPD: (amount) =>
    set((s) => {
      const rawMaterialCost = s.state.rawMaterialCost + amount
      const productionCost = rawMaterialCost + s.state.laborCost + s.state.cifCost
      return { state: { ...s.state, rawMaterialCost, productionCost } }
    }),

  accumulateMOD: (amount) =>
    set((s) => {
      const laborCost = s.state.laborCost + amount
      const productionCost = s.state.rawMaterialCost + laborCost + s.state.cifCost
      return { state: { ...s.state, laborCost, productionCost } }
    }),

  accumulateCIF: (energy, maintenance, waste) =>
    set((s) => {
      const addition = energy + maintenance + waste
      const cifCost = s.state.cifCost + addition
      const cifBreakdown = {
        energy: s.state.cifBreakdown.energy + energy,
        maintenance: s.state.cifBreakdown.maintenance + maintenance,
        waste: s.state.cifBreakdown.waste + waste,
      }
      const productionCost = s.state.rawMaterialCost + s.state.laborCost + cifCost
      return { state: { ...s.state, cifCost, cifBreakdown, productionCost } }
    }),

  recordSale: (quantity, unitPrice, unitCost) =>
    set((s) => {
      const revenue = s.state.revenue + quantity * unitPrice
      const salesCost = s.state.salesCost + quantity * unitCost
      const profit = revenue - salesCost
      return { state: { ...s.state, revenue, salesCost, profit } }
    }),

  resetPeriod: () =>
    set({
      state: {
        ...INITIAL_STATE,
        cifBreakdown: { ...INITIAL_STATE.cifBreakdown },
      },
    }),
}))
