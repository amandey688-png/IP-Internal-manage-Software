/** SUCC-0001 … numeric order for filters; highest / newest ref first. */
const SUCC_REF = /^SUCC-(\d+)$/i

export function comparePerformanceRefsDesc(a: string, b: string): number {
  const ta = (a || '').trim()
  const tb = (b || '').trim()
  const mA = SUCC_REF.exec(ta)
  const mB = SUCC_REF.exec(tb)
  if (mA && mB) return parseInt(mB[1], 10) - parseInt(mA[1], 10)
  if (mA) return -1
  if (mB) return 1
  return tb.localeCompare(ta, undefined, { numeric: true })
}

export function sortPerformanceRefOptions(refs: string[]): string[] {
  return [...refs].sort(comparePerformanceRefsDesc)
}
