import { useEffect, useMemo, useState } from 'react'
import { Skeleton, Spin, Typography } from 'antd'
import { DashboardTable } from './dashboard/DashboardTable'
import { WeeklyCard } from './dashboard/WeeklyCard'
import type { MainDashboardRow, WeeklyRow } from './dashboard/types'
import './dashboard/su-dash.css'

const { Title } = Typography

interface DashboardData {
  week1: WeeklyRow[]
  week2: WeeklyRow[]
  week3: WeeklyRow[]
  week4: WeeklyRow[]
  summary: MainDashboardRow[]
}

const INITIAL_DATA: DashboardData = {
  week1: [],
  week2: [],
  week3: [],
  week4: [],
  summary: [],
}

export function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData>(INITIAL_DATA)

  useEffect(() => {
    // Simulate API call shape for future integration.
    const timer = setTimeout(() => {
      setData(INITIAL_DATA)
      setLoading(false)
    }, 650)
    return () => clearTimeout(timer)
  }, [])

  const weekCards = useMemo(
    () => [
      { title: 'WEEK - 1', rows: data.week1 },
      { title: 'WEEK - 2', rows: data.week2 },
      { title: 'WEEK - 3', rows: data.week3 },
      { title: 'WEEK - 4', rows: data.week4 },
    ],
    [data]
  )

  return (
    <div className="su-dash-page">
      <div className="su-dash-toolbar">
        <Title level={4} className="su-dash-title">
          Customer Success Dashboard
        </Title>
      </div>

      {loading ? (
        <div className="su-loading-wrap">
          <Spin size="large" />
          <Skeleton active paragraph={{ rows: 6 }} />
        </div>
      ) : (
        <>
          <div className="su-week-grid">
            {weekCards.map((card) => (
              <WeeklyCard key={card.title} title={card.title} rows={card.rows} />
            ))}
          </div>
          <DashboardTable rows={data.summary} />
        </>
      )}
    </div>
  )
}
