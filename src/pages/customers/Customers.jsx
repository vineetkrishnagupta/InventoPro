import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Users, Eye } from 'lucide-react'
import { customerService } from '../../services'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/common/Button'
import SearchInput from '../../components/common/SearchInput'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Input from '../../components/common/Input'
import Breadcrumb from '../../components/common/Breadcrumb'
import { DataTable } from '../../components/common/DataTable'
import toast from 'react-hot-toast'

const EMPTY_FORM = { name: '', phone: '', email: '', address: '', gst_number: '', opening_balance: 0, status: 'active' }

export default function Customers() {
  const { isManager } = useAuth()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [viewModal, setViewModal] = useState({ open: false, customer: null })
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: '' })
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await customerService.getAll({ search })
      setCustomers(data)
    } catch (err) { toast.error(err.message) }
    finally { setLoading(false) }
  }, [search])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditItem(null); setForm(EMPTY_FORM); setErrors({}); setModalOpen(true) }
  const openEdit = (c) => {
    setEditItem(c)
    setForm({ name: c.name, phone: c.phone || '', email: c.email || '', address: c.address || '',
      gst_number: c.gst_number || '', opening_balance: c.opening_balance || 0, status: c.status })
    setErrors({}); setModalOpen(true)
  }

  const validate = () => {
    const errs = {}
    if (!form.name?.trim()) errs.name = 'Customer name is required'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email'
    return errs
  }

  const handleSave = async () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSaving(true)
    try {
      if (editItem) { await customerService.update(editItem.id, form); toast.success('Customer updated') }
      else { await customerService.create(form); toast.success('Customer created') }
      setModalOpen(false); load()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await customerService.delete(deleteDialog.id)
      toast.success('Customer deleted')
      setDeleteDialog({ open: false, id: null, name: '' }); load()
    } catch (err) { toast.error(err.message) }
    finally { setDeleting(false) }
  }

  const columns = [
    { key: 'name', label: 'Customer', render: (v, row) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
          <span className="text-emerald-700 dark:text-emerald-300 font-semibold text-sm">{v?.charAt(0)?.toUpperCase()}</span>
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{v}</p>
          {row.phone && <p className="text-xs text-gray-500 dark:text-gray-400">{row.phone}</p>}
        </div>
      </div>
    )},
    { key: 'email', label: 'Email', render: (v) => v ? <a href={`mailto:${v}`} className="text-primary-600 hover:underline">{v}</a> : '—' },
    { key: 'gst_number', label: 'GST Number', render: (v) => v || '—' },
    { key: 'opening_balance', label: 'Balance', render: (v) => `₹${v || 0}` },
    { key: 'status', label: 'Status', render: (v) => <Badge variant={v === 'active' ? 'green' : 'gray'}>{v === 'active' ? 'Active' : 'Inactive'}</Badge> },
    { key: 'actions', label: '', cellClassName: 'text-right', render: (_, row) => (
      <div className="flex items-center gap-1 justify-end">
        <button onClick={() => setViewModal({ open: true, customer: row })}
          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
          <Eye className="w-4 h-4" />
        </button>
        {isManager && (
          <>
            <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={() => setDeleteDialog({ open: true, id: row.id, name: row.name })}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    )},
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb items={[{ label: 'Sales' }, { label: 'Customers' }]} />
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{customers.length} customers</p>
        </div>
        {isManager && <Button variant="primary" icon={Plus} onClick={openCreate}>Add Customer</Button>}
      </div>

      <div className="card p-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search customers..." className="max-w-sm" />
      </div>

      <div className="card" style={{ padding: 0 }}>
        <DataTable columns={columns} data={customers} loading={loading} emptyMessage="No customers found." emptyIcon={Users} />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Customer' : 'Add Customer'} size="md"
        footer={<div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleSave} loading={saving}>{editItem ? 'Update' : 'Create'}</Button></div>}
      >
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Customer Name" placeholder="Full name" value={form.name}
              onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: '' }) }}
              error={errors.name} required />
            <Input label="Phone" placeholder="+91 9876543210" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label="Email" type="email" placeholder="customer@example.com" value={form.email}
              onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: '' }) }}
              error={errors.email} />
            <Input label="GST Number" placeholder="GSTIN (optional)" value={form.gst_number}
              onChange={(e) => setForm({ ...form, gst_number: e.target.value })} />
            <Input label="Opening Balance" type="number" placeholder="0.00" value={form.opening_balance}
              onChange={(e) => setForm({ ...form, opening_balance: e.target.value })} />
            <div className="form-group md:col-span-2">
              <label className="label">Address</label>
              <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Full address..." rows={2} className="input resize-none" />
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={viewModal.open} onClose={() => setViewModal({ open: false, customer: null })} title="Customer Details" size="sm">
        {viewModal.customer && (
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[['Name', viewModal.customer.name], ['Phone', viewModal.customer.phone || '—'], ['Email', viewModal.customer.email || '—'],
                ['GST', viewModal.customer.gst_number || '—'], ['Balance', `₹${viewModal.customer.opening_balance || 0}`],
                ['Address', viewModal.customer.address || '—']].map(([k, v]) => (
                <div key={k} className={k === 'Address' ? 'col-span-2' : ''}>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{k}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{v}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null, name: '' })}
        onConfirm={handleDelete} title="Delete Customer"
        message={`Are you sure you want to delete "${deleteDialog.name}"?`}
        confirmText="Delete" loading={deleting} />
    </div>
  )
}
