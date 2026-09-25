import { useState, useEffect, useCallback } from 'react'
import { Plus, Eye, ShoppingCart, Trash2, Search, Printer } from 'lucide-react'
import { purchaseService, supplierService, productService } from '../../services'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/common/Button'
import SearchInput from '../../components/common/SearchInput'
import Badge from '../../components/common/Badge'
import Modal from '../../components/common/Modal'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Pagination from '../../components/common/Pagination'
import Breadcrumb from '../../components/common/Breadcrumb'
import { DataTable } from '../../components/common/DataTable'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate, generatePurchaseNumber, paymentStatusVariant } from '../../utils'
import { format } from 'date-fns'
import clsx from 'clsx'

const PAGE_SIZE = 15
const EMPTY_FORM = {
  supplier_id: '', purchase_date: format(new Date(), 'yyyy-MM-dd'),
  purchase_number: generatePurchaseNumber(),
  payment_status: 'pending', payment_method: 'cash', notes: '',
}

export default function Purchases() {
  const { user, isManager } = useAuth()
  const [purchases, setPurchases] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [creating, setCreating] = useState(false)
  const [viewModal, setViewModal] = useState({ open: false, purchase: null })
  const [form, setForm] = useState(EMPTY_FORM)
  const [items, setItems] = useState([])
  const [productSearch, setProductSearch] = useState('')
  const [productResults, setProductResults] = useState([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data, count } = await purchaseService.getAll({ search, page, pageSize: PAGE_SIZE })
      setPurchases(data); setTotal(count)
    } catch (err) { toast.error(err.message) }
    finally { setLoading(false) }
  }, [search, page])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    supplierService.getAll().then(setSuppliers).catch(() => {})
  }, [])

  // Product search
  useEffect(() => {
    if (productSearch.length < 2) { setProductResults([]); return }
    const timer = setTimeout(async () => {
      try {
        const { data } = await productService.getAll({ search: productSearch, pageSize: 10 })
        setProductResults(data)
      } catch { setProductResults([]) }
    }, 300)
    return () => clearTimeout(timer)
  }, [productSearch])

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, purchase_number: generatePurchaseNumber() })
    setItems([])
    setErrors({})
    setCreating(true)
  }

  const addItem = (product) => {
    const exists = items.find(i => i.product_id === product.id)
    if (exists) {
      setItems(items.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.purchase_price } : i))
    } else {
      setItems([...items, {
        product_id: product.id, product, quantity: 1,
        purchase_price: product.purchase_price || 0,
        tax_percent: product.tax_percent || 0, discount: 0,
        total: product.purchase_price || 0,
      }])
    }
    setProductSearch('')
    setProductResults([])
  }

  const updateItem = (idx, field, value) => {
    setItems(items.map((item, i) => {
      if (i !== idx) return item
      const updated = { ...item, [field]: value }
      const qty = Number(updated.quantity) || 0
      const price = Number(updated.purchase_price) || 0
      const disc = Number(updated.discount) || 0
      updated.total = qty * price - disc
      return updated
    }))
  }

  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx))

  const subtotal = items.reduce((s, i) => s + (Number(i.total) || 0), 0)
  const totalTax = items.reduce((s, i) => s + (Number(i.quantity) * Number(i.purchase_price) * (Number(i.tax_percent) / 100) || 0), 0)
  const grandTotal = subtotal + totalTax

  const validate = () => {
    const errs = {}
    if (!form.supplier_id) errs.supplier_id = 'Supplier is required'
    if (items.length === 0) errs.items = 'Add at least one product'
    return errs
  }

  const handleSave = async () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); toast.error(Object.values(errs)[0]); return }
    setSaving(true)
    try {
      const purchaseData = {
        ...form,
        subtotal, tax: totalTax, discount: 0, total_amount: grandTotal, created_by: user.id,
      }
      const itemsData = items.map(({ product, ...item }) => ({
        ...item,
        quantity: Number(item.quantity), purchase_price: Number(item.purchase_price),
        tax_percent: Number(item.tax_percent), discount: Number(item.discount),
        total: Number(item.total),
      }))

      await purchaseService.create(purchaseData, itemsData)
      toast.success('Purchase order created successfully!')
      setCreating(false)
      load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const viewPurchase = async (id) => {
    try {
      const data = await purchaseService.getById(id)
      setViewModal({ open: true, purchase: data })
    } catch (err) { toast.error(err.message) }
  }

  const supplierOptions = suppliers.map(s => ({ value: s.id, label: s.name }))

  const columns = [
    { key: 'purchase_number', label: 'Purchase #', render: (v) => <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">{v}</span> },
    { key: 'suppliers', label: 'Supplier', render: (v) => v?.name || '—' },
    { key: 'purchase_date', label: 'Date', render: (v) => formatDate(v) },
    { key: 'total_amount', label: 'Total', render: (v) => <span className="font-semibold">{formatCurrency(v)}</span> },
    { key: 'payment_status', label: 'Status', render: (v) => <Badge variant={paymentStatusVariant(v)} className="capitalize">{v}</Badge> },
    { key: 'payment_method', label: 'Method', render: (v) => <span className="capitalize">{v || '—'}</span> },
    { key: 'actions', label: '', cellClassName: 'text-right', render: (_, row) => (
      <button onClick={() => viewPurchase(row.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
        <Eye className="w-4 h-4" />
      </button>
    )},
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb items={[{ label: 'Purchases' }, { label: 'Purchase Orders' }]} />
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchase Orders</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{total} orders total</p>
        </div>
        {isManager && <Button variant="primary" icon={Plus} onClick={openCreate}>New Purchase</Button>}
      </div>

      <div className="card p-4">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search purchase number..." className="max-w-sm" />
      </div>

      <div className="card" style={{ padding: 0 }}>
        <DataTable columns={columns} data={purchases} loading={loading} emptyMessage="No purchase orders found." emptyIcon={ShoppingCart} />
        <div className="px-4 pb-4">
          <Pagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} onPageChange={setPage} totalItems={total} pageSize={PAGE_SIZE} />
        </div>
      </div>

      {/* Create Purchase Modal */}
      <Modal isOpen={creating} onClose={() => setCreating(false)} title="New Purchase Order" size="xl"
        footer={
          <div className="flex justify-between items-center">
            <div className="text-sm">
              <span className="text-gray-500">Grand Total: </span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(grandTotal)}</span>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setCreating(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSave} loading={saving}>Create Purchase</Button>
            </div>
          </div>
        }
      >
        <div className="p-6 space-y-6">
          {/* Header fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select label="Supplier" options={supplierOptions} value={form.supplier_id} placeholder="Select supplier"
              onChange={(e) => { setForm({ ...form, supplier_id: e.target.value }); setErrors({ ...errors, supplier_id: '' }) }}
              error={errors.supplier_id} required />
            <Input label="Purchase Date" type="date" value={form.purchase_date}
              onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} required />
            <Input label="Purchase Number" value={form.purchase_number}
              onChange={(e) => setForm({ ...form, purchase_number: e.target.value })} />
          </div>

          {/* Product search */}
          <div>
            <label className="label">Add Products</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={productSearch} onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search product name or SKU..."
                className="input pl-9" />
              {productResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto">
                  {productResults.map(p => (
                    <button key={p.id} onClick={() => addItem(p)}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.sku}</p>
                      </div>
                      <span className="text-sm text-gray-500">{formatCurrency(p.purchase_price)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.items && <p className="text-xs text-red-500 mt-1">{errors.items}</p>}
          </div>

          {/* Items table */}
          {items.length > 0 && (
            <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    {['Product', 'Qty', 'Price', 'Tax %', 'Discount', 'Total', ''].map(h => (
                      <th key={h} className="table-cell text-left text-xs font-medium text-gray-500 dark:text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="table-cell">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{item.product?.name}</p>
                          <p className="text-xs text-gray-500">{item.product?.sku}</p>
                        </div>
                      </td>
                      <td className="table-cell w-20">
                        <input type="number" min="1" value={item.quantity}
                          onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                          className="input text-center" />
                      </td>
                      <td className="table-cell w-28">
                        <input type="number" min="0" step="0.01" value={item.purchase_price}
                          onChange={(e) => updateItem(idx, 'purchase_price', Number(e.target.value))}
                          className="input" />
                      </td>
                      <td className="table-cell w-20">
                        <input type="number" min="0" max="100" value={item.tax_percent}
                          onChange={(e) => updateItem(idx, 'tax_percent', Number(e.target.value))}
                          className="input text-center" />
                      </td>
                      <td className="table-cell w-24">
                        <input type="number" min="0" value={item.discount}
                          onChange={(e) => updateItem(idx, 'discount', Number(e.target.value))}
                          className="input" />
                      </td>
                      <td className="table-cell font-semibold text-gray-900 dark:text-white">{formatCurrency(item.total)}</td>
                      <td className="table-cell">
                        <button onClick={() => removeItem(idx)} className="p-1 text-red-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals & payment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Select label="Payment Status" value={form.payment_status}
                options={[{ value: 'paid', label: 'Paid' }, { value: 'partial', label: 'Partial' }, { value: 'pending', label: 'Pending' }]}
                onChange={(e) => setForm({ ...form, payment_status: e.target.value })} placeholder="" />
              <Select label="Payment Method" value={form.payment_method}
                options={[{ value: 'cash', label: 'Cash' }, { value: 'bank', label: 'Bank Transfer' }, { value: 'cheque', label: 'Cheque' }, { value: 'upi', label: 'UPI' }]}
                onChange={(e) => setForm({ ...form, payment_method: e.target.value })} placeholder="" />
              <div className="form-group">
                <label className="label">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="input resize-none" />
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2.5 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Tax</span><span>{formatCurrency(totalTax)}</span>
              </div>
              <div className="divider" />
              <div className="flex justify-between text-base font-bold text-gray-900 dark:text-white">
                <span>Grand Total</span><span>{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={viewModal.open} onClose={() => setViewModal({ open: false, purchase: null })} title="Purchase Order Details" size="xl"
        footer={
          <div className="flex justify-end gap-3 no-print">
            <Button variant="secondary" onClick={() => setViewModal({ open: false, purchase: null })}>Close</Button>
            <Button variant="primary" icon={Printer} onClick={() => window.print()}>Print PDF</Button>
          </div>
        }
      >
        {viewModal.purchase && (
          <div className="p-6 space-y-4 printable-area">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {[
                ['Purchase #', viewModal.purchase.purchase_number],
                ['Supplier', viewModal.purchase.suppliers?.name || '—'],
                ['Date', formatDate(viewModal.purchase.purchase_date)],
                ['Status', viewModal.purchase.payment_status],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{k}</p>
                  <p className="font-medium text-gray-900 dark:text-white capitalize">{v}</p>
                </div>
              ))}
            </div>
            <div className="divider" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    {['Product', 'Qty', 'Price', 'Tax %', 'Discount', 'Total'].map(h => (
                      <th key={h} className="table-cell text-left font-medium text-gray-500 dark:text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(viewModal.purchase.purchase_items || []).map((item, i) => (
                    <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="table-cell">{item.products?.name || '—'}</td>
                      <td className="table-cell">{item.quantity} {item.products?.unit}</td>
                      <td className="table-cell">{formatCurrency(item.purchase_price)}</td>
                      <td className="table-cell">{item.tax_percent}%</td>
                      <td className="table-cell">{formatCurrency(item.discount)}</td>
                      <td className="table-cell font-semibold">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end">
              <div className="text-right space-y-1 text-sm">
                <div className="flex justify-between gap-8 text-gray-600 dark:text-gray-400">
                  <span>Subtotal</span><span>{formatCurrency(viewModal.purchase.subtotal)}</span>
                </div>
                <div className="flex justify-between gap-8 text-gray-600 dark:text-gray-400">
                  <span>Tax</span><span>{formatCurrency(viewModal.purchase.tax)}</span>
                </div>
                <div className="flex justify-between gap-8 font-bold text-gray-900 dark:text-white text-base border-t border-gray-200 dark:border-gray-700 pt-1 mt-1">
                  <span>Total</span><span>{formatCurrency(viewModal.purchase.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
