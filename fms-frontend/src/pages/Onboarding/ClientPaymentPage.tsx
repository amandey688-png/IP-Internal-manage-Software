import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Button, Card, Checkbox, DatePicker, Descriptions, Divider, Drawer, Form, Input, InputNumber, Modal, Select, Space, Table, Tooltip, Typography, message } from 'antd'
import { CheckCircleOutlined, EditOutlined, FormOutlined } from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import { API_ENDPOINTS } from '../../utils/constants'
import { apiClient } from '../../api/axios'
import { useAuth } from '../../hooks/useAuth'
import { TableWithSkeletonLoading } from '../../components/common/skeletons'
import { exportRowsToCsv, type ExportColumn } from '../../utils/exportCsv'

const { Title, Text } = Typography

interface ClientPaymentRecord {
  id: string
  timestamp: string
  reference_no?: string
  company_name: string
  invoice_date: string | null
  invoice_amount: string | null
  invoice_number: string | null
  genre: 'M' | 'Q' | 'HY' | 'Y'
  stage?: string | null
  status?: string
  aging_days?: number
}

const GENRE_OPTIONS = [
  { label: "M – Monthly", value: 'M' },
  { label: "Q – Quarterly", value: 'Q' },
  { label: "HY – Half yearly", value: 'HY' },
  { label: "Y – Yearly", value: 'Y' },
]

