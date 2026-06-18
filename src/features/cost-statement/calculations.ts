import type { CostStatement } from '@/types'

export interface ECPVInputs {
  initialMP: number
  purchases: number
  finalMP: number

  laborCost: number
  cifCost: number

  initialWIP: number
  finalWIP: number

  initialPT: number
  finalPT: number

  revenue: number
}

/**
 * Pure ECPV canonical formulas. No side effects, no store access.
 * Use this for testing formulas in isolation and for display in the ECPV panel.
 */
export function calculateCostStatement(inputs: ECPVInputs): CostStatement {
  const availableMP = inputs.initialMP + inputs.purchases
  const materialUsed = availableMP - inputs.finalMP
  const productionCost = materialUsed + inputs.laborCost + inputs.cifCost
  const finishedGoodsCost = inputs.initialWIP + productionCost - inputs.finalWIP
  const availableForSale = finishedGoodsCost + inputs.initialPT
  const salesCost = availableForSale - inputs.finalPT
  const profit = inputs.revenue - salesCost

  return {
    initialMP: inputs.initialMP,
    purchases: inputs.purchases,
    availableMP,
    finalMP: inputs.finalMP,
    materialUsed,

    mod: inputs.laborCost,
    cif: inputs.cifCost,

    productionCost,

    initialWIP: inputs.initialWIP,
    finalWIP: inputs.finalWIP,

    finishedGoodsCost,

    initialPT: inputs.initialPT,
    availableForSale,
    finalPT: inputs.finalPT,

    salesCost,
    revenue: inputs.revenue,
    profit,
  }
}

export function isECPVBalanced(statement: CostStatement): boolean {
  const recomputed = statement.initialMP + statement.purchases - statement.finalMP
  return Math.abs(recomputed - statement.materialUsed) < 0.01
}
