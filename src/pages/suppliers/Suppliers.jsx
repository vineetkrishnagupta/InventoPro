import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Truck, Eye } from 'lucide-react'
import { supplierService } from '../../services'
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

const EMPTY_FORM = {
  name: '', company_name: '', phone: '', email: '', address: '',
  gst_number: '', opening_balance: 0, status: 'active',
}

export default function Suppliers() {
  const { isManager } = useAuth()
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [viewModal, setViewModal] = useState({ open: false, supplier: null })
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: '' })
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await supplierService.getAll({ search })
      setSuppliers(data)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditItem(null); setForm(EMPTY_FORM); setErrors({}); setModalOpen(true) }
  const openEdit = (s) => {
    setEditItem(s)
    setForm({ name: s.name, company_name: s.company_name || '', phone: s.phone || '', email: s.email || '',
      address: s.address || '', gst_number: s.gst_number || '', opening_balance: s.opening_balance || 0, status: s.status })
    setErrors({}); setModalOpen(true)
  }

  const validate = () => {
    const errs = {}
    if (!form.name?.trim()) errs.name = 'Supplier name is required'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email'
    return errs
  }

  const handleSave = async () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSaving(true)
    try {
      if (editItem) { await supplierService.update(editItem.id, form); toast.success('Supplier updated') }
      else { await supplierService.create(form); toast.success('Supplier created') }
      setModalOpen(false); load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await supplierService.delete(deleteDialog.id)
      toast.success('Supplier deleted')
      setDeleteDialog({ open: false, id: null, name: '' }); load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    { key: 'name', label: 'Supplier', render: (v, row) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
          <span className="text-primary-700 dark:text-primary-300 font-semibold text-sm">{v?.charAt(0)?.toUpperCase()}</span>
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{v}</p>
          {row.company_name && <p className="text-xs text-gray-500 dark:text-gray-400">{row.company_name}</p>}
        </div>
      </div>
    )},
    { key: 'phone', label: 'Phone', render: (v) => v || '—' },
    { key: 'email', label: 'Email', render: (v) => v ? <a href={`mailto:${v}`} className="text-primary-600 hover:underline">{v}</a> : '—' },
    { key: 'gst_number', label: 'GST Number', render: (v) => v || '—' },
    { key: 'status', label: 'Status', render: (v) => <Badge variant={v === 'active' ? 'green' : 'gray'}>{v === 'active' ? 'Active' : 'Inactive'}</Badge> },
    { key: 'actions', label: '', cellClassName: 'text-right', render: (_, row) => (
      <div className="flex items-center gap-1 justify-end">
        <button onClick={() => setViewModal({ open: true, supplier: row })}
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
      <Breadcrumb items={[{ label: 'Purchases' }, { label: 'Suppliers' }]} />
      <div className="page-header">
        <div>
          <h1 className="page-title">Suppliers</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{suppliers.length} suppliers</p>
        </div>
        {isManager && <Button variant="primary" icon={Plus} onClick={openCreate}>Add Supplier</Button>}
      </div>

      <div className="card p-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search suppliers..." className="max-w-sm" />
      </div>

      <div className="card" style={{ padding: 0 }}>
        <DataTable columns={columns} data={suppliers} loading={loading} emptyMessage="No suppliers found." emptyIcon={Truck} />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Supplier' : 'Add Supplier'} size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>{editItem ? 'Update' : 'Create'}</Button>
          </div>
        }
      >
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Supplier Name" placeholder="Full name" value={form.name}
              onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: '' }) }}
              error={errors.name} required />
            <Input label="Company Name" placeholder="Company (optional)" value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
            <Input label="Phone" placeholder="+91 9876543210" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label="Email" type="email" placeholder="supplier@example.com" value={form.email}
              onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: '' }) }}
              error={errors.email} />
            <Input label="GST Number" placeholder="GSTIN" value={form.gst_number}
              onChange={(e) => setForm({ ...form, gst_number: e.target.value })} />
            <Input label="Opening Balance" type="number" placeholder="0.00" value={form.opening_balance}
              onChange={(e) => setForm({ ...form, opening_balance: e.target.value })} />
            <div className="form-group md:col-span-2">
              <label className="label">Address</label>
              <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Full address..." rows={2} className="input resize-none" />
            </div>
            <div className="form-group md:col-span-2">
              <label className="label">Status</label>
              <div className="flex gap-4">
                {['active', 'inactive'].map(s => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value={s} checked={form.status === s} onChange={() => setForm({ ...form, status: s })} className="text-primary-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{s}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={viewModal.open} onClose={() => setViewModal({ open: false, supplier: null })} title="Supplier Details" size="md">
        {viewModal.supplier && (
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ['Name', viewModal.supplier.name],
                ['Company', viewModal.supplier.company_name || '—'],
                ['Phone', viewModal.supplier.phone || '—'],
                ['Email', viewModal.supplier.email || '—'],
                ['GST Number', viewModal.supplier.gst_number || '—'],
                ['Address', viewModal.supplier.address || '—'],
                ['Opening Balance', `₹${viewModal.supplier.opening_balance || 0}`],
                ['Status', viewModal.supplier.status],
              ].map(([k, v]) => (
                <div key={k} className={k === 'Address' ? 'col-span-2' : ''}>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{k}</p>
                  <p className="font-medium text-gray-900 dark:text-white capitalize">{v}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null, name: '' })}
        onConfirm={handleDelete} title="Delete Supplier"
        message={`Are you sure you want to delete "${deleteDialog.name}"?`}
        confirmText="Delete" loading={deleting} />
    </div>
  )
}
