import { Tooltip } from 'antd'
import type { CSSProperties, ReactNode } from 'react'

/** Light panel: Ant Design default tooltip uses *light* text for dark panels — if we set white bg we must set dark text or content is invisible. */
const OVERLAY_INNER: CSSProperties = {
  maxWidth: 400,
  padding: '12px 14px',
  borderRadius: 10,
  boxShadow: '0 12px 40px rgba(15, 23, 42, 0.14)',
  border: '1px solid rgba(0, 0, 0, 0.06)',
  background: '#fff',
  color: 'rgba(0, 0, 0, 0.88)',
  fontSize: 13,
  lineHeight: 1.55,
}

const OVERLAY: CSSProperties = {
  maxWidth: 420,
}

/** Single-line ellipsis for dense table cells */
export const tableCellEllipsisStyle: CSSProperties = {
  display: 'block',
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

export type TextCellTooltipProps = {
  /** Full text shown in the tooltip (multiline allowed). */
  tooltip: string | null | undefined
  /** Truncated / layout content in the cell. */
  children: ReactNode
  /** Hover delay before opening (seconds). Default 0.15 (150ms). */
  mouseEnterDelay?: number
  /** If true, no tooltip (renders children only). */
  disabled?: boolean
}

/**
 * SaaS-style hover tooltip: rounded, shadow, max-width 400px, multiline body.
 * Use with a truncated / ellipsis child for table cells.
 */
export function TextCellTooltip({
  tooltip,
  children,
  mouseEnterDelay = 0.15,
  disabled,
}: TextCellTooltipProps) {
  const tip = tooltip != null ? String(tooltip).trim() : ''
  if (disabled || !tip) {
    return <>{children}</>
  }

  return (
    <Tooltip
      title={
        <span
          style={{
            display: 'block',
            maxWidth: 400,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            color: 'rgba(0, 0, 0, 0.88)',
          }}
        >
          {tip}
        </span>
      }
      mouseEnterDelay={mouseEnterDelay}
      mouseLeaveDelay={0.08}
      placement="topLeft"
      overlayInnerStyle={OVERLAY_INNER}
      overlayStyle={OVERLAY}
      destroyTooltipOnHide={false}
      getPopupContainer={() => document.body}
    >
      <span style={{ display: 'block', minWidth: 0, cursor: 'default' }}>{children}</span>
    </Tooltip>
  )
}
