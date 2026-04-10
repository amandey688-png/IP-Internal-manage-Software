import type { ReactNode } from 'react'
import { Card, Col, Row, Skeleton, Space } from 'antd'

/** Full-page shell while auth or route data loads */
export const PageSkeleton = () => (
  <div style={{ minHeight: '100vh', padding: 24, maxWidth: 1400, margin: '0 auto' }}>
    <Skeleton.Input active style={{ width: 200, height: 32, marginBottom: 24 }} />
    <Row gutter={[16, 16]}>
      {[0, 1, 2, 3].map((i) => (
        <Col xs={24} sm={12} lg={6} key={i}>
          <Card size="small">
            <Skeleton active paragraph={{ rows: 2 }} title={{ width: '60%' }} />
          </Card>
        </Col>
      ))}
    </Row>
    <Card size="small" style={{ marginTop: 24 }} styles={{ body: { padding: 16 } }}>
      <Skeleton active title={{ width: '28%' }} paragraph={{ rows: 12 }} />
    </Card>
  </div>
)

/** Modal / drawer body placeholder */
export const ModalContentSkeleton = ({ rows = 10 }: { rows?: number }) => (
  <div style={{ padding: '8px 0' }}>
    <Skeleton active title={{ width: '40%' }} paragraph={{ rows }} />
  </div>
)

/** Lead / detail-style first load */
export const DetailPageSkeleton = () => (
  <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Skeleton.Input active style={{ width: 280, height: 36 }} />
      <Card>
        <Skeleton active title paragraph={{ rows: 6 }} />
      </Card>
      <Card>
        <Skeleton active title paragraph={{ rows: 4 }} />
      </Card>
    </Space>
  </div>
)

/** KPI / dashboard block (tiles + optional table area) */
export const DashboardBlockSkeleton = () => (
  <div style={{ marginTop: 16 }}>
    <Row gutter={[12, 12]}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Col xs={24} sm={12} md={8} key={i}>
          <Card size="small">
            <Skeleton active paragraph={{ rows: 3 }} title={{ width: '50%' }} />
          </Card>
        </Col>
      ))}
    </Row>
    <Card size="small" style={{ marginTop: 16 }}>
      <Skeleton active paragraph={{ rows: 8 }} title={{ width: '30%' }} />
    </Card>
  </div>
)

/**
 * Full-area table skeleton (header row + body rows). Wrap Ant Design Table and set Table `loading={false}`.
 * Avoids `loading={{ indicator: <Skeleton/> }}` which centers a small block and overlaps real columns.
 */
export function TableWithSkeletonLoading({
  loading,
  children,
  columns = 8,
  rows = 12,
}: {
  loading: boolean
  children: ReactNode
  /** Visual column placeholders (approximate your table width). */
  columns?: number
  rows?: number
}) {
  const rowCells = (height: number) =>
    Array.from({ length: columns }).map((_, j) => (
      <Skeleton.Input
        key={j}
        active
        size="small"
        style={{
          flex: j === 0 ? 1.15 : 1,
          minWidth: 40,
          height,
          maxWidth: '100%',
        }}
      />
    ))

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: loading ? 280 : undefined }}>
      {children}
      {loading ? (
        <div
          aria-busy
          aria-label="Loading table"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 6,
            background: 'var(--ant-color-bg-container, #ffffff)',
            borderRadius: 8,
            overflow: 'hidden',
            boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.06)',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              padding: '14px 12px',
              borderBottom: '1px solid var(--ant-color-border-secondary, #f0f0f0)',
              background: 'var(--ant-color-fill-alter, #fafafa)',
            }}
          >
            {rowCells(16)}
          </div>
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'center',
                padding: '11px 12px',
                borderBottom: '1px solid var(--ant-color-border-secondary, #f0f0f0)',
              }}
            >
              {rowCells(14)}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
