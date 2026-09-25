import { useState, useEffect, useCallback } from 'react'
import { Users, Shield, Pencil } from 'lucide-react'
import { userService } from '../../services'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/common/Button'
import SearchInput from '../../components/common/SearchInput'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import Select from '../../components/common/Select'
import Breadcrumb from '../../components/common/Breadcrumb'
import { DataTable } from '../../components/common/DataTable'
import toast from 'react-hot-toast'
import { formatDate, roleVariant } from '../../utils'

const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'staff', label: 'Staff' },
  { value: 'viewer', label: 'Viewer' },
]

export default function UserManagement() {
  const { isAdmin, profile: myProfile } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editModal, setEditModal] = useState({ open: false, user: null })
  const [form, setForm] = useState({ role: '', status: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await userService.getAll({ search })
      setUsers(data)
    } catch (err) { toast.error(err.message) }
    finally { setLoading(false) }
  }, [search])

  useEffect(() => { load() }, [load])

  const openEdit = (user) => {
    setEditModal({ open: true, user })
    setForm({ role: user.role || 'viewer', status: user.status || 'active' })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await userService.update(editModal.user.id, form)
      toast.success('User updated')
      setEditModal({ open: false, user: null })
      load()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const columns = [
    { key: 'full_name', label: 'User', render: (v, row) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
          <span className="text-primary-700 dark:text-primary-300 font-semibold text-sm">{v?.charAt(0)?.toUpperCase() || '?'}</span>
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{v || 'Unknown'}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{row.email}</p>
        </div>
      </div>
    )},
    { key: 'role', label: 'Role', render: (v) => (
      <div className="flex items-center gap-1.5">
        <Shield className="w-3.5 h-3.5 text-gray-400" />
        <Badge variant={roleVariant(v)} className="capitalize">{v || 'viewer'}</Badge>
      </div>
    )},
    { key: 'phone', label: 'Phone', render: (v) => v || '—' },
    { key: 'status', label: 'Status', render: (v) => <Badge variant={v === 'active' ? 'green' : 'gray'}>{v || 'active'}</Badge> },
    { key: 'created_at', label: 'Joined', render: (v) => formatDate(v) },
    { key: 'actions', label: '', cellClassName: 'text-right', render: (_, row) => {
      if (row.id === myProfile?.id) return <span className="text-xs text-gray-400">(You)</span>
      return isAdmin ? (
        <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
          <Pencil className="w-4 h-4" />
        </button>
      ) : null
    }},
  ]

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">You don't have permission to manage users.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb items={[{ label: 'Administration' }, { label: 'Users' }]} />
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{users.length} users</p>
        </div>
      </div>

      <div className="card p-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search users..." className="max-w-sm" />
      </div>

      <div className="card" style={{ padding: 0 }}>
        <DataTable columns={columns} data={users} loading={loading} emptyMessage="No users found." emptyIcon={Users} />
      </div>

      <Modal isOpen={editModal.open} onClose={() => setEditModal({ open: false, user: null })} title="Edit User" size="sm"
        footer={<div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setEditModal({ open: false, user: null })}>Cancel</Button><Button variant="primary" onClick={handleSave} loading={saving}>Update</Button></div>}
      >
        <div className="p-6 space-y-4">
          {editModal.user && (
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <span className="text-primary-700 dark:text-primary-300 font-semibold">{editModal.user.full_name?.charAt(0)?.toUpperCase() || '?'}</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{editModal.user.full_name}</p>
                <p className="text-sm text-gray-500">{editModal.user.email}</p>
              </div>
            </div>
          )}
          <Select label="Role" options={roleOptions} value={form.role} placeholder=""
            onChange={(e) => setForm({ ...form, role: e.target.value })} />
          <Select label="Status" value={form.status} placeholder=""
            options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
            onChange={(e) => setForm({ ...form, status: e.target.value })} />
        </div>
      </Modal>
    </div>
  )
}
