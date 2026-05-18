import type { ReactNode, SyntheticEvent } from 'react'
import { Input, Radio, Select, Typography } from 'antd'
import type { EmailJobSchedule, ScheduleType } from '../../api/emailScheduler'
import './execution-schedule-picker.css'

const { Text } = Typography

const MINUTE_INTERVALS = [
  { value: 5, label: '5 minutes' },
  { value: 10, label: '10 minutes' },
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '60 minutes' },
]

const HOURS = Array.from({ length: 24 }, (_, i) => ({ value: i, label: String(i) }))
const MINUTES = Array.from({ length: 60 }, (_, i) => ({
  value: i,
  label: String(i).padStart(2, '0'),
}))
const DAYS = Array.from({ length: 31 }, (_, i) => ({ value: i + 1, label: `${i + 1}.` }))
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
].map((label, i) => ({ value: i + 1, label }))

const TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'America/New_York' },
  { value: 'Europe/London', label: 'Europe/London' },
]

type ScheduleValue = Pick<
  EmailJobSchedule,
  | 'schedule_type'
  | 'interval_minutes'
  | 'hour'
  | 'minute'
  | 'day_of_month'
  | 'month'
  | 'cron_expression'
  | 'timezone'
>

type Props = {
  value: ScheduleValue
  onChange: (patch: Partial<EmailJobSchedule>) => void
  disabled?: boolean
}

function stopSelectEvent(e: SyntheticEvent) {
  e.stopPropagation()
}

function InlineSelect<T extends string | number>({
  value,
  options,
  onChange,
  width,
  inactive,
  panelDisabled,
  onActivate,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  width?: number
  inactive?: boolean
  panelDisabled?: boolean
  onActivate: () => void
}) {
  return (
    <span
      className={`exec-schedule-select-wrap${inactive ? ' exec-schedule-select-wrap--inactive' : ''}`}
      onClick={stopSelectEvent}
      onMouseDown={stopSelectEvent}
    >
      <Select
        className="exec-schedule-inline-select"
        size="small"
        popupMatchSelectWidth={false}
        disabled={panelDisabled}
        value={value}
        options={options}
        getPopupContainer={(trigger) => trigger.parentElement ?? document.body}
        onDropdownVisibleChange={(open) => {
          if (open) onActivate()
        }}
        onChange={onChange}
        style={{ width: width ?? 'auto', minWidth: width }}
      />
    </span>
  )
}

function ScheduleRow({
  active,
  panelDisabled,
  onSelect,
  children,
}: {
  active: boolean
  panelDisabled?: boolean
  onSelect: () => void
  children: ReactNode
}) {
  return (
    <div className={`execution-schedule-row${active ? ' execution-schedule-row--active' : ''}`}>
      <Radio
        checked={active}
        disabled={panelDisabled}
        onChange={onSelect}
        onClick={stopSelectEvent}
        onMouseDown={stopSelectEvent}
      />
      <div
        className="execution-schedule-line"
        role="presentation"
        onClick={() => {
          if (!panelDisabled) onSelect()
        }}
      >
        {children}
      </div>
    </div>
  )
}

