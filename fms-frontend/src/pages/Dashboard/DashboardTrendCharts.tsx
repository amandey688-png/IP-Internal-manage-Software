import { Row, Col, Card, Typography } from 'antd'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { TrendPoint } from '../../api/dashboard'

const { Text } = Typography

export function DashboardTrendCharts({ trendPoints }: { trendPoints: TrendPoint[] }) {
  return (
    <Row gutter={[20, 20]}>
      <Col xs={24} lg={12}>
        <Card
          title={<span style={{ color: '#1e293b', fontWeight: 600, letterSpacing: 0.5 }}>Response Delay Trend</span>}
          style={{
            borderRadius: 8,
            border: '1px solid rgba(0, 0, 0, 0.06)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
            background: '#ffffff',
          }}
          bodyStyle={{ padding: '12px 16px 16px', minHeight: 280 }}
        >
          <Text style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 8 }}>
            Weekly trend (Chores & Bug) — tickets without assignee
          </Text>
          {trendPoints.length > 0 ? (
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendPoints} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis allowDecimals={false} width={36} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip
                    formatter={(v: number) => [v, 'Count']}
                    labelStyle={{ color: '#334155' }}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="response_delay"
                    name="Response delay"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#3b82f6' }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ padding: 32, textAlign: 'center', background: '#f8fafc', borderRadius: 8 }}>
              <Text type="secondary">No trend data yet (last 7 months).</Text>
            </div>
          )}
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card
          title={<span style={{ color: '#1e293b', fontWeight: 600, letterSpacing: 0.5 }}>Completion Delay Trend</span>}
          style={{
            borderRadius: 8,
            border: '1px solid rgba(0, 0, 0, 0.06)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
            background: '#ffffff',
          }}
          bodyStyle={{ padding: '12px 16px 16px', minHeight: 280 }}
        >
          <Text style={{ fontSize: 12, color: '#64748b', display: 'block', marginBottom: 8 }}>
            Weekly trend (Chores & Bug) — Stage 2 delay (TAT exceeded after Stage 2 completed)
          </Text>
          {trendPoints.length > 0 ? (
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendPoints} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis allowDecimals={false} width={36} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip
                    formatter={(v: number) => [v, 'Count']}
                    labelStyle={{ color: '#334155' }}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="completion_delay"
                    name="Completion delay"
                    stroke="#d97706"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#d97706' }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ padding: 32, textAlign: 'center', background: '#f8fafc', borderRadius: 8 }}>
              <Text type="secondary">No trend data yet (last 7 months).</Text>
            </div>
          )}
        </Card>
      </Col>
    </Row>
  )
}
