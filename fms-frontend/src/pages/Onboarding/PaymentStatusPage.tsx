import { useState, useEffect } from 'react'
import { Card, Typography, Form, Input, Select, DatePicker, Button, Table, message, Modal, Space } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { onboardingApi, type PaymentStatusRecord } from '../../api/onboarding'

const { Title } = Typography
const { TextArea } = Input

const PAYMENT_STATUS_OPTIONS = [
  { label: 'Done', value: 'Done' },
  { label: 'Not Done', value: 'Not Done' },
]

export function PaymentStatusPage() {
  const [form] = Form.useForm()
  const [records, setRecords] = useState<PaymentStatusRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [addModalOpen, setAddModalOpen] = useState(false)

  const loadRecords = () => {
    setLoading(true)
    onboardingApi
      .listPaymentStatus()
      .then((r) => setRecords(r.items || []))
      .catch(() => {
        setRecords([])
        message.warning('Could not load records. Ensure the database table exists.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadRecords()
  }, [])

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      setSubmitLoading(true)
      const payload = {
        company_name: (values.company_name || '').trim(),
        payment_status: values.payment_status as 'Done' | 'Not Done',
        payment_received_date: values.payment_received_date
          ? (values.payment_received_date as Dayjs).format('YYYY-MM-DD')
          : null,
        poc_name: values.poc_name ? (values.poc_name as string).trim() : null,
        poc_contact: values.poc_contact ? String(values.poc_contact).trim() : null,
        accounts_remarks: values.accounts_remarks ? (values.accounts_remarks as string).trim() : null,
      }
      onboardingApi
        .createPaymentStatus(payload)
        .then(() => {
          message.success('Payment status submitted')
          form.resetFields()
          setAddModalOpen(false)
          loadRecords()
        })
        .catch(() => message.error('Failed to submit'))
        .finally(() => setSubmitLoading(false))
    }).catch(() => {
      message.warning('Please fill Company Name and Payment Status')
    })
  }

  const openAddModal = () => {
    form.resetFields()
    setAddModalOpen(true)
  }

  const columns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 170,
      render: (v: string) => (v ? dayjs(v).format('DD-MMM-YYYY HH:mm') : '—'),
    },
    {
      title: 'Reference No',
      dataIndex: 'reference_no',
      key: 'reference_no',
      width: 100,
    },
    {
      title: 'Company Name',
      dataIndex: 'company_name',
      key: 'company_name',
    },
    {
      title: 'Payment Status',
      dataIndex: 'payment_status',
      key: 'payment_status',
      width: 110,
    },
    {
      title: 'Payment Received Date',
      dataIndex: 'payment_received_date',
      key: 'payment_received_date',
      width: 150,
      render: (v: string | null) => (v ? dayjs(v).format('DD-MMM-YYYY') : '—'),
    },
    {
      title: 'POC Name',
      dataIndex: 'poc_name',
      key: 'poc_name',
    },
    {
      title: 'POC Contact',
      dataIndex: 'poc_contact',
      key: 'poc_contact',
      width: 120,
    },
    {
      title: 'Accounts Remarks',
      dataIndex: 'accounts_remarks',
      key: 'accounts_remarks',
      ellipsis: true,
      render: (v: string | null) => (v ? <span title={v}>{v}</span> : '—'),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>
          Payment Status
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
          Add Payment Status
        </Button>
      </Space>

      <Modal
        title="Add Payment Status"
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        footer={null}
        destroyOnClose
        width={520}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="company_name"
            label="Company Name"
            rules={[{ required: true, message: 'Company Name is required' }]}
          >
            <Input placeholder="Enter company name" />
          </Form.Item>

          <Form.Item
            name="payment_status"
            label="Payment Status"
            rules={[{ required: true }]}
          >
            <Select
              placeholder="Select Done or Not Done"
              options={PAYMENT_STATUS_OPTIONS}
              allowClear={false}
            />
          </Form.Item>

          <Form.Item name="payment_received_date" label="Payment Received Date">
            <DatePicker style={{ width: '100%' }} format="DD-MMM-YYYY" />
          </Form.Item>

          <Form.Item name="poc_name" label="POC Name">
            <Input placeholder="POC Name" />
          </Form.Item>

          <Form.Item
            name="poc_contact"
            label="POC Contact (10 digits)"
            rules={[
              {
                validator: (_, value) => {
                  if (!value || String(value).trim() === '') return Promise.resolve()
                  if (/^\d{10}$/.test(String(value).trim())) return Promise.resolve()
                  return Promise.reject(new Error('Must be exactly 10 digits'))
                },
              },
            ]}
          >
            <Input placeholder="10 digit contact number" maxLength={10} />
          </Form.Item>

          <Form.Item name="accounts_remarks" label="Accounts Remarks">
            <TextArea rows={4} placeholder="Long text" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitLoading}>
                Submit
              </Button>
              <Button onClick={() => setAddModalOpen(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Card title="Payment Status Records">
        <Table
          dataSource={records}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1100 }}
          pagination={{ pageSize: 20, showSizeChanger: true }}
        />
      </Card>
    </div>
  )
}