export function ExecutionSchedulePicker({ value, onChange, disabled }: Props) {
  const type = value.schedule_type || 'daily'
  const setType = (schedule_type: ScheduleType) => onChange({ schedule_type })

  return (
    <div className="execution-schedule-picker">
      <Text type="secondary" className="execution-schedule-title">
        Execution schedule
      </Text>

      <ScheduleRow active={type === 'every_minutes'} panelDisabled={disabled} onSelect={() => setType('every_minutes')}>
        Every{' '}
        <InlineSelect
          value={value.interval_minutes ?? 15}
          options={MINUTE_INTERVALS}
          inactive={type !== 'every_minutes'}
          panelDisabled={disabled}
          onActivate={() => setType('every_minutes')}
          width={128}
          onChange={(v) => onChange({ interval_minutes: v, schedule_type: 'every_minutes' })}
        />
      </ScheduleRow>

      <ScheduleRow active={type === 'daily'} panelDisabled={disabled} onSelect={() => setType('daily')}>
        Every day at{' '}
        <InlineSelect
          value={value.hour}
          options={HOURS}
          inactive={type !== 'daily'}
          panelDisabled={disabled}
          onActivate={() => setType('daily')}
          width={64}
          onChange={(v) => onChange({ hour: v, schedule_type: 'daily' })}
        />
        <span className="execution-schedule-colon">:</span>
        <InlineSelect
          value={value.minute}
          options={MINUTES}
          inactive={type !== 'daily'}
          panelDisabled={disabled}
          onActivate={() => setType('daily')}
          width={64}
          onChange={(v) => onChange({ minute: v, schedule_type: 'daily' })}
        />
      </ScheduleRow>

      <ScheduleRow active={type === 'monthly'} panelDisabled={disabled} onSelect={() => setType('monthly')}>
        Every{' '}
        <InlineSelect
          value={value.day_of_month ?? 1}
          options={DAYS}
          inactive={type !== 'monthly'}
          panelDisabled={disabled}
          onActivate={() => setType('monthly')}
          width={64}
          onChange={(v) => onChange({ day_of_month: v, schedule_type: 'monthly' })}
        />{' '}
        of the month at{' '}
        <InlineSelect
          value={value.hour}
          options={HOURS}
          inactive={type !== 'monthly'}
          panelDisabled={disabled}
          onActivate={() => setType('monthly')}
          width={64}
          onChange={(v) => onChange({ hour: v, schedule_type: 'monthly' })}
        />
        <span className="execution-schedule-colon">:</span>
        <InlineSelect
          value={value.minute}
          options={MINUTES}
          inactive={type !== 'monthly'}
          panelDisabled={disabled}
          onActivate={() => setType('monthly')}
          width={64}
          onChange={(v) => onChange({ minute: v, schedule_type: 'monthly' })}
        />
      </ScheduleRow>

      <ScheduleRow active={type === 'yearly'} panelDisabled={disabled} onSelect={() => setType('yearly')}>
        <span className="execution-schedule-line-wrap">
          Every year on{' '}
          <InlineSelect
            value={value.day_of_month ?? 1}
            options={DAYS}
            inactive={type !== 'yearly'}
            panelDisabled={disabled}
            onActivate={() => setType('yearly')}
            width={64}
            onChange={(v) => onChange({ day_of_month: v, schedule_type: 'yearly' })}
          />{' '}
          <InlineSelect
            value={value.month ?? 1}
            options={MONTHS}
            inactive={type !== 'yearly'}
            panelDisabled={disabled}
            onActivate={() => setType('yearly')}
            width={120}
            onChange={(v) => onChange({ month: v, schedule_type: 'yearly' })}
          />{' '}
          at{' '}
          <InlineSelect
            value={value.hour}
            options={HOURS}
            inactive={type !== 'yearly'}
            panelDisabled={disabled}
            onActivate={() => setType('yearly')}
            width={64}
            onChange={(v) => onChange({ hour: v, schedule_type: 'yearly' })}
          />
          <span className="execution-schedule-colon">:</span>
          <InlineSelect
            value={value.minute}
            options={MINUTES}
            inactive={type !== 'yearly'}
            panelDisabled={disabled}
            onActivate={() => setType('yearly')}
            width={64}
            onChange={(v) => onChange({ minute: v, schedule_type: 'yearly' })}
          />
        </span>
      </ScheduleRow>

      <ScheduleRow active={type === 'custom'} panelDisabled={disabled} onSelect={() => setType('custom')}>
        <span className="execution-schedule-custom-label">Custom</span>
        {type === 'custom' && (
          <Input
            className="execution-schedule-cron-input"
            disabled={disabled}
            placeholder="*/15 * * * *  or  7 8 * * *"
            value={value.cron_expression ?? ''}
            onClick={stopSelectEvent}
            onMouseDown={stopSelectEvent}
            onChange={(e) => onChange({ cron_expression: e.target.value, schedule_type: 'custom' })}
          />
        )}
      </ScheduleRow>

      <div className="execution-schedule-timezone" onClick={stopSelectEvent} onMouseDown={stopSelectEvent}>
        <Text type="secondary">Timezone </Text>
        <Select
          className="exec-schedule-inline-select"
          size="small"
          disabled={disabled}
          value={value.timezone}
          options={TIMEZONES}
          getPopupContainer={(trigger) => trigger.parentElement ?? document.body}
          onChange={(tz) => onChange({ timezone: tz })}
          style={{ minWidth: 220 }}
        />
      </div>
    </div>
  )
}
