import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Tag, ToggleLeft, ToggleRight } from 'lucide-react'
import { categoryService } from '../../services'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/common/Button'
import SearchInput from '../../components/common/SearchInput'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Input from '../../components/common/Input'
import Breadcrumb from '../../components/common/Breadcrumb'
import { DataTable } from '../../components/common/DataTable'
import { EmptyState } from '../../components/common/States'
import toast from 'react-hot-toast'
import { formatDate } from '../../utils'

const EMPTY_FORM = { name: '', description: '', status: 'active' }

export default function Categories() {
  const { isManager, user } = useAuth()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: '' })
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await categoryService.getAll({ search })
      setCategories(data)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditItem(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = (cat) => {
    setEditItem(cat)
    setForm({ name: cat.name, description: cat.description || '', status: cat.status })
    setErrors({})
    setModalOpen(true)
  }

  const validate = () => {
    const errs = {}
    if (!form.name?.trim()) errs.name = 'Category name is required'
    return errs
  }

  const handleSave = async () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSaving(true)
    try {
      if (editItem) {
        await categoryService.update(editItem.id, form)
        toast.success('Category updated')
      } else {
        await categoryService.create(form)
        toast.success('Category created')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await categoryService.delete(deleteDialog.id)
      toast.success('Category deleted')
      setDeleteDialog({ open: false, id: null, name: '' })
      load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const toggleStatus = async (cat) => {
    try {
      const newStatus = cat.status === 'active' ? 'inactive' : 'active'
      await categoryService.update(cat.id, { status: newStatus })
      toast.success(`Category ${newStatus === 'active' ? 'activated' : 'deactivated'}`)
      load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const columns = [
    { key: 'name', label: 'Category Name', render: (v, row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
          <Tag className="w-4 h-4 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{v}</p>
          {row.description && <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{row.description}</p>}
        </div>
      </div>
    )},
    { key: 'products', label: 'Products', render: (_, row) => (
      <span className="font-medium text-gray-700 dark:text-gray-300">
        {row.products?.[0]?.count || 0}
      </span>
    )},
    { key: 'status', label: 'Status', render: (v) => (
      <Badge variant={v === 'active' ? 'green' : 'gray'}>{v === 'active' ? 'Active' : 'Inactive'}</Badge>
    )},
    { key: 'created_at', label: 'Created', render: (v) => formatDate(v) },
    { key: 'actions', label: 'Actions', render: (_, row) => (
      <div className="flex items-center gap-2">
        <button onClick={() => toggleStatus(row)} title={row.status === 'active' ? 'Deactivate' : 'Activate'}
          className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
          {row.status === 'active' ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4" />}
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
      <Breadcrumb items={[{ label: 'Inventory' }, { label: 'Categories' }]} />

      <div className="page-header">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{categories.length} categories total</p>
        </div>
        {isManager && (
          <Button variant="primary" icon={Plus} onClick={openCreate}>Add Category</Button>
        )}
      </div>

      <div className="card p-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search categories..."
          className="max-w-sm"
        />
      </div>

      <div className="card" style={{ padding: 0 }}>
        <DataTable
          columns={columns}
          data={categories}
          loading={loading}
          emptyMessage="No categories found. Add your first category!"
          emptyIcon={Tag}
        />
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? 'Edit Category' : 'Add Category'}
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>
              {editItem ? 'Update' : 'Create'}
            </Button>
          </div>
        }
      >
        <div className="p-6 space-y-4">
          <Input
            label="Category Name"
            placeholder="e.g., Electronics"
            value={form.name}
            onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: '' }) }}
            error={errors.name}
            required
          />
          <div className="form-group">
            <label className="label">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional description..."
              rows={3}
              className="input resize-none"
            />
          </div>
          <div className="form-group">
            <label className="label">Status</label>
            <div className="flex gap-4">
              {['active', 'inactive'].map(s => (
                <label key={s} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value={s} checked={form.status === s}
                    onChange={() => setForm({ ...form, status: s })}
                    className="text-primary-600" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{s}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null, name: '' })}
        onConfirm={handleDelete}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteDialog.name}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={deleting}
      />
    </div>
  )
}
