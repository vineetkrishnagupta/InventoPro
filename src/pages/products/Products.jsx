import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Package, Download, Upload, Eye } from 'lucide-react'
import { productService, categoryService, supplierService } from '../../services'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/common/Button'
import SearchInput from '../../components/common/SearchInput'
import Badge from '../../components/common/Badge'
import Select from '../../components/common/Select'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Input from '../../components/common/Input'
import Pagination from '../../components/common/Pagination'
import Breadcrumb from '../../components/common/Breadcrumb'
import { DataTable } from '../../components/common/DataTable'
import toast from 'react-hot-toast'
import { formatCurrency, getStockStatus, exportToCSV, parseCSV, generateInvoiceNumber } from '../../utils'
import clsx from 'clsx'

const EMPTY_FORM = {
  name: '', sku: '', barcode: '', category_id: '', supplier_id: '',
  brand: '', unit: 'pcs', purchase_price: '', selling_price: '',
  tax_percent: 0, minimum_stock: 5, status: 'active',
}

const PAGE_SIZE = 15

export default function Products() {
  const { isManager } = useAuth()
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [viewModal, setViewModal] = useState({ open: false, product: null })
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: '' })
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data, count } = await productService.getAll({
        search, categoryId: categoryFilter, status: statusFilter, page, pageSize: PAGE_SIZE,
      })
      setProducts(data)
      setTotal(count)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [search, categoryFilter, statusFilter, page])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    categoryService.getAll().then(setCategories).catch(() => {})
    supplierService.getAll().then(setSuppliers).catch(() => {})
  }, [])

  const resetPage = () => setPage(1)

  const openCreate = () => {
    setEditItem(null)
    setForm({ ...EMPTY_FORM, sku: `SKU-${Date.now().toString().slice(-6)}` })
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = (product) => {
    setEditItem(product)
    setForm({
      name: product.name || '',
      sku: product.sku || '',
      barcode: product.barcode || '',
      category_id: product.category_id || '',
      supplier_id: product.supplier_id || '',
      brand: product.brand || '',
      unit: product.unit || 'pcs',
      purchase_price: product.purchase_price || '',
      selling_price: product.selling_price || '',
      tax_percent: product.tax_percent || 0,
      minimum_stock: product.minimum_stock || 5,
      status: product.status || 'active',
    })
    setErrors({})
    setModalOpen(true)
  }

  const validate = () => {
    const errs = {}
    if (!form.name?.trim()) errs.name = 'Product name is required'
    if (!form.sku?.trim()) errs.sku = 'SKU is required'
    if (!form.category_id) errs.category_id = 'Category is required'
    if (!form.purchase_price || isNaN(form.purchase_price)) errs.purchase_price = 'Valid purchase price required'
    if (!form.selling_price || isNaN(form.selling_price)) errs.selling_price = 'Valid selling price required'
    if (Number(form.selling_price) < Number(form.purchase_price)) {
      errs.selling_price = 'Selling price must be ≥ purchase price'
    }
    return errs
  }

  const handleSave = async () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        purchase_price: Number(form.purchase_price),
        selling_price: Number(form.selling_price),
        tax_percent: Number(form.tax_percent),
        minimum_stock: Number(form.minimum_stock),
        supplier_id: form.supplier_id || null,
      }
      if (editItem) {
        await productService.update(editItem.id, payload)
        toast.success('Product updated')
      } else {
        await productService.create(payload)
        toast.success('Product created')
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
      await productService.delete(deleteDialog.id)
      toast.success('Product deleted')
      setDeleteDialog({ open: false, id: null, name: '' })
      load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const handleExport = async () => {
    try {
      const { data } = await productService.getAll({ pageSize: 9999 })
      exportToCSV(data.map(p => ({
        Name: p.name, SKU: p.sku, Barcode: p.barcode || '',
        Category: p.categories?.name || '', Supplier: p.suppliers?.name || '',
        Brand: p.brand || '', Unit: p.unit || '',
        'Purchase Price': p.purchase_price, 'Selling Price': p.selling_price,
        'Tax %': p.tax_percent, 'Min Stock': p.minimum_stock,
        'Current Stock': p.inventory?.[0]?.quantity || 0, Status: p.status,
      })), 'products')
      toast.success('Products exported')
    } catch (err) {
      toast.error('Export failed')
    }
  }

  const stockStatus = (product) => {
    const qty = product.inventory?.[0]?.quantity || 0
    return getStockStatus(qty, product.minimum_stock)
  }

  const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }))
  const supplierOptions = suppliers.map(s => ({ value: s.id, label: s.name }))

  const columns = [
    {
      key: 'name', label: 'Product', render: (v, row) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
            <Package className="w-5 h-5 text-gray-400" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 dark:text-white truncate">{v}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{row.sku}</p>
          </div>
        </div>
      )
    },
    { key: 'categories', label: 'Category', render: (v) => v?.name || '—' },
    { key: 'purchase_price', label: 'Purchase', render: (v) => formatCurrency(v) },
    { key: 'selling_price', label: 'Selling', render: (v) => formatCurrency(v) },
    {
      key: 'stock', label: 'Stock', render: (_, row) => {
        const qty = row.inventory?.[0]?.quantity || 0
        const status = stockStatus(row)
        return (
          <div>
            <span className="font-medium text-gray-900 dark:text-white">{qty} {row.unit}</span>
            <Badge variant={status.variant} className="ml-2 text-[10px]">{status.label}</Badge>
          </div>
        )
      }
    },
    {
      key: 'status', label: 'Status',
      render: (v) => <Badge variant={v === 'active' ? 'green' : 'gray'}>{v === 'active' ? 'Active' : 'Inactive'}</Badge>
    },
    {
      key: 'actions', label: '', cellClassName: 'text-right',
      render: (_, row) => (
        <div className="flex items-center gap-1 justify-end">
          <button onClick={() => setViewModal({ open: true, product: row })}
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
      )
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb items={[{ label: 'Inventory' }, { label: 'Products' }]} />

      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{total} products total</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={Download} onClick={handleExport}>Export</Button>
          {isManager && <Button variant="primary" icon={Plus} onClick={openCreate}>Add Product</Button>}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <SearchInput value={search} onChange={(v) => { setSearch(v); resetPage() }} placeholder="Search by name, SKU, barcode..." className="flex-1 min-w-48" />
          <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); resetPage() }} className="input w-auto min-w-36">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); resetPage() }} className="input w-auto">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <DataTable columns={columns} data={products} loading={loading} emptyMessage="No products found." emptyIcon={Package} />
        <div className="px-4 pb-4">
          <Pagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} onPageChange={setPage} totalItems={total} pageSize={PAGE_SIZE} />
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Product' : 'Add Product'} size="xl"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>{editItem ? 'Update' : 'Create'}</Button>
          </div>
        }
      >
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Product Name" placeholder="Enter product name" value={form.name}
              onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors({ ...errors, name: '' }) }}
              error={errors.name} required className="md:col-span-2" />

            <Input label="SKU" placeholder="e.g., SKU-001" value={form.sku}
              onChange={(e) => { setForm({ ...form, sku: e.target.value }); setErrors({ ...errors, sku: '' }) }}
              error={errors.sku} required />

            <Input label="Barcode" placeholder="Enter barcode (optional)" value={form.barcode}
              onChange={(e) => setForm({ ...form, barcode: e.target.value })} />

            <Select label="Category" options={categoryOptions} value={form.category_id} placeholder="Select category"
              onChange={(e) => { setForm({ ...form, category_id: e.target.value }); setErrors({ ...errors, category_id: '' }) }}
              error={errors.category_id} required />

            <Select label="Supplier" options={supplierOptions} value={form.supplier_id} placeholder="Select supplier (optional)"
              onChange={(e) => setForm({ ...form, supplier_id: e.target.value })} />

            <Input label="Brand" placeholder="Enter brand" value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })} />

            <div className="form-group">
              <label className="label">Unit</label>
              <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="input">
                {['pcs', 'kg', 'g', 'L', 'mL', 'box', 'set', 'pair', 'dozen', 'meter', 'ft'].map(u =>
                  <option key={u} value={u}>{u}</option>
                )}
              </select>
            </div>

            <Input label="Purchase Price" type="number" min="0" step="0.01" placeholder="0.00" value={form.purchase_price}
              onChange={(e) => { setForm({ ...form, purchase_price: e.target.value }); setErrors({ ...errors, purchase_price: '' }) }}
              error={errors.purchase_price} required />

            <Input label="Selling Price" type="number" min="0" step="0.01" placeholder="0.00" value={form.selling_price}
              onChange={(e) => { setForm({ ...form, selling_price: e.target.value }); setErrors({ ...errors, selling_price: '' }) }}
              error={errors.selling_price} required />

            <Input label="Tax (%)" type="number" min="0" max="100" step="0.01" placeholder="0" value={form.tax_percent}
              onChange={(e) => setForm({ ...form, tax_percent: e.target.value })} />

            <Input label="Minimum Stock" type="number" min="0" placeholder="5" value={form.minimum_stock}
              onChange={(e) => setForm({ ...form, minimum_stock: e.target.value })} required />

            <div className="form-group md:col-span-2">
              <label className="label">Status</label>
              <div className="flex gap-4">
                {['active', 'inactive'].map(s => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value={s} checked={form.status === s}
                      onChange={() => setForm({ ...form, status: s })} className="text-primary-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{s}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={viewModal.open} onClose={() => setViewModal({ open: false, product: null })} title="Product Details" size="md">
        {viewModal.product && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ['Name', viewModal.product.name],
                ['SKU', viewModal.product.sku],
                ['Barcode', viewModal.product.barcode || '—'],
                ['Category', viewModal.product.categories?.name || '—'],
                ['Supplier', viewModal.product.suppliers?.name || '—'],
                ['Brand', viewModal.product.brand || '—'],
                ['Unit', viewModal.product.unit],
                ['Purchase Price', formatCurrency(viewModal.product.purchase_price)],
                ['Selling Price', formatCurrency(viewModal.product.selling_price)],
                ['Tax %', `${viewModal.product.tax_percent}%`],
                ['Minimum Stock', viewModal.product.minimum_stock],
                ['Current Stock', viewModal.product.inventory?.[0]?.quantity || 0],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{k}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{v}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null, name: '' })}
        onConfirm={handleDelete} title="Delete Product"
        message={`Are you sure you want to delete "${deleteDialog.name}"?`}
        confirmText="Delete" loading={deleting} />
    </div>
  )
}