export function ClientPaymentPage() {
  const { user } = useAuth()
  const [records, setRecords] = useState<ClientPaymentRecord[]>([])
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([])
  /** Loaded lazily when "Add Raised Invoice" opens — avoids blocking the table on /companies. */
  const [companiesLoading, setCompaniesLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<ClientPaymentRecord | null>(null)
  const [sentModalOpen, setSentModalOpen] = useState(false)
  const [sentLoading, setSentLoading] = useState(false)
  const [sentEditable, setSentEditable] = useState(true)
  const [sentSummary, setSentSummary] = useState<{
    email_sent?: boolean
    courier_sent?: boolean
    whatsapp_sent?: boolean
  } | null>(null)
  const [sentDetails, setSentDetails] = useState<{
    email?: string | null
    tracking_details?: string | null
    whatsapp_number?: string | null
  } | null>(null)
  const [sentSubmitted, setSentSubmitted] = useState(false)
  const [sentForm] = Form.useForm()
  const [form] = Form.useForm()
  const [editInvoiceModalOpen, setEditInvoiceModalOpen] = useState(false)
  const [editInvoiceSubmitLoading, setEditInvoiceSubmitLoading] = useState(false)
  const [editInvoiceForm] = Form.useForm()

  const [followupModalOpen, setFollowupModalOpen] = useState(false)
  const [followupLoading, setFollowupLoading] = useState(false)
  const [followupEditable, setFollowupEditable] = useState(true)
  const [followupSubmitted, setFollowupSubmitted] = useState(false)
  const [followupSummary, setFollowupSummary] = useState<{
    contact_person?: string | null
    mail_sent?: boolean
    whatsapp_sent?: boolean
  } | null>(null)
  const [followupDetails, setFollowupDetails] = useState<{
    remarks?: string | null
  } | null>(null)
  const [followupForm] = Form.useForm()
  const [drawerStatusLoading, setDrawerStatusLoading] = useState(false)
  const [nextFollowupNo, setNextFollowupNo] = useState(1)
  const [followupsItems, setFollowupsItems] = useState<{ followup_no: number; contact_person?: string | null; remarks?: string | null; mail_sent?: boolean; whatsapp_sent?: boolean; created_at?: string; editable_24h?: boolean }[]>([])
  const [interceptSubmitted, setInterceptSubmitted] = useState(false)
  const [interceptDetails, setInterceptDetails] = useState<{
    last_remark_user?: string | null
    usage_last_1_month?: string | null
    contact_person?: string | null
    contact_number?: string | null
    tagged_user_id?: string | null
    tagged_user_name?: string | null
    tagged_user_email?: string | null
    tagged_user_2_id?: string | null
    tagged_user_2_name?: string | null
    tagged_user_2_email?: string | null
    payment_action_person?: string | null
    payment_action_remarks?: string | null
    payment_action_submitted_at?: string | null
    payment_action_2_person?: string | null
    payment_action_2_remarks?: string | null
    payment_action_2_submitted_at?: string | null
  } | null>(null)
  const [interceptEditable, setInterceptEditable] = useState(true)
  const [interceptModalOpen, setInterceptModalOpen] = useState(false)
  const [interceptForm] = Form.useForm()
  const [discontinuationSubmitted, setDiscontinuationSubmitted] = useState(false)
  const [discontinuationDetails, setDiscontinuationDetails] = useState<{
    mail_sent_to?: string | null
    mail_sent_on?: string | null
    remarks?: string | null
  } | null>(null)
  const [discontinuationModalOpen, setDiscontinuationModalOpen] = useState(false)
  const [discontinuationForm] = Form.useForm()
  const [interceptTagModalOpen, setInterceptTagModalOpen] = useState(false)
  const [interceptTag2ModalOpen, setInterceptTag2ModalOpen] = useState(false)
  const [tagUsers, setTagUsers] = useState<{ id: string; full_name: string; email: string }[]>([])
  const [tagLoading, setTagLoading] = useState(false)
  const [tagSelectedUserId, setTagSelectedUserId] = useState<string | null>(null)
  const [tag2SelectedUserId, setTag2SelectedUserId] = useState<string | null>(null)
  const [paymRecModalOpen, setPaymRecModalOpen] = useState(false)
  const [paymRecForm] = Form.useForm()
  const [currentFollowupNo, setCurrentFollowupNo] = useState(1)
  const [companyNameFilter, setCompanyNameFilter] = useState('')
  const [exportOpen, setExportOpen] = useState(false)
  const [selectedExportColumns, setSelectedExportColumns] = useState<string[]>([])

  const location = useLocation()
  const completedSection = location.pathname.includes('/completed/') ? location.pathname.split('/completed/')[1]?.split('/')[0] || null : null
  const isOpenList = !completedSection

  const loadData = () => {
    setLoading(true)
    const listUrl = completedSection ? API_ENDPOINTS.CLIENT_PAYMENT.LIST_COMPLETED(completedSection) : API_ENDPOINTS.CLIENT_PAYMENT.LIST_OPEN
    apiClient
      .get<{ items: ClientPaymentRecord[] }>(listUrl)
      .then((r) => r.data)
      .then((payments) => {
        setRecords((payments.items || []) as ClientPaymentRecord[])
      })
      .catch(() => {
        setRecords([])
        message.warning('Could not load list. Ensure the database tables exist.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [location.pathname])

  useEffect(() => {
    if ((!modalOpen && !editInvoiceModalOpen) || companies.length > 0) return
    setCompaniesLoading(true)
    apiClient
      .get<{ id: string; name: string }[]>('/companies')
      .then((r) => r.data)
      .then((companiesList) => {
        setCompanies((companiesList || []).filter((c: { id?: string; name?: string }) => c && c.id && c.name))
      })
      .catch(() => setCompanies([]))
      .finally(() => setCompaniesLoading(false))
  }, [modalOpen, editInvoiceModalOpen, companies.length])

  const openModal = () => {
    form.resetFields()
    setModalOpen(true)
  }

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      setSubmitLoading(true)
      const payload = {
        company_name: values.company_name as string,
        invoice_date: values.invoice_date ? (values.invoice_date as Dayjs).format('YYYY-MM-DD') : null,
        invoice_amount: values.invoice_amount != null ? String(values.invoice_amount).trim() : null,
        invoice_number: values.invoice_number != null ? String(values.invoice_number).trim() : null,
        genre: values.genre as 'M' | 'Q' | 'HY' | 'Y',
      }
      apiClient
        .post<ClientPaymentRecord>(API_ENDPOINTS.CLIENT_PAYMENT.CREATE, payload)
        .then(() => {
          message.success('Raised Invoice saved')
          setModalOpen(false)
          form.resetFields()
          loadData()
        })
        .catch((err) => {
          const status = err?.response?.status
          const raw = err?.response?.data?.detail
          const detail =
            typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0]?.msg : raw?.message || 'Failed to save Raised Invoice'
          if (status === 404 || (typeof detail === 'string' && detail.toLowerCase().includes('not found'))) {
            message.error(
              'Server has no Client Payment API (404). Redeploy the latest backend (Render) with onboarding/client-payment routes. See docs/CLIENT_PAYMENT_PRODUCTION.md'
            )
          } else {
            message.error(detail)
          }
        })
        .finally(() => setSubmitLoading(false))
    }).catch(() => {
      message.warning('Please fill all required fields')
    })
  }

  const openEditInvoiceModal = () => {
    if (!selectedRecord) return
    editInvoiceForm.setFieldsValue({
      company_name: selectedRecord.company_name,
      invoice_date: selectedRecord.invoice_date ? dayjs(selectedRecord.invoice_date) : undefined,
      invoice_amount:
        selectedRecord.invoice_amount != null && String(selectedRecord.invoice_amount).trim() !== ''
          ? Number(String(selectedRecord.invoice_amount).replace(/,/g, ''))
          : undefined,
      invoice_number: selectedRecord.invoice_number ?? '',
      genre: selectedRecord.genre,
    })
    setEditInvoiceModalOpen(true)
  }

  const handleEditInvoiceSubmit = () => {
    if (!selectedRecord?.id) return
    editInvoiceForm.validateFields().then((values) => {
      setEditInvoiceSubmitLoading(true)
      const payload = {
        company_name: values.company_name as string,
        invoice_date: values.invoice_date ? (values.invoice_date as Dayjs).format('YYYY-MM-DD') : null,
        invoice_amount: values.invoice_amount != null ? String(values.invoice_amount).trim() : null,
        invoice_number: values.invoice_number != null ? String(values.invoice_number).trim() : null,
        genre: values.genre as 'M' | 'Q' | 'HY' | 'Y',
      }
      apiClient
        .put<ClientPaymentRecord>(API_ENDPOINTS.CLIENT_PAYMENT.UPDATE(selectedRecord.id), payload)
        .then((res) => {
          const updated = res.data
          message.success('Raised Invoice updated')
          setEditInvoiceModalOpen(false)
          editInvoiceForm.resetFields()
          const merged: ClientPaymentRecord = { ...selectedRecord, ...updated }
          setSelectedRecord(merged)
          loadDrawerData(merged)
          loadData()
        })
        .catch((err) => {
          const raw = err?.response?.data?.detail
          const detail =
            typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0]?.msg : raw?.message || 'Failed to update Raised Invoice'
          message.error(detail)
        })
        .finally(() => setEditInvoiceSubmitLoading(false))
    }).catch(() => {
      message.warning('Please fill all required fields')
    })
  }

  const loadDrawerData = (record: ClientPaymentRecord) => {
    if (!record?.id) return
    setDrawerStatusLoading(true)
    setSentSummary(null)
    setSentDetails(null)
    setSentSubmitted(false)
    setFollowupSummary(null)
    setFollowupDetails(null)
    setFollowupSubmitted(false)
    setFollowupsItems([])
    setNextFollowupNo(1)
    setInterceptSubmitted(false)
    setInterceptDetails(null)
    setInterceptEditable(true)
    setDiscontinuationSubmitted(false)
    setDiscontinuationDetails(null)
    type DrawerRes = {
      sent?: { data?: any; editable_24h?: boolean; submitted?: boolean }
      followups?: { items?: any[]; next_followup_no?: number }
      intercept?: { data?: any; submitted?: boolean; editable_24h?: boolean }
      discontinuation?: { data?: any; submitted?: boolean }
    }
    apiClient
      .get<DrawerRes>(`/onboarding/client-payment/${record.id}/drawer`)
      .then((res) => {
        const sentRes = res.data?.sent
        const followupsRes = res.data?.followups
        const interceptRes = res.data?.intercept
        const discontinuationRes = res.data?.discontinuation
        const sentData = sentRes?.data || {}
        setSentSummary({
          email_sent: !!sentData.email_sent,
          courier_sent: !!sentData.courier_sent,
          whatsapp_sent: !!sentData.whatsapp_sent,
        })
        setSentDetails({
          email: sentData.email ?? null,
          tracking_details: sentData.tracking_details ?? null,
          whatsapp_number: sentData.whatsapp_number ?? null,
        })
        setSentSubmitted(!!sentRes?.submitted)
        setSentEditable(sentRes?.editable_24h ?? true)
        sentForm.setFieldsValue({
          email_sent: sentData.email_sent ?? false,
          email: sentData.email ?? '',
          courier_sent: sentData.courier_sent ?? false,
          tracking_details: sentData.tracking_details ?? '',
          whatsapp_sent: sentData.whatsapp_sent ?? false,
          whatsapp_number: sentData.whatsapp_number ?? '',
          invoice_number: record.invoice_number ?? sentData.invoice_number ?? '',
        })
        const items = followupsRes?.items || []
        setFollowupsItems(items)
        setNextFollowupNo(Math.min(followupsRes?.next_followup_no ?? 1, 11))
        setFollowupSubmitted(items.length > 0)
        const lastFu = items.slice(-1)[0]
        if (lastFu) {
          setFollowupSummary({ contact_person: lastFu.contact_person ?? null, mail_sent: !!lastFu.mail_sent, whatsapp_sent: !!lastFu.whatsapp_sent })
          setFollowupDetails({ remarks: lastFu.remarks ?? null })
          setFollowupEditable(lastFu.editable_24h ?? false)
        }
        setInterceptSubmitted(!!interceptRes?.submitted)
        const i = interceptRes?.data || {}
        setInterceptEditable(interceptRes?.editable_24h ?? true)
        setInterceptDetails({
          last_remark_user: i.last_remark_user ?? null,
          usage_last_1_month: i.usage_last_1_month ?? null,
          contact_person: i.contact_person ?? null,
          contact_number: i.contact_number ?? null,
          tagged_user_id: i.tagged_user_id ?? null,
          tagged_user_name: i.tagged_user_name ?? null,
          tagged_user_email: i.tagged_user_email ?? null,
          tagged_user_2_id: i.tagged_user_2_id ?? null,
          tagged_user_2_name: i.tagged_user_2_name ?? null,
          tagged_user_2_email: i.tagged_user_2_email ?? null,
          payment_action_person: i.payment_action_person ?? null,
          payment_action_remarks: i.payment_action_remarks ?? null,
          payment_action_submitted_at: i.payment_action_submitted_at ?? null,
          payment_action_2_person: i.payment_action_2_person ?? null,
          payment_action_2_remarks: i.payment_action_2_remarks ?? null,
          payment_action_2_submitted_at: i.payment_action_2_submitted_at ?? null,
        })
        setDiscontinuationSubmitted(!!discontinuationRes?.submitted)
        const d = discontinuationRes?.data || {}
        setDiscontinuationDetails({
          mail_sent_to: d.mail_sent_to ?? null,
          mail_sent_on: d.mail_sent_on ?? null,
          remarks: d.remarks ?? null,
        })
      })
      .catch(() => message.error('Could not load invoice details'))
      .finally(() => setDrawerStatusLoading(false))
  }

  const loadSentDetails = (openModal: boolean) => {
    if (!selectedRecord) return
    setSentLoading(true)
    apiClient
      .get<{ data: any; created_at: string | null; editable_until: string | null; editable_24h: boolean; submitted?: boolean }>(
        `/onboarding/client-payment/${selectedRecord.id}/sent`
      )
      .then((res) => {
        const data = res.data?.data || {}
        sentForm.setFieldsValue({
          email_sent: data.email_sent ?? false,
          email: data.email ?? '',
          courier_sent: data.courier_sent ?? false,
          tracking_details: data.tracking_details ?? '',
          whatsapp_sent: data.whatsapp_sent ?? false,
          whatsapp_number: data.whatsapp_number ?? '',
          invoice_number: selectedRecord.invoice_number ?? data.invoice_number ?? '',
        })
        setSentSummary({
          email_sent: !!data.email_sent,
          courier_sent: !!data.courier_sent,
          whatsapp_sent: !!data.whatsapp_sent,
        })
        setSentDetails({
          email: data.email ?? null,
          tracking_details: data.tracking_details ?? null,
          whatsapp_number: data.whatsapp_number ?? null,
        })
        setSentSubmitted(!!res.data?.submitted)
        setSentEditable(res.data?.editable_24h ?? true)
        if (openModal) setSentModalOpen(true)
      })
      .catch(() => message.error('Could not load Invoice Sent details'))
      .finally(() => setSentLoading(false))
  }

  const openSentDetails = () => {
    loadSentDetails(true)
  }

  const handleSentSubmit = () => {
    if (!selectedRecord) return
    sentForm
      .validateFields()
      .then((values) => {
        setSentLoading(true)
        // Always use invoice number from the Raised Invoice record; do not allow editing here
        const payload = {
          ...values,
          invoice_number: selectedRecord.invoice_number ?? '',
        }
        apiClient
          .post(`/onboarding/client-payment/${selectedRecord.id}/sent`, { data: payload })
          .then((res) => {
            message.success('Invoice Sent details saved')
            const data = res.data?.data || payload
            setSentSummary({
              email_sent: !!data.email_sent,
              courier_sent: !!data.courier_sent,
              whatsapp_sent: !!data.whatsapp_sent,
            })
            setSentDetails({
              email: data.email ?? null,
              tracking_details: data.tracking_details ?? null,
              whatsapp_number: data.whatsapp_number ?? null,
            })
            setSentSubmitted(true)
            setSentModalOpen(false)
            loadData()
          })
          .catch((err) => {
            const detail = err?.response?.data?.detail || 'Failed to save Invoice Sent details'
            message.error(detail)
          })
          .finally(() => setSentLoading(false))
      })
      .catch(() => {})
  }

  const openFollowup = (followupNo: number) => {
    if (!selectedRecord) return
    setCurrentFollowupNo(followupNo)
    setFollowupEditable(true)
    setFollowupLoading(true)
    apiClient
      .get<{ data: any; submitted?: boolean; editable_24h?: boolean }>(`/onboarding/client-payment/${selectedRecord.id}/followups/${followupNo}`)
      .then((res) => {
        const data = res.data?.data || {}
        followupForm.setFieldsValue({
          contact_person: data.contact_person ?? '',
          remarks: data.remarks ?? '',
          mail_sent: data.mail_sent ?? false,
          whatsapp_sent: data.whatsapp_sent ?? false,
        })
        setFollowupEditable(res.data?.submitted ? (res.data?.editable_24h ?? true) : true)
        setFollowupModalOpen(true)
      })
      .catch(() => message.error('Could not load Follow up details'))
      .finally(() => setFollowupLoading(false))
  }

  const handleFollowupSubmit = () => {
    if (!selectedRecord) return
    followupForm.validateFields().then((values) => {
      setFollowupLoading(true)
      const payload = { ...values, followup_no: currentFollowupNo }
      apiClient
        .post(`/onboarding/client-payment/${selectedRecord.id}/followups`, { data: payload })
        .then(() => {
          message.success(`Follow up ${currentFollowupNo} saved`)
          setFollowupModalOpen(false)
          loadDrawerData(selectedRecord)
          loadData()
        })
        .catch((err) => message.error(err?.response?.data?.detail || 'Failed to save'))
        .finally(() => setFollowupLoading(false))
    }).catch(() => {})
  }

  const openIntercept = () => {
    if (!selectedRecord) return
    apiClient.get<{ data: any; editable_24h?: boolean; submitted?: boolean }>(`/onboarding/client-payment/${selectedRecord.id}/intercept`).then((res) => {
      const d = res.data?.data || {}
      setInterceptEditable(res.data?.editable_24h ?? true)
      interceptForm.setFieldsValue({ last_remark_user: d.last_remark_user ?? '', usage_last_1_month: d.usage_last_1_month ?? '', contact_person: d.contact_person ?? '', contact_number: d.contact_number ?? '' })
      setInterceptDetails({
        last_remark_user: d.last_remark_user ?? null,
        usage_last_1_month: d.usage_last_1_month ?? null,
        contact_person: d.contact_person ?? null,
        contact_number: d.contact_number ?? null,
        tagged_user_id: d.tagged_user_id ?? null,
        tagged_user_name: d.tagged_user_name ?? null,
        tagged_user_email: d.tagged_user_email ?? null,
        tagged_user_2_id: d.tagged_user_2_id ?? null,
        tagged_user_2_name: d.tagged_user_2_name ?? null,
        tagged_user_2_email: d.tagged_user_2_email ?? null,
        payment_action_person: d.payment_action_person ?? null,
        payment_action_remarks: d.payment_action_remarks ?? null,
        payment_action_submitted_at: d.payment_action_submitted_at ?? null,
        payment_action_2_person: d.payment_action_2_person ?? null,
        payment_action_2_remarks: d.payment_action_2_remarks ?? null,
        payment_action_2_submitted_at: d.payment_action_2_submitted_at ?? null,
      })
      setInterceptModalOpen(true)
    }).catch(() => message.error('Could not load'))
  }

  const openInterceptTag = () => {
    if (!selectedRecord) return
    setInterceptTagModalOpen(true)
    setTagSelectedUserId(interceptDetails?.tagged_user_id ?? null)
    if (tagUsers.length > 0) return
    setTagLoading(true)
    apiClient
      .get<{ items: { id: string; full_name: string; email: string }[] }>('/users/options')
      .then((res) => setTagUsers(res.data?.items || []))
      .catch(() => setTagUsers([]))
      .finally(() => setTagLoading(false))
  }

  const saveInterceptTag = () => {
    if (!selectedRecord) return
    if (!tagSelectedUserId) {
      message.warning('Select a user to tag')
      return
    }
    const u = tagUsers.find((x) => x.id === tagSelectedUserId)
    if (!u) return
    const payload = {
      last_remark_user: interceptDetails?.last_remark_user ?? null,
      usage_last_1_month: interceptDetails?.usage_last_1_month ?? null,
      contact_person: interceptDetails?.contact_person ?? null,
      contact_number: interceptDetails?.contact_number ?? null,
      tagged_user_id: u.id,
      tagged_user_name: u.full_name,
      tagged_user_email: u.email,
    }
    setTagLoading(true)
    apiClient
      .post(`/onboarding/client-payment/${selectedRecord.id}/intercept`, { data: payload })
      .then(() => {
        message.success('Tagged user saved')
        setInterceptSubmitted(true)
        setInterceptDetails(payload)
        setInterceptTagModalOpen(false)
        loadDrawerData(selectedRecord)
      })
      .catch((e) => message.error(e?.response?.data?.detail || 'Failed to save tag'))
      .finally(() => setTagLoading(false))
  }

  const openInterceptTag2 = () => {
    if (!selectedRecord) return
    setInterceptTag2ModalOpen(true)
    setTag2SelectedUserId(interceptDetails?.tagged_user_2_id ?? null)
    if (tagUsers.length > 0) return
    setTagLoading(true)
    apiClient
      .get<{ items: { id: string; full_name: string; email: string }[] }>('/users/options')
      .then((res) => setTagUsers(res.data?.items || []))
      .catch(() => setTagUsers([]))
      .finally(() => setTagLoading(false))
  }

  const saveInterceptTag2 = () => {
    if (!selectedRecord) return
    if (!tag2SelectedUserId) {
      message.warning('Select a user to tag')
      return
    }
    setTagLoading(true)
    apiClient
      .post(`/onboarding/client-payment/${selectedRecord.id}/intercept/tag-2`, { data: { tagged_user_id: tag2SelectedUserId } })
      .then(() => {
        message.success('Tag 2 saved')
        setInterceptTag2ModalOpen(false)
        loadDrawerData(selectedRecord)
      })
      .catch((e) => message.error(e?.response?.data?.detail || 'Failed to save Tag 2'))
      .finally(() => setTagLoading(false))
  }

  const handleInterceptSubmit = () => {
    if (!selectedRecord) return
    interceptForm.validateFields().then((values) => {
      apiClient.post(`/onboarding/client-payment/${selectedRecord.id}/intercept`, { data: values }).then(() => {
        message.success('Intercept Requirements saved')
        setInterceptSubmitted(true)
        setInterceptModalOpen(false)
        loadDrawerData(selectedRecord)
      }).catch((e) => message.error(e?.response?.data?.detail || 'Failed to save'))
    }).catch(() => {})
  }

  const openDiscontinuation = () => {
    if (!selectedRecord) return
    apiClient.get<{ data: any }>(`/onboarding/client-payment/${selectedRecord.id}/discontinuation`).then((res) => {
      const d = res.data?.data || {}
      discontinuationForm.setFieldsValue({ mail_sent_to: d.mail_sent_to ?? '', mail_sent_on: d.mail_sent_on ? dayjs(d.mail_sent_on) : null, remarks: d.remarks ?? '' })
      setDiscontinuationDetails({
        mail_sent_to: d.mail_sent_to ?? null,
        mail_sent_on: d.mail_sent_on ?? null,
        remarks: d.remarks ?? null,
      })
      setDiscontinuationModalOpen(true)
    }).catch(() => message.error('Could not load'))
  }
  const handleDiscontinuationSubmit = () => {
    if (!selectedRecord) return
    discontinuationForm.validateFields().then((values) => {
      const data = { ...values, mail_sent_on: values.mail_sent_on ? (values.mail_sent_on as Dayjs).format('YYYY-MM-DD') : null }
      apiClient.post(`/onboarding/client-payment/${selectedRecord.id}/discontinuation`, { data }).then(() => {
        message.success('Discontinuation Mail saved')
        setDiscontinuationSubmitted(true)
        setDiscontinuationModalOpen(false)
        loadDrawerData(selectedRecord)
      }).catch((e) => message.error(e?.response?.data?.detail || 'Failed to save'))
    }).catch(() => {})
  }

  const openPaymRec = () => {
    if (!selectedRecord) return
    paymRecForm.setFieldsValue({
      party_name: selectedRecord.company_name ?? '',
      invoice_number: selectedRecord.invoice_number ?? '',
      amount: selectedRecord.invoice_amount ?? '',
      payment_date: null,
    })
    setPaymRecModalOpen(true)
  }
  const handlePaymRecSubmit = () => {
    if (!selectedRecord) return
    paymRecForm.validateFields().then((values) => {
      const data = { party_name: values.party_name, invoice_number: String(values.invoice_number || '').trim(), amount: Number(values.amount), payment_date: (values.payment_date as Dayjs).format('YYYY-MM-DD') }
      apiClient.post(`/onboarding/client-payment/${selectedRecord.id}/payment-receive`, { data }).then(() => {
        message.success('Payment Receive Details saved – invoice completed')
        setPaymRecModalOpen(false)
        setDetailOpen(false)
        setSelectedRecord(null)
        loadData()
      }).catch((e) => message.error(e?.response?.data?.detail || 'Failed to save'))
    }).catch(() => {})
  }

  const buildColumnFilters = (values: Array<string | number | null | undefined>) => {
    const uniq = Array.from(
      new Set(
        values
          .map((v) => (v === null || v === undefined || String(v).trim() === '' ? '—' : String(v)))
          .filter(Boolean),
      ),
    )
    return uniq.sort((a, b) => a.localeCompare(b)).map((v) => ({ text: v, value: v }))
  }

  const genreLabel = (v: string | null | undefined) => {
    const map: Record<string, string> = { M: 'Monthly', Q: 'Quarterly', HY: 'Half yearly', Y: 'Yearly' }
    return map[String(v || '')] || v || '—'
  }

  const columns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 170,
      render: (v: string) => (v ? dayjs(v).format('DD-MMM-YYYY HH:mm') : '—'),
      filters: buildColumnFilters(records.map((r) => (r.timestamp ? dayjs(r.timestamp).format('DD-MMM-YYYY HH:mm') : '—'))),
      filterSearch: true,
      filterMultiple: true,
      onFilter: (value: string | number | boolean, record: ClientPaymentRecord) =>
        (record.timestamp ? dayjs(record.timestamp).format('DD-MMM-YYYY HH:mm') : '—') === String(value),
    },
    {
      title: 'Reference',
      dataIndex: 'reference_no',
      key: 'reference_no',
      width: 130,
      render: (v: string | null | undefined) => v || '—',
      filters: buildColumnFilters(records.map((r) => r.reference_no || '—')),
      filterSearch: true,
      filterMultiple: true,
      onFilter: (value: string | number | boolean, record: ClientPaymentRecord) => (record.reference_no || '—') === String(value),
    },
    {
      title: 'Company Name',
      dataIndex: 'company_name',
      key: 'company_name',
      width: 200,
      filters: buildColumnFilters(records.map((r) => r.company_name || '—')),
      filterSearch: true,
      filterMultiple: true,
      onFilter: (value: string | number | boolean, record: ClientPaymentRecord) => (record.company_name || '—') === String(value),
    },
    {
      title: 'Invoice Date',
      dataIndex: 'invoice_date',
      key: 'invoice_date',
      width: 130,
      render: (v: string | null) => (v ? dayjs(v).format('DD-MMM-YYYY') : '—'),
      filters: buildColumnFilters(records.map((r) => (r.invoice_date ? dayjs(r.invoice_date).format('DD-MMM-YYYY') : '—'))),
      filterSearch: true,
      filterMultiple: true,
      onFilter: (value: string | number | boolean, record: ClientPaymentRecord) =>
        (record.invoice_date ? dayjs(record.invoice_date).format('DD-MMM-YYYY') : '—') === String(value),
    },
    {
      title: 'Invoice Amount',
      dataIndex: 'invoice_amount',
      key: 'invoice_amount',
      width: 130,
      filters: buildColumnFilters(records.map((r) => r.invoice_amount || '—')),
      filterSearch: true,
      filterMultiple: true,
      onFilter: (value: string | number | boolean, record: ClientPaymentRecord) => (record.invoice_amount || '—') === String(value),
    },
    {
      title: 'Invoice Number',
      dataIndex: 'invoice_number',
      key: 'invoice_number',
      width: 130,
      filters: buildColumnFilters(records.map((r) => r.invoice_number || '—')),
      filterSearch: true,
      filterMultiple: true,
      onFilter: (value: string | number | boolean, record: ClientPaymentRecord) => (record.invoice_number || '—') === String(value),
    },
    {
      title: 'Stage',
      dataIndex: 'stage',
      key: 'stage',
      width: 160,
      render: (v: string | null | undefined) => v || '—',
      filters: buildColumnFilters(records.map((r) => r.stage || '—')),
      filterSearch: true,
      filterMultiple: true,
      onFilter: (value: string | number | boolean, record: ClientPaymentRecord) => (record.stage || '—') === String(value),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (v: string | null | undefined) => v || 'Pending',
      filters: buildColumnFilters(records.map((r) => r.status || 'Pending')),
      filterSearch: true,
      filterMultiple: true,
      onFilter: (value: string | number | boolean, record: ClientPaymentRecord) => (record.status || 'Pending') === String(value),
    },
    {
      title: 'Aging (days)',
      dataIndex: 'aging_days',
      key: 'aging_days',
      width: 120,
      render: (v: number | null | undefined) => (typeof v === 'number' ? v : 0),
      filters: buildColumnFilters(records.map((r) => (typeof r.aging_days === 'number' ? r.aging_days : 0))),
      filterSearch: true,
      filterMultiple: true,
      onFilter: (value: string | number | boolean, record: ClientPaymentRecord) =>
        String(typeof record.aging_days === 'number' ? record.aging_days : 0) === String(value),
    },
    {
      title: 'Genre',
      dataIndex: 'genre',
      key: 'genre',
      width: 120,
      render: (v: string) => genreLabel(v),
      filters: buildColumnFilters(records.map((r) => genreLabel(r.genre))),
      filterSearch: true,
      filterMultiple: true,
      onFilter: (value: string | number | boolean, record: ClientPaymentRecord) => genreLabel(record.genre) === String(value),
    },
  ]

  const exportColumns: ExportColumn<ClientPaymentRecord>[] = [
    { key: 'timestamp', label: 'Timestamp', getValue: (r) => (r.timestamp ? dayjs(r.timestamp).format('DD-MMM-YYYY HH:mm') : '—') },
    { key: 'reference_no', label: 'Reference', getValue: (r) => r.reference_no || '—' },
    { key: 'company_name', label: 'Company Name', getValue: (r) => r.company_name || '—' },
    { key: 'invoice_date', label: 'Invoice Date', getValue: (r) => (r.invoice_date ? dayjs(r.invoice_date).format('DD-MMM-YYYY') : '—') },
    { key: 'invoice_amount', label: 'Invoice Amount', getValue: (r) => r.invoice_amount || '—' },
    { key: 'invoice_number', label: 'Invoice Number', getValue: (r) => r.invoice_number || '—' },
    { key: 'stage', label: 'Stage', getValue: (r) => r.stage || '—' },
    { key: 'status', label: 'Status', getValue: (r) => r.status || 'Pending' },
    { key: 'aging_days', label: 'Aging (days)', getValue: (r) => (typeof r.aging_days === 'number' ? r.aging_days : 0) },
    { key: 'genre', label: 'Genre', getValue: (r) => genreLabel(r.genre) },
  ]
  const exportOptions = exportColumns.map((c) => ({ label: c.label, value: c.key }))

  const openExport = () => {
    setSelectedExportColumns(exportColumns.map((c) => c.key))
    setExportOpen(true)
  }

  const handleExport = () => {
    const cols = exportColumns.filter((c) => selectedExportColumns.includes(c.key))
    if (!cols.length) {
      message.warning('Select at least one column to export')
      return
    }
    const sectionLabel = completedSection ? completedSection : 'payment-management'
    exportRowsToCsv({
      filename: `client-payment-${sectionLabel}-${dayjs().format('YYYYMMDD-HHmm')}.csv`,
      columns: cols,
      rows: filteredRecords,
    })
    setExportOpen(false)
    message.success('Export started')
  }

  const pageTitle = completedSection ? `Client Payment – ${completedSection}` : 'Raised Invoices'
  const dayOfMonth = new Date().getDate()
  const showInterceptByDate = dayOfMonth >= 20

  /** Hide "Tag" after Tag user (Intercept Requirements) has been saved once. */
  const interceptHasTaggedUser = !!(
    interceptDetails?.tagged_user_id ||
    interceptDetails?.tagged_user_name ||
    interceptDetails?.tagged_user_email
  )
  const interceptHasTaggedUser2 = !!(
    interceptDetails?.tagged_user_2_id ||
    interceptDetails?.tagged_user_2_name ||
    interceptDetails?.tagged_user_2_email
  )
  const showClientPaymentT2Button =
    !!user &&
    interceptHasTaggedUser &&
    !!interceptDetails?.payment_action_submitted_at &&
    !interceptHasTaggedUser2
  const showDiscontinuationByDate = dayOfMonth >= 25
  const isCompleted = selectedRecord?.status === 'Completed'
  /** Core "Add Invoice" fields: editable within 30 days of row Timestamp (Payment Management / open list only). */
  const daysSinceCreated = selectedRecord?.timestamp ? dayjs().diff(dayjs(selectedRecord.timestamp), 'day') : 999
  const canEditRaisedInvoiceCore =
    isOpenList && !!selectedRecord && !isCompleted && daysSinceCreated >= 0 && daysSinceCreated <= 30

  const companyFilterNorm = companyNameFilter.trim().toLowerCase()
  const filteredRecords = useMemo(() => {
    if (!companyFilterNorm) return records
    return records.filter((r) => (r.company_name || '').toLowerCase().includes(companyFilterNorm))
  }, [records, companyFilterNorm])

  return (
    <div style={{ padding: 24 }}>
      <Space
        style={{ marginBottom: 24, width: '100%', justifyContent: 'space-between', alignItems: 'center' }}
        wrap
        size="middle"
      >
        <Title level={4} style={{ margin: 0 }}>
          {pageTitle}
        </Title>
        <Space wrap align="center" size="middle">
          <Input.Search
            allowClear
            placeholder="Search company name"
            style={{ width: 'min(100vw - 48px, 320px)', minWidth: 200 }}
            value={companyNameFilter}
            onChange={(e) => setCompanyNameFilter(e.target.value)}
            onSearch={(v) => setCompanyNameFilter(v)}
            aria-label="Filter raised invoices by company name"
          />
          {companyFilterNorm ? (
            <Text type="secondary">
              {filteredRecords.length} of {records.length} rows
            </Text>
          ) : null}
          {isOpenList && (
            <Button type="primary" onClick={openModal}>
              Add Invoice
            </Button>
          )}
          <Button onClick={openExport}>Export</Button>
        </Space>
      </Space>

      <Card>
        <TableWithSkeletonLoading loading={loading} columns={9} rows={12}>
          <Table
            dataSource={filteredRecords}
            columns={columns}
            rowKey="id"
            loading={false}
            scroll={{ x: 900 }}
            pagination={{ pageSize: 20, showSizeChanger: true }}
            onRow={(record) => ({
              onClick: () => {
                setSelectedRecord(record)
                setDetailOpen(true)
                loadDrawerData(record)
              },
              style: { cursor: 'pointer' },
            })}
          />
        </TableWithSkeletonLoading>
      </Card>

      <Drawer
        title={selectedRecord ? `${selectedRecord.reference_no ?? 'Invoice'} – ${selectedRecord.company_name}` : 'Invoice Details'}
        open={detailOpen}
        width={520}
        onClose={() => {
          setDetailOpen(false)
          setSelectedRecord(null)
        }}
      >
        {selectedRecord && (
          <>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Timestamp">
                {selectedRecord.timestamp ? dayjs(selectedRecord.timestamp).format('DD-MMM-YYYY HH:mm') : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Reference">{selectedRecord.reference_no || '—'}</Descriptions.Item>
              <Descriptions.Item label="Company Name">{selectedRecord.company_name || '—'}</Descriptions.Item>
              <Descriptions.Item label="Invoice Date">
                {selectedRecord.invoice_date ? dayjs(selectedRecord.invoice_date).format('DD-MMM-YYYY') : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Invoice Amount">{selectedRecord.invoice_amount || '—'}</Descriptions.Item>
              <Descriptions.Item label="Invoice Number">{selectedRecord.invoice_number || '—'}</Descriptions.Item>
              <Descriptions.Item label="Genre">{selectedRecord.genre || '—'}</Descriptions.Item>
              <Descriptions.Item label="Stage">{selectedRecord.stage || '—'}</Descriptions.Item>
              <Descriptions.Item label="Status">{selectedRecord.status || 'Pending'}</Descriptions.Item>
              <Descriptions.Item label="Aging (days)">
                {typeof selectedRecord.aging_days === 'number' ? selectedRecord.aging_days : 0}
              </Descriptions.Item>
            </Descriptions>
            {isOpenList && canEditRaisedInvoiceCore && (
              <Button type="default" icon={<EditOutlined />} onClick={openEditInvoiceModal} style={{ marginTop: 12 }}>
                Edit
              </Button>
            )}
            {isOpenList && !canEditRaisedInvoiceCore && !isCompleted && (
              <Text type="secondary" style={{ display: 'block', marginTop: 12 }}>
                Company and invoice fields can be edited within 30 days of Timestamp (record creation).
              </Text>
            )}
            <Divider>Invoice Sent details & Follow up</Divider>
            {drawerStatusLoading ? (
              <div style={{ padding: 8, color: '#888' }}>Loading…</div>
            ) : (
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {sentSubmitted ? (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                      <Space>
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        <span>Invoice Sent details</span>
                      </Space>
                      {sentEditable ? (
                        <Button type="link" size="small" icon={<EditOutlined />} onClick={openSentDetails}>
                          Edit
                        </Button>
                      ) : (
                        <Button type="link" size="small" onClick={openSentDetails}>View</Button>
                      )}
                    </div>
                    <Descriptions column={1} size="small" bordered>
                      <Descriptions.Item label="Email Sent">{sentSummary ? (sentSummary.email_sent ? 'Yes' : 'No') : '—'}</Descriptions.Item>
                      <Descriptions.Item label="Courier Sent">{sentSummary ? (sentSummary.courier_sent ? 'Yes' : 'No') : '—'}</Descriptions.Item>
                      <Descriptions.Item label="WhatsApp Sent">{sentSummary ? (sentSummary.whatsapp_sent ? 'Yes' : 'No') : '—'}</Descriptions.Item>
                      <Descriptions.Item label="Email">{sentDetails?.email || '—'}</Descriptions.Item>
                      <Descriptions.Item label="Tracking details">{sentDetails?.tracking_details || '—'}</Descriptions.Item>
                      <Descriptions.Item label="WhatsApp Number">{sentDetails?.whatsapp_number || '—'}</Descriptions.Item>
                    </Descriptions>
                  </div>
                ) : (
                  <Button type="primary" block icon={<FormOutlined />} onClick={openSentDetails} size="large">
                    Invoice Sent details
                  </Button>
                )}
                {sentSubmitted && !isCompleted && (
                  <Button type="primary" block icon={<FormOutlined />} onClick={openPaymRec} size="large" style={{ marginBottom: 16 }}>
                    Paym-Rec
                  </Button>
                )}
                {sentSubmitted && !isCompleted && followupsItems.map((fu) => (
                  <div key={fu.followup_no} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                      <Space>
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        <span>Follow up {fu.followup_no}</span>
                      </Space>
                      <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openFollowup(fu.followup_no)}>Edit</Button>
                    </div>
                    <Descriptions column={1} size="small" bordered>
                      <Descriptions.Item label="Contact Person">{fu.contact_person || '—'}</Descriptions.Item>
                      <Descriptions.Item label="Mail Sent">{fu.mail_sent ? 'Yes' : 'No'}</Descriptions.Item>
                      <Descriptions.Item label="WhatsApp Sent">{fu.whatsapp_sent ? 'Yes' : 'No'}</Descriptions.Item>
                      <Descriptions.Item label="Remarks">{fu.remarks || '—'}</Descriptions.Item>
                    </Descriptions>
                  </div>
                ))}
                {sentSubmitted && !isCompleted && nextFollowupNo <= 10 && (
                  <Button type="primary" block icon={<FormOutlined />} onClick={() => openFollowup(nextFollowupNo)} size="large" style={{ marginBottom: 16 }}>
                    Follow up {nextFollowupNo}
                  </Button>
                )}
                {sentSubmitted && !isCompleted && (nextFollowupNo > 3 || showInterceptByDate) && (
                  <>
                    {interceptSubmitted ? (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <Space><CheckCircleOutlined style={{ color: '#52c41a' }} /><span>Intercept Requirements</span></Space>
                          <Space size={8}>
                            {!interceptHasTaggedUser && (
                              <Button size="small" onClick={openInterceptTag}>
                                Tag
                              </Button>
                            )}
                            {interceptEditable ? (
                              <Button type="link" size="small" icon={<EditOutlined />} onClick={openIntercept}>Edit</Button>
                            ) : (
                              <Button type="link" size="small" onClick={openIntercept}>View</Button>
                            )}
                          </Space>
                        </div>
                        <Descriptions column={1} size="small" bordered>
                          <Descriptions.Item label="Last Remark of User">{interceptDetails?.last_remark_user || '—'}</Descriptions.Item>
                          <Descriptions.Item label="Usage Details (Last 1 Month)">{interceptDetails?.usage_last_1_month || '—'}</Descriptions.Item>
                          <Descriptions.Item label="Contact Person">{interceptDetails?.contact_person || '—'}</Descriptions.Item>
                          <Descriptions.Item label="Contact Number">{interceptDetails?.contact_number || '—'}</Descriptions.Item>
                          <Descriptions.Item label="Tag">{interceptDetails?.tagged_user_name || interceptDetails?.tagged_user_email || '—'}</Descriptions.Item>
                        </Descriptions>
                      </div>
                    ) : (
                      <Button type="default" block icon={<FormOutlined />} onClick={openIntercept} size="large" style={{ marginBottom: 16 }}>Intercept Requirements</Button>
                    )}
                    {interceptSubmitted &&
                      !!(interceptDetails?.tagged_user_id || interceptDetails?.tagged_user_name || interceptDetails?.tagged_user_email) && (
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                            <Space>
                              <CheckCircleOutlined style={{ color: '#52c41a' }} />
                              <span>Client Payment</span>
                            </Space>
                            {showClientPaymentT2Button && (
                              <Tooltip title="Assign a second user (after first Client Payment action)">
                                <Button size="small" type="default" onClick={openInterceptTag2}>
                                  T 2
                                </Button>
                              </Tooltip>
                            )}
                          </div>
                          <Descriptions column={1} size="small" bordered>
                            <Descriptions.Item label="Tag (user)">
                              {interceptDetails?.tagged_user_name || interceptDetails?.tagged_user_email || '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Person">{interceptDetails?.payment_action_person || '—'}</Descriptions.Item>
                            <Descriptions.Item label="Remarks">{interceptDetails?.payment_action_remarks || '—'}</Descriptions.Item>
                            {!interceptDetails?.payment_action_submitted_at && (
                              <Descriptions.Item label=" ">
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  Person &amp; Remarks appear here after someone submits <b>Payment Action</b> on the Support Dashboard (Master Admin or the tagged user).
                                </Text>
                              </Descriptions.Item>
                            )}
                            {(interceptDetails?.tagged_user_2_name || interceptDetails?.tagged_user_2_email) && (
                              <Descriptions.Item label="Tag 2 (user)">
                                {interceptDetails?.tagged_user_2_name || interceptDetails?.tagged_user_2_email || '—'}
                              </Descriptions.Item>
                            )}
                            {interceptHasTaggedUser2 && (
                              <>
                                <Descriptions.Item label="Person (T2)">
                                  {interceptDetails?.payment_action_2_person || '—'}
                                </Descriptions.Item>
                                <Descriptions.Item label="Remarks (T2)">
                                  {interceptDetails?.payment_action_2_remarks || '—'}
                                </Descriptions.Item>
                                <Descriptions.Item label="Submitted (T2)">
                                  {interceptDetails?.payment_action_2_submitted_at
                                    ? dayjs(interceptDetails.payment_action_2_submitted_at).format('DD-MMM-YYYY HH:mm')
                                    : '—'}
                                </Descriptions.Item>
                              </>
                            )}
                          </Descriptions>
                        </div>
                      )}
                  </>
                )}
                {sentSubmitted && !isCompleted && (nextFollowupNo > 3 || showDiscontinuationByDate) && (
                  discontinuationSubmitted ? (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Space><CheckCircleOutlined style={{ color: '#52c41a' }} /><span>Discontinuation Mail</span></Space>
                        <Button type="link" size="small" onClick={openDiscontinuation}>View</Button>
                      </div>
                      <Descriptions column={1} size="small" bordered>
                        <Descriptions.Item label="Mail Sent To">{discontinuationDetails?.mail_sent_to || '—'}</Descriptions.Item>
                        <Descriptions.Item label="Mail Sent On">{discontinuationDetails?.mail_sent_on ? dayjs(discontinuationDetails.mail_sent_on).format('DD-MMM-YYYY') : '—'}</Descriptions.Item>
                        <Descriptions.Item label="Remarks">{discontinuationDetails?.remarks || '—'}</Descriptions.Item>
                      </Descriptions>
                    </div>
                  ) : (
                    <Button type="default" block icon={<FormOutlined />} onClick={openDiscontinuation} size="large" style={{ marginBottom: 16 }}>Discontinuation Mail</Button>
                  )
                )}
              </Space>
            )}
          </>
        )}
      </Drawer>

      <Modal
        title="Export Client Payment"
        open={exportOpen}
        onCancel={() => setExportOpen(false)}
        onOk={handleExport}
        okText="Export"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text type="secondary">Select columns to include in export.</Text>
          <Checkbox.Group
            style={{ width: '100%' }}
            value={selectedExportColumns}
            options={exportOptions}
            onChange={(vals) => setSelectedExportColumns(vals as string[])}
          />
        </Space>
      </Modal>

      <Modal
        title="Invoice Sent details"
        open={sentModalOpen}
        onCancel={() => setSentModalOpen(false)}
        footer={null}
        destroyOnClose
        width={520}
      >
        <Form
          form={sentForm}
          layout="vertical"
          style={{ marginTop: 16 }}
          disabled={!sentEditable}
          onFinish={handleSentSubmit}
        >
          <Form.Item
            name="email_sent"
            label="Email Sent"
            initialValue={false}
            rules={[{ required: true, message: 'Please select Email Sent' }]}
          >
            <Select
              options={[
                { label: 'No', value: false },
                { label: 'Yes', value: true },
              ]}
            />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.email_sent !== curr.email_sent}>
            {({ getFieldValue }) =>
              getFieldValue('email_sent') ? (
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    {
                      validator(_, value) {
                        const t = String(value || '').trim()
                        if (!t) return Promise.resolve()
                        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                        if (!re.test(t)) return Promise.reject(new Error('Enter a valid email'))
                        return Promise.resolve()
                      },
                    },
                  ]}
                >
                  <Input placeholder="name@example.com" />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item
            name="courier_sent"
            label="Courier Sent"
            initialValue={false}
            rules={[{ required: true, message: 'Please select Courier Sent' }]}
          >
            <Select
              options={[
                { label: 'No', value: false },
                { label: 'Yes', value: true },
              ]}
            />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.courier_sent !== curr.courier_sent}>
            {({ getFieldValue }) =>
              getFieldValue('courier_sent') ? (
                <Form.Item
                  name="tracking_details"
                  label="Tracking details"
                  rules={[
                    {
                      validator(_, value) {
                        const t = String(value || '').trim()
                        if (!t) return Promise.resolve()
                        if (!/^[0-9A-Za-z-]+$/.test(t)) {
                          return Promise.reject(new Error('Use only numbers/letters/-'))
                        }
                        return Promise.resolve()
                      },
                    },
                  ]}
                >
                  <Input placeholder="Tracking number" />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item
            name="whatsapp_sent"
            label="WhatsApp Sent"
            initialValue={false}
            rules={[{ required: true, message: 'Please select WhatsApp Sent' }]}
          >
            <Select
              options={[
                { label: 'No', value: false },
                { label: 'Yes', value: true },
              ]}
            />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.whatsapp_sent !== curr.whatsapp_sent}>
            {({ getFieldValue }) =>
              getFieldValue('whatsapp_sent') ? (
                <Form.Item
                  name="whatsapp_number"
                  label="WhatsApp Number"
                  rules={[
                    {
                      validator(_, value) {
                        const s = String(value || '').trim()
                        if (!s) return Promise.resolve()
                        if (!/^\d{10}$/.test(s)) return Promise.reject(new Error('Must be exactly 10 digits'))
                        return Promise.resolve()
                      },
                    },
                  ]}
                >
                  <Input maxLength={10} placeholder="10 digit number" />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item
            name="invoice_number"
            label="Invoice Number"
          >
            <Input placeholder="Digits only" disabled />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={sentLoading} disabled={!sentEditable}>
                Save
              </Button>
              <Button onClick={() => setSentModalOpen(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Follow up ${currentFollowupNo}`}
        open={followupModalOpen}
        onCancel={() => setFollowupModalOpen(false)}
        footer={null}
        destroyOnClose
        width={520}
      >
        <Form form={followupForm} layout="vertical" style={{ marginTop: 16 }} disabled={!followupEditable} onFinish={handleFollowupSubmit}>
          <Form.Item name="contact_person" label="Contact Person"><Input placeholder="Enter contact person" /></Form.Item>
          <Form.Item name="remarks" label="Remarks"><Input.TextArea rows={3} placeholder="Enter remarks" /></Form.Item>
          <Form.Item name="mail_sent" label="Mail Sent" initialValue={false}><Select options={[{ label: 'No', value: false }, { label: 'Yes', value: true }]} /></Form.Item>
          <Form.Item name="whatsapp_sent" label="WhatsApp Sent" initialValue={false}><Select options={[{ label: 'No', value: false }, { label: 'Yes', value: true }]} /></Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={followupLoading} disabled={!followupEditable}>Save</Button>
              <Button onClick={() => setFollowupModalOpen(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Intercept Requirements" open={interceptModalOpen} onCancel={() => setInterceptModalOpen(false)} footer={null} destroyOnClose width={520}>
        <Form form={interceptForm} layout="vertical" style={{ marginTop: 16 }} onFinish={handleInterceptSubmit} disabled={!interceptEditable}>
          <Form.Item name="last_remark_user" label="Last Remark of User"><Input.TextArea rows={2} placeholder="Last remark of user" /></Form.Item>
          <Form.Item name="usage_last_1_month" label="Usage Details of Last 1 Month"><Input.TextArea rows={2} placeholder="Usage details" /></Form.Item>
          <Form.Item name="contact_person" label="Contact Person"><Input placeholder="Contact person" /></Form.Item>
          <Form.Item name="contact_number" label="Contact Number"><Input placeholder="Contact number" maxLength={15} /></Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              {interceptEditable && <Button type="primary" htmlType="submit">Save</Button>}
              <Button onClick={() => setInterceptModalOpen(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Tag user (Intercept Requirements)"
        open={interceptTagModalOpen}
        onCancel={() => setInterceptTagModalOpen(false)}
        onOk={saveInterceptTag}
        okText="Save"
        confirmLoading={tagLoading}
        destroyOnClose
        width={520}
      >
        <div style={{ marginTop: 12 }}>
          <Select
            showSearch
            placeholder="Select registered user"
            loading={tagLoading}
            value={tagSelectedUserId ?? undefined}
            onChange={(v) => setTagSelectedUserId(v)}
            options={tagUsers.map((u) => ({
              label: `${u.full_name || '(No name)'}${u.email ? ` — ${u.email}` : ''}`,
              value: u.id,
            }))}
            filterOption={(input, option) =>
              String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ marginTop: 12, color: '#666', fontSize: 12 }}>
          This will appear in Master Admin dashboard under <b>Payment Action</b>.
        </div>
      </Modal>

      <Modal
        title="Tag user (T 2 — Client Payment)"
        open={interceptTag2ModalOpen}
        onCancel={() => setInterceptTag2ModalOpen(false)}
        onOk={saveInterceptTag2}
        okText="Save"
        okButtonProps={{ loading: tagLoading }}
        confirmLoading={tagLoading}
        destroyOnClose
        width={520}
      >
        <div style={{ marginTop: 12 }}>
          <Select
            showSearch
            placeholder="Select registered user"
            loading={tagLoading}
            value={tag2SelectedUserId ?? undefined}
            onChange={(v) => setTag2SelectedUserId(v)}
            options={tagUsers.map((u) => ({
              label: `${u.full_name || '(No name)'}${u.email ? ` — ${u.email}` : ''}`,
              value: u.id,
            }))}
            filterOption={(input, option) => String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ marginTop: 12, color: '#666', fontSize: 12 }}>
          Available after the first <b>Client Payment</b> action (Person / Remarks). Any logged-in user can assign Tag 2.
        </div>
      </Modal>

      <Modal title="Discontinuation Mail" open={discontinuationModalOpen} onCancel={() => setDiscontinuationModalOpen(false)} footer={null} destroyOnClose width={520}>
        <Form form={discontinuationForm} layout="vertical" style={{ marginTop: 16 }} onFinish={handleDiscontinuationSubmit}>
          <Form.Item name="mail_sent_to" label="Mail Sent To" rules={[{ required: true, message: 'Required' }]}><Input placeholder="Email or recipient" /></Form.Item>
          <Form.Item name="mail_sent_on" label="Mail Sent On (Date)" rules={[{ required: true, message: 'Required' }]}><DatePicker style={{ width: '100%' }} format="DD-MMM-YYYY" /></Form.Item>
          <Form.Item name="remarks" label="Remarks"><Input.TextArea rows={2} placeholder="Remarks" /></Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button type="primary" htmlType="submit">Save</Button>
              <Button onClick={() => setDiscontinuationModalOpen(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Payment Receive Details (Paym-Rec)" open={paymRecModalOpen} onCancel={() => setPaymRecModalOpen(false)} footer={null} destroyOnClose width={520}>
        <Form form={paymRecForm} layout="vertical" style={{ marginTop: 16 }} onFinish={handlePaymRecSubmit}>
          <Form.Item name="party_name" label="Party Name" rules={[{ required: true, message: 'Required' }]}>
            <Input placeholder="Auto from company name" disabled />
          </Form.Item>
          <Form.Item name="invoice_number" label="Invoice Number"><Input placeholder="Auto from invoice" disabled /></Form.Item>
          <Form.Item name="amount" label="Amount" rules={[{ required: true, message: 'Required' }]}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
          <Form.Item name="payment_date" label="Date of Payment" rules={[{ required: true, message: 'Required' }]}><DatePicker style={{ width: '100%' }} format="DD-MMM-YYYY" /></Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button type="primary" htmlType="submit">Save</Button>
              <Button onClick={() => setPaymRecModalOpen(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Edit Raised Invoice"
        open={editInvoiceModalOpen}
        onCancel={() => {
          setEditInvoiceModalOpen(false)
          editInvoiceForm.resetFields()
        }}
        footer={null}
        destroyOnClose
        width={520}
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
          Changes are allowed for 30 days after the original Timestamp, and only until payment is received.
        </Text>
        <Form form={editInvoiceForm} layout="vertical" style={{ marginTop: 8 }} onFinish={handleEditInvoiceSubmit}>
          <Form.Item
            name="company_name"
            label="Company Name"
            rules={[{ required: true, message: 'Company Name is required' }]}
          >
            <Select
              showSearch
              loading={companiesLoading}
              placeholder={companiesLoading ? 'Loading companies…' : 'Select company'}
              options={companies.map((c) => ({ label: c.name, value: c.name }))}
              filterOption={(input, option) =>
                (option?.label as string).toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>

          <Form.Item name="invoice_date" label="Invoice Date" rules={[{ required: true, message: 'Invoice Date is required' }]}>
            <DatePicker style={{ width: '100%' }} format="DD-MMM-YYYY" />
          </Form.Item>

          <Form.Item
            name="invoice_amount"
            label="Invoice Amount"
            rules={[
              { required: true, message: 'Invoice Amount is required' },
              {
                validator: (_, value) => {
                  if (value === undefined || value === null || value === '') return Promise.resolve()
                  const s = String(value).trim()
                  if (!/^\d+$/.test(s)) return Promise.reject(new Error('Amount must be digits only'))
                  if (s.length > 11) return Promise.reject(new Error('Max 11 digits allowed'))
                  return Promise.resolve()
                },
              },
            ]}
          >
            <InputNumber style={{ width: '100%' }} maxLength={11} />
          </Form.Item>

          <Form.Item
            name="invoice_number"
            label="Invoice Number"
            rules={[
              { required: true, message: 'Invoice Number is required' },
              { max: 50, message: 'Max 50 characters allowed' },
            ]}
          >
            <Input maxLength={50} placeholder="Invoice number (alphanumeric / special characters allowed)" />
          </Form.Item>

          <Form.Item
            name="genre"
            label="Genre"
            rules={[{ required: true, message: 'Genre is required' }]}
          >
            <Select placeholder="Select frequency" options={GENRE_OPTIONS} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={editInvoiceSubmitLoading}>
                Save
              </Button>
              <Button
                onClick={() => {
                  setEditInvoiceModalOpen(false)
                  editInvoiceForm.resetFields()
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Add Raised Invoice"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnClose
        width={520}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }} onFinish={handleSubmit}>
          <Form.Item
            name="company_name"
            label="Company Name"
            rules={[{ required: true, message: 'Company Name is required' }]}
          >
            <Select
              showSearch
              loading={companiesLoading}
              placeholder={companiesLoading ? 'Loading companies…' : 'Select company'}
              options={companies.map((c) => ({ label: c.name, value: c.name }))}
              filterOption={(input, option) =>
                (option?.label as string).toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>

          <Form.Item name="invoice_date" label="Invoice Date" rules={[{ required: true, message: 'Invoice Date is required' }]}>
            <DatePicker style={{ width: '100%' }} format="DD-MMM-YYYY" />
          </Form.Item>

          <Form.Item
            name="invoice_amount"
            label="Invoice Amount"
            rules={[
              { required: true, message: 'Invoice Amount is required' },
              {
                validator: (_, value) => {
                  if (value === undefined || value === null || value === '') return Promise.resolve()
                  const s = String(value).trim()
                  if (!/^\d+$/.test(s)) return Promise.reject(new Error('Amount must be digits only'))
                  if (s.length > 11) return Promise.reject(new Error('Max 11 digits allowed'))
                  return Promise.resolve()
                },
              },
            ]}
          >
            <InputNumber style={{ width: '100%' }} maxLength={11} />
          </Form.Item>

          <Form.Item
            name="invoice_number"
            label="Invoice Number"
            rules={[
              { required: true, message: 'Invoice Number is required' },
              { max: 50, message: 'Max 50 characters allowed' },
            ]}
          >
            <Input maxLength={50} placeholder="Invoice number (alphanumeric / special characters allowed)" />
          </Form.Item>

          <Form.Item
            name="genre"
            label="Genre"
            rules={[{ required: true, message: 'Genre is required' }]}
          >
            <Select placeholder="Select frequency" options={GENRE_OPTIONS} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitLoading}>
                Save
              </Button>
              <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ClientPaymentPage

