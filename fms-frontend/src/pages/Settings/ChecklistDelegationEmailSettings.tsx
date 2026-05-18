import { Fragment } from 'react'
import { Alert, Typography } from 'antd'
import { CheckSquareOutlined } from '@ant-design/icons'

const { Title, Paragraph, Text } = Typography

/** Per-user checklist & delegation reminders; times configured in EmailSchedulesPanel. */
export function ChecklistDelegationEmailSettings() {
  return (
    <Fragment>
      <Title level={4}>
        <CheckSquareOutlined style={{ marginRight: 8 }} />
        Checklist &amp; Delegation email reminders
      </Title>
      <Paragraph type="secondary">
        <Text strong>User-wise delivery:</Text> each person with tasks due today (checklist) or overdue delegation work gets{' '}
        <Text strong>one email to their own login address</Text> — not a single group mail. Times are set in{' '}
        <Text strong>Automated email schedules</Text> above (
        <Text code>checklist_daily</Text> and <Text code>delegation_daily</Text>).
      </Paragraph>
      <Alert
        type="success"
        showIcon
        style={{ maxWidth: 900 }}
        message="How it works"
        description={
          <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
            <li>Checklist: emails go to each <Text strong>doer</Text> with incomplete checklist items due today.</li>
            <li>Delegation: emails go to each <Text strong>assignee</Text> with pending/overdue delegation tasks.</li>
            <li>At most one reminder per user per day (dedup in Supabase).</li>
            <li>Use <Text strong>Run now</Text> on that row in the schedule table to test after fixing Postmark on Render.</li>
          </ul>
        }
      />
    </Fragment>
  )
}
