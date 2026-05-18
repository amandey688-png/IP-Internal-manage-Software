import { Input, Radio, Select, Typography } from 'antd'
import type { EmailJobSchedule } from '../../api/emailScheduler'
import './execution-schedule-picker.css'

const { Text } = Typography

export type ScheduleType = EmailJobSchedule['schedule_type']

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

type Props = {
  value: Pick<
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
  onChange: (patch: Partial<EmailJobSchedule>) => void
  disabled?: boolean
}

function InlineSelect<T extends string | number>({
  value,
  options,
  onChange,
  width,
  disabled,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  width?: number
  disabled?: boolean
}) {
  return (
    <Select
      className="exec-schedule-inline-select"
      variant="borderless"
      popupMatchSelectWidth={false}
      disabled={disabled}
      value={value}
      options={options}
      onChange={onChange}
      style={{ width: width ?? 'auto', minWidth: width }}
    />
  )
}

export function ExecutionSchedulePicker({ value, onChange, disabled }: Props) {
  const type = value.schedule_type || 'daily'

  return (
    <div className="execution-schedule-picker">
      <Text type="secondary" className="execution-schedule-title">
        Execution schedule
      </Text>
      <Radio.Group
        className="execution-schedule-radios"
        value={type}
        disabled={disabled}
        onChange={(e) => onChange({ schedule_type: e.target.value as ScheduleType })}
      >
        <Radio value="every_minutes" className="execution-schedule-row">
          <span className="execution-schedule-line">
            Every{' '}
            <InlineSelect
              value={value.interval_minutes ?? 15}
              options={MINUTE_INTERVALS}
              disabled={disabled || type !== 'every_minutes'}
              width={120}
              onChange={(v) => onChange({ interval_minutes: v, schedule_type: 'every_minutes' })}
            />
          </span>
        </Radio>

        <Radio value="daily" className="execution-schedule-row">
          <span className="execution-schedule-line">
            Every day at{' '}
            <InlineSelect
              value={value.hour}
              options={HOURS}
              disabled={disabled || type !== 'daily'}
              width={56}
              onChange={(v) => onChange({ hour: v })}
            />
            <span className="execution-schedule-colon">:</span>
            <InlineSelect
              value={value.minute}
              options={MINUTES}
              disabled={disabled || type !== 'daily'}
              width={56}
              onChange={(v) => onChange({ minute: v })}
            />
          </span>
        </Radio>

        <Radio value="monthly" className="execution-schedule-row">
          <span className="execution-schedule-line">
            Every{' '}
            <InlineSelect
              value={value.day_of_month ?? 1}
              options={DAYS}
              disabled={disabled || type !== 'monthly'}
              width={56}
              onChange={(v) => onChange({ day_of_month: v })}
            />{' '}
            of the month at{' '}
            <InlineSelect
              value={value.hour}
              options={HOURS}
              disabled={disabled || type !== 'monthly'}
              width={56}
              onChange={(v) => onChange({ hour: v })}
            />
            <span className="execution-schedule-colon">:</span>
            <InlineSelect
              value={value.minute}
              options={MINUTES}
              disabled={disabled || type !== 'monthly'}
              width={56}
              onChange={(v) => onChange({ minute: v })}
            />
          </span>
        </Radio>

        <Radio value="yearly" className="execution-schedule-row">
          <span className="execution-schedule-line execution-schedule-line-wrap">
            Every year on{' '}
            <InlineSelect
              value={value.day_of_month ?? 1}
              options={DAYS}
              disabled={disabled || type !== 'yearly'}
              width={56}
              onChange={(v) => onChange({ day_of_month: v })}
            />{' '}
            <InlineSelect
              value={value.month ?? 1}
              options={MONTHS}
              disabled={disabled || type !== 'yearly'}
              width={110}
              onChange={(v) => onChange({ month: v })}
            />{' '}
            at{' '}
            <InlineSelect
              value={value.hour}
              options={HOURS}
              disabled={disabled || type !== 'yearly'}
              width={56}
              onChange={(v) => onChange({ hour: v })}
            />
            <span className="execution-schedule-colon">:</span>
            <InlineSelect
              value={value.minute}
              options={MINUTES}
              disabled={disabled || type !== 'yearly'}
              width={56}
              onChange={(v) => onChange({ minute: v })}
            />
          </span>
        </Radio>

        <Radio value="custom" className="execution-schedule-row">
          <span className="execution-schedule-line execution-schedule-custom">
            Custom
            {type === 'custom' && (
              <Input
                className="execution-schedule-cron-input"
                disabled={disabled}
                placeholder="*/15 * * * *  or  7 8 * * *"
                value={value.cron_expression ?? ''}
                onChange={(e) => onChange({ cron_expression: e.target.value })}
              />
            )}
          </span>
        </Radio>
      </Radio.Group>

      <div className="execution-schedule-timezone">
        <Text type="secondary">Timezone </Text>
        <Select
          className="exec-schedule-inline-select"
          variant="borderless"
          disabled={disabled}
          value={value.timezone}
          options={TIMEZONES}
          onChange={(tz) => onChange({ timezone: tz })}
          style={{ minWidth: 200 }}
        />
      </div>
    </div>
  )
}
