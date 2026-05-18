import { Fragment, useCallback, useEffect, useState } from 'react'
import { Alert, Button, InputNumber, Select, Space, Switch, Table, Typography, message } from 'antd'
import { ClockCircleOutlined, SaveOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { emailSchedulerApi, type EmailJobSchedule } from '../../api/emailScheduler'
import { resolveSchedulerTickUrl } from '../../api/axios'
import { apiErrorMessage } from '../../utils/apiError'

const { Text, Paragraph } = Typography

const TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'America/New_York' },
  { value: 'Europe/London', label: 'Europe/London' },
]

type RowState = EmailJobSchedule & { saving?: boolean }

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
      message.error(apiErrorMessage(e, 'Could not load schedules. Run EMAIL_JOB_SCHEDULES.sql on Supabase.'))
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
      const updated = await emailSchedulerApi.updateSchedule(row.job_key, {
        enabled: row.enabled,
        hour: row.hour,
        minute: row.minute,
        timezone: row.timezone,
      })
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
      else message.info(res.jobs?.[0]?.reason || res.jobs?.[0]?.error || 'Completed (no emails sent — check Postmark & recipients)')
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
        Set the daily send time here. Use <Text strong>one Render Cron Job</Text> (recommended) instead of cron-job.org: call{' '}
        <Text code copyable>
          {tickUrl}
        </Text>{' '}
        every <Text strong>5 minutes</Text> with header <Text code>X-Cron-Secret</Text>. The server runs each job only when its
        time matches (within a 10-minute window). Checklist and delegation emails go to each user with pending tasks (one mail per
        person per day).
      </Paragraph>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16, maxWidth: 960 }}
        message="Render Cron setup (more reliable than external cron-job.org)"
        description={
          <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
            <li>
              Render Dashboard → your Web Service → <Text strong>Cron Jobs</Text> → Add cron
            </li>
            <li>
              Schedule: <Text code>*/5 * * * *</Text> (every 5 minutes)
            </li>
            <li>
              Command / URL: HTTP GET <Text code>{tickUrl}</Text>
            </li>
            <li>
              Header: <Text code>X-Cron-Secret</Text> = same as <Text code>FEATURE_APPROVAL_CRON_SECRET</Text> on Render
            </li>
          </ul>
        }
      />

      <Table<RowState>
        size="small"
        rowKey="job_key"
        loading={loading}
        pagination={false}
        dataSource={rows}
        scroll={{ x: 720 }}
        columns={[
          { title: 'Job', dataIndex: 'label', key: 'label', width: 280 },
          {
            title: 'On',
            key: 'enabled',
            width: 64,
            render: (_, r) => <Switch checked={r.enabled} onChange={(c) => patchRow(r.job_key, { enabled: c })} />,
          },
          {
            title: 'Hour',
            key: 'hour',
            width: 88,
            render: (_, r) => (
              <InputNumber min={0} max={23} value={r.hour} onChange={(v) => patchRow(r.job_key, { hour: v ?? 0 })} />
            ),
          },
          {
            title: 'Min',
            key: 'minute',
            width: 88,
            render: (_, r) => (
              <InputNumber min={0} max={59} value={r.minute} onChange={(v) => patchRow(r.job_key, { minute: v ?? 0 })} />
            ),
          },
          {
            title: 'Timezone',
            key: 'timezone',
            width: 200,
            render: (_, r) => (
              <Select
                style={{ width: '100%' }}
                value={r.timezone}
                options={TIMEZONES}
                onChange={(v) => patchRow(r.job_key, { timezone: v })}
              />
            ),
          },
          {
            title: '',
            key: 'actions',
            width: 200,
            render: (_, r) => (
              <Space>
                <Button size="small" icon={<SaveOutlined />} loading={r.saving} onClick={() => saveRow(r)}>
                  Save
                </Button>
                <Button size="small" icon={<ThunderboltOutlined />} loading={tickLoading} onClick={() => runTick(r.job_key)}>
                  Run now
                </Button>
              </Space>
            ),
          },
        ]}
      />

      <Button type="primary" style={{ marginTop: 12 }} loading={tickLoading} onClick={() => runTick()}>
        Force run all jobs now (test)
      </Button>
    </Fragment>
  )
}
