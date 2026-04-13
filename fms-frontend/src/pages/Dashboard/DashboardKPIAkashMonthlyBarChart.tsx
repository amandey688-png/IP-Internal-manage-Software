import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { AkashKpiPillar } from '../../api/dashboardKpi'

interface Props {
  pillars: AkashKpiPillar[]
  month: string
  year: string
}

/** Pillar % scores for Akash KPI Monthly modal (full calendar month). */
export default function DashboardKPIAkashMonthlyBarChart({ pillars, month, year }: Props) {
  const data = (pillars ?? []).map((p) => ({
    name: p.title,
    score: Math.min(100, Math.max(0, p.score_percent ?? 0)),
  }))

  return (
    <div style={{ width: '100%', minHeight: 320 }}>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 56 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-18} textAnchor="end" height={70} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
          <Tooltip
            formatter={(value: number) => [`${value}%`, 'Score']}
            labelFormatter={(label) => String(label)}
          />
          <Bar dataKey="score" name="Monthly %" fill="#0d9488" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <p style={{ marginTop: 8, fontSize: 12, color: '#64748b', textAlign: 'center' }}>
        Calendar month {month} {year} · same blend as headline (item, support, video, AI weights)
      </p>
    </div>
  )
}
