import { create } from 'zustand'
import type { FinancialState, GameLevel } from '@/types'
import { INITIAL_CASH_BY_LEVEL, CASH_CRITICAL_PCT } from '@/constants/gameBalance'

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
  cashBalance: number
  initialCash: number
  isBankrupt: boolean
  reputationPenaltyUntilTick: number

  accumulateMPD: (amount: number) => void
  accumulateMOD: (amount: number) => void
  accumulateCIF: (energy: number, maintenance: number, waste: number) => void
  recordSale: (quantity: number, unitPrice: number, unitCost: number) => void
  resetPeriod: () => void

  initCash: (level: GameLevel) => void
  debitCash: (amount: number) => void
  creditCash: (amount: number) => void
  isCashCritical: () => boolean
  setReputationPenalty: (untilTick: number) => void
  clearBankruptcy: () => void
}

export const useFinanceStore = create<FinanceStore>((set, get) => ({
  state: { ...INITIAL_STATE, cifBreakdown: { ...INITIAL_STATE.cifBreakdown } },
  cashBalance: INITIAL_CASH_BY_LEVEL[1],
  initialCash: INITIAL_CASH_BY_LEVEL[1],
  isBankrupt: false,
  reputationPenaltyUntilTick: 0,

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
      const { reputationPenaltyUntilTick } = s
      // Honour reputation penalty if active (checked externally by passing current tick)
      const revenue = s.state.revenue + quantity * unitPrice
      const salesCost = s.state.salesCost + quantity * unitCost
      const profit = revenue - salesCost
      void reputationPenaltyUntilTick // used externally; stored for UI
      return { state: { ...s.state, revenue, salesCost, profit } }
    }),

  resetPeriod: () =>
    set({
      state: {
        ...INITIAL_STATE,
        cifBreakdown: { ...INITIAL_STATE.cifBreakdown },
      },
    }),

  initCash: (level) =>
    set({
      cashBalance: INITIAL_CASH_BY_LEVEL[level],
      initialCash: INITIAL_CASH_BY_LEVEL[level],
      isBankrupt: false,
    }),

  debitCash: (amount) =>
    set((s) => {
      const cashBalance = Math.max(0, s.cashBalance - amount)
      const isBankrupt = cashBalance <= 0
      return { cashBalance, isBankrupt }
    }),

  creditCash: (amount) => set((s) => ({ cashBalance: s.cashBalance + amount, isBankrupt: false })),

  isCashCritical: () => {
    const { cashBalance, initialCash } = get()
    return cashBalance <= initialCash * CASH_CRITICAL_PCT
  },

  setReputationPenalty: (untilTick) => set({ reputationPenaltyUntilTick: untilTick }),

  clearBankruptcy: () => set({ isBankrupt: false }),
}))
