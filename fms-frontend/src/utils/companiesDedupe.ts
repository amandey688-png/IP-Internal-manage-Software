import type { Company } from '../api/support'

/**
 * Normalize company names so obvious duplicates (punctuation / Pvt vs Private Limited / M/s. etc.)
 * group together. The DB often has multiple `companies` rows for the same legal entity.
 */
export function normalizeCompanyDedupeKey(name: string): string {
  let s = name.trim().toLowerCase()
  s = s.replace(/^m\/s\.?\s*/i, '')
  s = s.replace(/-/g, ' ')
  s = s.replace(/\./g, ' ')
  s = s.replace(/,/g, ' ')
  s = s.replace(/\s*&\s*/g, ' and ')
  s = s.replace(/\([^)]*unit[^)]*2[^)]*\)/gi, ' unit2 ')
  s = s.replace(/\bprivate limited\b/gi, ' pvtltd ')
  s = s.replace(/\bpvt\s+ltd\b/gi, ' pvtltd ')
  s = s.replace(/\bpublic limited\b/gi, ' publtd ')
  s = s.replace(/\s+/g, ' ')
  return s.trim()
}

function pickCanonicalRow(group: Company[]): Company {
  if (group.length === 1) return group[0]
  return [...group].sort((a, b) => {
    const la = a.name.trim().length
    const lb = b.name.trim().length
    if (la !== lb) return la - lb
    const n = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    if (n !== 0) return n
    return a.id.localeCompare(b.id)
  })[0]
}

/**
 * One row per normalized name (shortest display name wins as label / canonical id).
 * Use for support-ticket company pickers only — tickets may still reference other duplicate ids.
 */
export function dedupeCompaniesForSelect(companies: Company[]): Company[] {
  const map = new Map<string, Company[]>()
  for (const c of companies) {
    if (!c?.id || !c?.name?.trim()) continue
    const key = normalizeCompanyDedupeKey(c.name)
    if (!key) continue
    const arr = map.get(key)
    if (arr) arr.push(c)
    else map.set(key, [c])
  }
  const out: Company[] = []
  for (const group of map.values()) {
    out.push(pickCanonicalRow(group))
  }
  return out.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
}
