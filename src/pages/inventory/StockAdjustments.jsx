import { useState, useEffect, useCallback } from 'react'
import { Plus, Sliders } from 'lucide-react'
import { inventoryService, productService } from '../../services'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import Select from '../../components/common/Select'
import Input from '../../components/common/Input'
import Pagination from '../../components/common/Pagination'
import Breadcrumb from '../../components/common/Breadcrumb'
import { DataTable } from '../../components/common/DataTable'
import Badge from '../../components/common/Badge'
import toast from 'react-hot-toast'
import { formatDate, formatDateTime } from '../../utils'
import clsx from 'clsx'

const PAGE_SIZE = 15
const ADJUSTMENT_TYPES = [
  { value: 'opening_stock', label: 'Opening Stock' },
  { value: 'damage', label: 'Damage' },
  { value: 'expired', label: 'Expired' },
  { value: 'lost', label: 'Lost' },
  { value: 'correction', label: 'Correction' },
  { value: 'return', label: 'Return' },
  { value: 'other', label: 'Other' },
]

const typeVariant = (type) => {
  const map = {
    opening_stock: 'blue', damage: 'red', expired: 'red', lost: 'red',
    correction: 'yellow', return: 'green', other: 'gray',
  }
  return map[type] || 'gray'
}

export default function StockAdjustments() {
  const { user, isManager } = useAuth()
  const [adjustments, setAdjustments] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ product_id: '', adjustment_type: '', quantity: '', reason: '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [products, setProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data, count } = await inventoryService.getAdjustments({ page, pageSize: PAGE_SIZE })
      setAdjustments(data); setTotal(count)
    } catch (err) { toast.error(err.message) }
    finally { setLoading(false) }
  }, [page])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    productService.getAll({ pageSize: 500, status: 'active' }).then(({ data }) => setProducts(data)).catch(() => {})
  }, [])

  const openCreate = () => {
    setForm({ product_id: '', adjustment_type: '', quantity: '', reason: '' })
    setSelectedProduct(null)
    setErrors({})
    setModalOpen(true)
  }

  const handleProductChange = (productId) => {
    setForm(prev => ({ ...prev, product_id: productId }))
    const product = products.find(p => p.id === productId)
    setSelectedProduct(product || null)
  }

  const currentStock = selectedProduct?.inventory?.[0]?.quantity || 0

  const validate = () => {
    const errs = {}
    if (!form.product_id) errs.product_id = 'Product is required'
    if (!form.adjustment_type) errs.adjustment_type = 'Adjustment type is required'
    if (!form.quantity || isNaN(form.quantity) || Number(form.quantity) === 0) errs.quantity = 'Valid quantity is required'
    if (!form.reason?.trim()) errs.reason = 'Reason is required'
    return errs
  }

  const handleSave = async () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSaving(true)
    try {
      await inventoryService.adjustStock({
        p_product_id: form.product_id,
        p_adjustment_type: form.adjustment_type,
        p_quantity: Number(form.quantity),
        p_reason: form.reason,
        p_user_id: user.id,
      })
      toast.success('Stock adjusted successfully')
      setModalOpen(false); load()
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const productOptions = products.map(p => ({
    value: p.id,
    label: `${p.name} (Stock: ${p.inventory?.[0]?.quantity || 0} ${p.unit})`,
  }))

  const newStock = form.quantity
    ? ['damage', 'expired', 'lost'].includes(form.adjustment_type)
      ? Math.max(0, currentStock - Math.abs(Number(form.quantity)))
      : currentStock + Math.abs(Number(form.quantity))
    : null

  const columns = [
    { key: 'products', label: 'Product', render: (v) => (
      <div>
        <p className="font-medium text-gray-900 dark:text-white">{v?.name || '—'}</p>
        <p className="text-xs text-gray-500">{v?.sku}</p>
      </div>
    )},
    { key: 'adjustment_type', label: 'Type', render: (v) => (
      <Badge variant={typeVariant(v)} className="capitalize">{v?.replace('_', ' ')}</Badge>
    )},
    { key: 'previous_quantity', label: 'Before', render: (v) => <span className="font-medium">{v}</span> },
    { key: 'quantity', label: 'Adjustment', render: (v, row) => {
      const isNeg = ['damage', 'expired', 'lost'].includes(row.adjustment_type)
      return <span className={clsx('font-medium', isNeg ? 'text-red-600' : 'text-green-600')}>{isNeg ? '-' : '+'}{Math.abs(v)}</span>
    }},
    { key: 'new_quantity', label: 'After', render: (v) => <span className="font-semibold text-gray-900 dark:text-white">{v}</span> },
    { key: 'reason', label: 'Reason', render: (v) => <span className="text-gray-600 dark:text-gray-400">{v}</span> },
    { key: 'profiles', label: 'By', render: (v) => v?.full_name || '—' },
    { key: 'created_at', label: 'Date', render: (v) => formatDate(v) },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb items={[{ label: 'Inventory' }, { label: 'Stock Adjustments' }]} />
      <div className="page-header">
        <div>
          <h1 className="page-title">Stock Adjustments</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{total} adjustments</p>
        </div>
        {isManager && <Button variant="primary" icon={Plus} onClick={openCreate}>New Adjustment</Button>}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <DataTable columns={columns} data={adjustments} loading={loading} emptyMessage="No stock adjustments found." emptyIcon={Sliders} />
        <div className="px-4 pb-4">
          <Pagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} onPageChange={setPage} totalItems={total} pageSize={PAGE_SIZE} />
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Stock Adjustment" size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>Save Adjustment</Button>
          </div>
        }
      >
        <div className="p-6 space-y-4">
          <Select label="Product" options={productOptions} value={form.product_id} placeholder="Select product"
            onChange={(e) => { handleProductChange(e.target.value); setErrors({ ...errors, product_id: '' }) }}
            error={errors.product_id} required />

          {selectedProduct && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-sm">
              <p className="text-blue-700 dark:text-blue-300 font-medium">
                Current Stock: <strong>{currentStock} {selectedProduct.unit}</strong>
              </p>
              <p className="text-blue-600 dark:text-blue-400 text-xs mt-0.5">
                Minimum Stock: {selectedProduct.minimum_stock}
              </p>
            </div>
          )}

          <Select label="Adjustment Type" options={ADJUSTMENT_TYPES} value={form.adjustment_type} placeholder="Select type"
            onChange={(e) => { setForm({ ...form, adjustment_type: e.target.value }); setErrors({ ...errors, adjustment_type: '' }) }}
            error={errors.adjustment_type} required />

          <Input label="Quantity" type="number" step="0.01"
            placeholder={['damage', 'expired', 'lost'].includes(form.adjustment_type) ? 'Enter quantity to reduce' : 'Enter quantity to add'}
            value={form.quantity}
            onChange={(e) => { setForm({ ...form, quantity: e.target.value }); setErrors({ ...errors, quantity: '' }) }}
            error={errors.quantity} required
            hint={newStock !== null ? `New stock will be: ${newStock}` : ''} />

          <div className="form-group">
            <label className="label">Reason <span className="text-red-500">*</span></label>
            <textarea value={form.reason} onChange={(e) => { setForm({ ...form, reason: e.target.value }); setErrors({ ...errors, reason: '' }) }}
              placeholder="Explain the reason for adjustment..." rows={3} className={`${errors.reason ? 'input-error' : 'input'} resize-none`} />
            {errors.reason && <p className="text-xs text-red-500 mt-1">{errors.reason}</p>}
          </div>
        </div>
      </Modal>
    </div>
  )
}
