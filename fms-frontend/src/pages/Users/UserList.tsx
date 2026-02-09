import { useState, useEffect } from 'react'
import {
  Table,
  Card,
  Typography,
  Tag,
  Input,
  Space,
  Dropdown,
  Button,
  Modal,
  Form,
  Select,
  Switch,
  Checkbox,
  message,
} from 'antd'
import { SearchOutlined, MoreOutlined, EditOutlined, StopOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { usersApi } from '../../api/users'
import type { User } from '../../types/auth'
import type { SectionPermission, RoleOption } from '../../api/users'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { PrintExport } from '../../components/common/PrintExport'
import { formatDate } from '../../utils/helpers'
import { useRole } from '../../hooks/useRole'
import { ROLE_DISPLAY_NAMES, SECTION_LABELS } from '../../utils/constants'

const { Title } = Typography

const SECTION_KEYS = Object.keys(SECTION_LABELS)

export const UserList = () => {
  const { isMasterAdmin } = useRole()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [roles, setRoles] = useState<RoleOption[]>([])
  const [sectionPermissions, setSectionPermissions] = useState<SectionPermission[]>([])
  const [form] = Form.useForm()
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [page, pageSize, search])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await usersApi.list({
        page,
        limit: pageSize,
        ...(search && { search }),
      })
      if (response && response.data !== undefined) {
        const list = Array.isArray(response.data) ? response.data : (response as any).data?.data ?? []
        const totalCount = typeof response.total === 'number' ? response.total : (response as any).total ?? 0
        setUsers(list)
        setTotal(totalCount)
      }
    } catch (error: any) {
      console.error('Failed to fetch users:', error)
      const status = error?.response?.status
      const detail = error?.response?.data?.detail
      if (status === 403 || (typeof detail === 'string' && detail.toLowerCase().includes('permission'))) {
        message.warning('Only Admin or Master Admin can view the user list.')
      } else {
        message.error('Failed to load users. Check that you are Admin or Master Admin.')
      }
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = async (user: User) => {
    setSelectedUser(user)
    setEditModalOpen(true)
    const userWithExtra = user as User & { display_name?: string; role_id?: string }
    form.setFieldsValue({
      full_name: user.full_name,
      display_name: userWithExtra.display_name ?? user.full_name,
      is_active: user.is_active,
      role_id: userWithExtra.role_id,
    })
    try {
      const [rolesRes, permRes] = await Promise.all([
        usersApi.listRoles(),
        usersApi.getSectionPermissions(user.id),
      ])
      if (rolesRes?.data) setRoles(rolesRes.data)
      const perms = permRes?.data ?? []
      setSectionPermissions(perms)
      const permissionsInitial = SECTION_KEYS.map((key) => {
        const p = perms.find((x) => x.section_key === key)
        return {
          section_key: key,
          can_view: p?.can_view ?? true,
          can_edit: p?.can_edit ?? false,
        }
      })
      form.setFieldsValue({
        full_name: user.full_name,
        display_name: userWithExtra.display_name ?? user.full_name,
        is_active: user.is_active,
        role_id: userWithExtra.role_id,
        permissions: permissionsInitial,
      })
    } catch (e) {
      console.error(e)
      if (roles.length === 0) {
        const rolesRes = await usersApi.listRoles()
        if (rolesRes?.data) setRoles(rolesRes.data)
      }
      form.setFieldsValue({
        permissions: SECTION_KEYS.map((key) => ({
          section_key: key,
          can_view: true,
          can_edit: false,
        })),
      })
    }
  }

  const openDeactivateModal = (user: User) => {
    setSelectedUser(user)
    setDeactivateModalOpen(true)
  }

  const handleEditSave = async () => {
    if (!selectedUser) return
    try {
      await form.validateFields()
      setSaving(true)
      const { full_name, display_name, role_id, is_active, permissions } = form.getFieldsValue()
      await usersApi.update(selectedUser.id, {
        full_name: full_name ?? selectedUser.full_name,
        display_name: display_name ?? (selectedUser as User & { display_name?: string }).display_name,
        ...(role_id && { role_id }),
        is_active: is_active ?? selectedUser.is_active,
      })
      if (Array.isArray(permissions) && permissions.length > 0) {
        await usersApi.updateSectionPermissions(
          selectedUser.id,
          permissions.map((p: SectionPermission) => ({
            section_key: p.section_key,
            can_view: !!p.can_view,
            can_edit: !!p.can_edit,
          }))
        )
      }
      message.success('User updated')
      setEditModalOpen(false)
      setSelectedUser(null)
      fetchUsers()
    } catch (e) {
      message.error((e as Error).message || 'Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async () => {
    if (!selectedUser) return
    try {
      setSaving(true)
      await usersApi.update(selectedUser.id, { is_active: false })
      message.success('User deactivated')
      setDeactivateModalOpen(false)
      setSelectedUser(null)
      fetchUsers()
    } catch (e) {
      message.error((e as Error).message || 'Failed to deactivate user')
    } finally {
      setSaving(false)
    }
  }

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      user: 'blue',
      admin: 'orange',
      master_admin: 'red',
      approver: 'purple',
    }
    return colors[role] || 'default'
  }

  const getRoleDisplayName = (role: string) => ROLE_DISPLAY_NAMES[role] || role

  const actionMenuItems = (user: User): MenuProps['items'] => {
    if (!isMasterAdmin) return []
    return [
      {
        key: 'edit',
        icon: <EditOutlined />,
        label: 'Edit',
        onClick: () => openEditModal(user),
      },
      {
        key: 'deactivate',
        icon: <StopOutlined />,
        label: 'Deactivate User',
        onClick: () => openDeactivateModal(user),
        disabled: !user.is_active,
      },
    ]
  }

  const columns = [
    {
      title: 'Name',
      dataIndex: 'full_name',
      key: 'full_name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'User ID name',
      dataIndex: 'display_name',
      key: 'display_name',
      render: (_: unknown, record: User & { display_name?: string }) =>
        record.display_name || record.full_name || '-',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={getRoleColor(role)}>{getRoleDisplayName(role)}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => formatDate(date),
    },
    ...(isMasterAdmin
      ? [
          {
            title: '',
            key: 'actions',
            width: 56,
            render: (_: unknown, record: User) => (
              <Dropdown
                menu={{ items: actionMenuItems(record) }}
                trigger={['click']}
                placement="bottomRight"
              >
                <Button type="text" size="small" icon={<MoreOutlined />} />
              </Dropdown>
            ),
          },
        ]
      : []),
  ]

  const exportColumns = [
    { key: 'full_name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'display_name', label: 'User ID name' },
    { key: 'role', label: 'Role' },
    { key: 'is_active', label: 'Active' },
    { key: 'created_at', label: 'Created' },
  ]
  const exportRows = users.map((u) => ({
    full_name: u.full_name,
    email: u.email,
    display_name: (u as User & { display_name?: string }).display_name ?? u.full_name ?? '-',
    role: u.role ?? '-',
    is_active: u.is_active ? 'Yes' : 'No',
    created_at: formatDate(u.created_at ?? ''),
  }))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>Users</Title>
        <PrintExport pageTitle="Users" exportData={{ columns: exportColumns, rows: exportRows }} exportFilename="users" />
      </div>
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="Search users..."
            prefix={<SearchOutlined />}
            style={{ width: 250 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
        </Space>

        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} users`,
            onChange: (newPage, newPageSize) => {
              setPage(newPage)
              if (newPageSize) setPageSize(newPageSize)
            },
          }}
        />
      </Card>

      <Modal
        title="Edit User"
        open={editModalOpen}
        onCancel={() => { setEditModalOpen(false); setSelectedUser(null) }}
        onOk={handleEditSave}
        confirmLoading={saving}
        width={560}
        destroyOnClose
      >
        {selectedUser && (
          <Form form={form} layout="vertical">
            <Form.Item name="full_name" label="Full name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="display_name" label="User ID name">
              <Input placeholder="Display name for listing" />
            </Form.Item>
            {isMasterAdmin && (
              <Form.Item name="role_id" label="Role">
                <Select
                  placeholder="Select role"
                  options={roles.map((r) => ({
                    value: r.id,
                    label: ROLE_DISPLAY_NAMES[r.name] || r.name,
                  }))}
                  allowClear
                />
              </Form.Item>
            )}
            <Form.Item name="is_active" label="Active" valuePropName="checked">
              <Switch />
            </Form.Item>
            {isMasterAdmin && (
              <>
                <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
                  Section permissions (View / Edit)
                </Typography.Text>
                {SECTION_KEYS.map((key, idx) => (
                  <div
                    key={key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ width: 200 }}>{SECTION_LABELS[key] || key}</span>
                    <Form.Item
                      name={['permissions', idx, 'can_view']}
                      valuePropName="checked"
                      noStyle
                    >
                      <Checkbox>View</Checkbox>
                    </Form.Item>
                    <Form.Item
                      name={['permissions', idx, 'can_edit']}
                      valuePropName="checked"
                      noStyle
                    >
                      <Checkbox>Edit</Checkbox>
                    </Form.Item>
                    <Form.Item name={['permissions', idx, 'section_key']} hidden>
                      <Input type="hidden" />
                    </Form.Item>
                  </div>
                ))}
              </>
            )}
          </Form>
        )}
      </Modal>

      <Modal
        title="Deactivate User"
        open={deactivateModalOpen}
        onCancel={() => { setDeactivateModalOpen(false); setSelectedUser(null) }}
        onOk={handleDeactivate}
        confirmLoading={saving}
        okText="Deactivate"
        okButtonProps={{ danger: true }}
      >
        {selectedUser && (
          <p>
            Deactivate user <strong>{selectedUser.full_name}</strong> ({selectedUser.email})? They
            will no longer be able to sign in.
          </p>
        )}
      </Modal>
    </div>
  )
}
