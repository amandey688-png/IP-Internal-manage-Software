import { Fragment, useCallback, useEffect, useState } from 'react'
import { Alert, Button, Card, Space, Switch, Typography, message } from 'antd'
import { ClockCircleOutlined, SaveOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { emailSchedulerApi, type EmailJobSchedule, type ScheduleUpdateBody } from '../../api/emailScheduler'
import { resolveSchedulerTickUrl } from '../../api/axios'
import { apiErrorMessage } from '../../utils/apiError'
import { ExecutionSchedulePicker } from './ExecutionSchedulePicker'

const { Text, Paragraph } = Typography

type RowState = EmailJobSchedule & { saving?: boolean }

function toUpdateBody(row: EmailJobSchedule): ScheduleUpdateBody {
  return {
    enabled: row.enabled,
    schedule_type: row.schedule_type || 'daily',
    interval_minutes: row.interval_minutes ?? null,
    hour: row.hour,
    minute: row.minute,
    day_of_month: row.day_of_month ?? 1,
    month: row.month ?? 1,
    cron_expression: row.cron_expression ?? null,
    timezone: row.timezone,
  }
}

export function EmailSchedulesPanel() {
  const [rows, setRows] = useState<RowState[]>([])
  const [loading, setLoading] = useState(true)
  const [tickLoading, setTickLoading] = useState(false)
  const tickUrl = resolveSchedulerTickUrl()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await emailSchedulerApi.listSchedules()
      setRows(res.items || [])
    } catch (e) {
      message.error(apiErrorMessage(e, 'Could not load schedules. Run EMAIL_JOB_SCHEDULES.sql + V2 on Supabase.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const patchRow = (jobKey: string, patch: Partial<RowState>) => {
    setRows((prev) => prev.map((r) => (r.job_key === jobKey ? { ...r, ...patch } : r)))
  }

  const saveRow = async (row: RowState) => {
    patchRow(row.job_key, { saving: true })
    try {
      const updated = await emailSchedulerApi.updateSchedule(row.job_key, toUpdateBody(row))
      patchRow(row.job_key, { ...updated, saving: false })
      message.success(`Saved ${row.label}`)
    } catch (e) {
      patchRow(row.job_key, { saving: false })
      message.error(apiErrorMessage(e, 'Save failed'))
    }
  }

  const runTick = async (jobKey?: string) => {
    setTickLoading(true)
    try {
      const res = await emailSchedulerApi.tick({ force: true, job: jobKey })
      const sent = (res.jobs || []).filter((j) => j.email_sent).map((j) => j.job_key)
      if (sent.length) message.success(`Sent: ${sent.join(', ')}`)
      else message.info(res.jobs?.[0]?.reason || res.jobs?.[0]?.error || 'Completed (no emails sent)')
    } catch (e) {
      message.error(apiErrorMessage(e, 'Run failed'))
    } finally {
      setTickLoading(false)
    }
  }

  return (
    <Fragment>
      <Typography.Title level={4}>
        <ClockCircleOutlined style={{ marginRight: 8 }} />
        Automated email schedules
      </Typography.Title>
      <Paragraph type="secondary">
        Configure each job like a cron scheduler (every N minutes, daily, monthly, yearly, or custom cron). Render Cron
        should call <Text code copyable>{tickUrl}</Text> every <Text strong>5 minutes</Text> with{' '}
        <Text code>X-Cron-Secret</Text>. Checklist and delegation send <Text strong>one email per user</Text> with pending
        work.
      </Paragraph>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16, maxWidth: 960 }}
        message="Supabase migration required for cron-style schedules"
        description={
          <span>
            Run <Text code>database/EMAIL_JOB_SCHEDULES_V2.sql</Text> once if schedules fail to save.
          </span>
        }
      />

      {loading && <Text type="secondary">Loading schedules…</Text>}

      {rows.map((row) => (
        <Card
          key={row.job_key}
          className="email-schedule-job-card"
          size="small"
          title={
            <Space>
              <Switch checked={row.enabled} onChange={(c) => patchRow(row.job_key, { enabled: c })} />
              <span>{row.label}</span>
            </Space>
          }
          extra={
            <Space>
              <Button size="small" icon={<SaveOutlined />} loading={row.saving} onClick={() => saveRow(row)}>
                Save
              </Button>
              <Button size="small" icon={<ThunderboltOutlined />} loading={tickLoading} onClick={() => runTick(row.job_key)}>
                Run now
              </Button>
            </Space>
          }
        >
          {row.schedule_summary && <div className="email-schedule-summary">{row.schedule_summary}</div>}
          {row.cron_expression && (
            <div className="email-schedule-summary">
              Cron: <Text code>{row.cron_expression}</Text>
            </div>
          )}
          <ExecutionSchedulePicker
            value={row}
            disabled={!row.enabled}
            onChange={(patch) => patchRow(row.job_key, patch)}
          />
        </Card>
      ))}

      <Button type="primary" style={{ marginTop: 12 }} loading={tickLoading} onClick={() => runTick()}>
        Force run all jobs now (test)
      </Button>
    </Fragment>
  )
}
