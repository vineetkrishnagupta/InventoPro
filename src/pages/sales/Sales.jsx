import { useState, useEffect, useCallback } from 'react'
import { Plus, Eye, DollarSign, Trash2, Search, ShoppingBag, Printer } from 'lucide-react'
import { salesService, customerService, productService } from '../../services'
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
import { formatCurrency, formatDate, generateInvoiceNumber, paymentStatusVariant } from '../../utils'
import { format } from 'date-fns'

const PAGE_SIZE = 15

export default function Sales() {
  const { user, isStaff } = useAuth()
  const [sales, setSales] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [customers, setCustomers] = useState([])
  const [creating, setCreating] = useState(false)
  const [viewModal, setViewModal] = useState({ open: false, sale: null })
  const [form, setForm] = useState({
    customer_id: '', sale_date: format(new Date(), 'yyyy-MM-dd'),
    invoice_number: generateInvoiceNumber(),
    payment_status: 'paid', payment_method: 'cash', notes: '',
    discount: 0,
  })
  const [cartItems, setCartItems] = useState([])
  const [productSearch, setProductSearch] = useState('')
  const [productResults, setProductResults] = useState([])
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data, count } = await salesService.getAll({ search, page, pageSize: PAGE_SIZE })
      setSales(data); setTotal(count)
    } catch (err) { toast.error(err.message) }
    finally { setLoading(false) }
  }, [search, page])

  useEffect(() => { load() }, [load])
  useEffect(() => { customerService.getAll().then(setCustomers).catch(() => {}) }, [])

  useEffect(() => {
    if (productSearch.length < 2) { setProductResults([]); return }
    const timer = setTimeout(async () => {
      try {
        const { data } = await productService.getAll({ search: productSearch, status: 'active', pageSize: 10 })
        setProductResults(data)
      } catch { setProductResults([]) }
    }, 300)
    return () => clearTimeout(timer)
  }, [productSearch])

  const openCreate = () => {
    setForm({ customer_id: '', sale_date: format(new Date(), 'yyyy-MM-dd'), invoice_number: generateInvoiceNumber(),
      payment_status: 'paid', payment_method: 'cash', notes: '', discount: 0 })
    setCartItems([])
    setErrors({})
    setCreating(true)
  }

  const addToCart = (product) => {
    const stock = product.inventory?.[0]?.quantity || 0
    if (stock <= 0) { toast.error(`${product.name} is out of stock`); return }
    const exists = cartItems.find(i => i.product_id === product.id)
    if (exists) {
      if (exists.quantity >= stock) { toast.error(`Only ${stock} units available`); return }
      setCartItems(cartItems.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.selling_price } : i))
    } else {
      setCartItems([...cartItems, {
        product_id: product.id, product, quantity: 1, available_stock: stock,
        selling_price: product.selling_price || 0, tax_percent: product.tax_percent || 0,
        discount: 0, total: product.selling_price || 0,
      }])
    }
    setProductSearch(''); setProductResults([])
  }

  const updateCartItem = (idx, field, value) => {
    setCartItems(cartItems.map((item, i) => {
      if (i !== idx) return item
      const updated = { ...item, [field]: value }
      if (field === 'quantity' && value > item.available_stock) {
        toast.error(`Only ${item.available_stock} units available`)
        return item
      }
      const qty = Number(updated.quantity) || 0
      const price = Number(updated.selling_price) || 0
      const disc = Number(updated.discount) || 0
      updated.total = qty * price - disc
      return updated
    }))
  }

  const removeFromCart = (idx) => setCartItems(cartItems.filter((_, i) => i !== idx))

  const subtotal = cartItems.reduce((s, i) => s + (Number(i.total) || 0), 0)
  const totalTax = cartItems.reduce((s, i) => s + (Number(i.quantity) * Number(i.selling_price) * (Number(i.tax_percent) / 100) || 0), 0)
  const globalDiscount = Number(form.discount) || 0
  const grandTotal = subtotal + totalTax - globalDiscount

  const validate = () => {
    const errs = {}
    if (cartItems.length === 0) errs.items = 'Add at least one product'
    return errs
  }

  const handleSave = async () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); toast.error(Object.values(errs)[0]); return }
    setSaving(true)
    try {
      const saleData = {
        ...form, customer_id: form.customer_id || null,
        subtotal, tax: totalTax, discount: globalDiscount, total_amount: grandTotal, created_by: user.id,
      }
      const itemsData = cartItems.map(({ product, available_stock, ...item }) => ({
        ...item,
        quantity: Number(item.quantity), selling_price: Number(item.selling_price),
        tax_percent: Number(item.tax_percent), discount: Number(item.discount), total: Number(item.total),
      }))
      await salesService.create(saleData, itemsData)
      toast.success('Sale completed!')
      setCreating(false); load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const viewSale = async (id) => {
    try {
      const data = await salesService.getById(id)
      setViewModal({ open: true, sale: data })
    } catch (err) { toast.error(err.message) }
  }

  const customerOptions = customers.map(c => ({ value: c.id, label: c.name }))

  const columns = [
    { key: 'invoice_number', label: 'Invoice', render: (v) => <span className="font-mono font-medium text-gray-900 dark:text-white">{v}</span> },
    { key: 'customers', label: 'Customer', render: (v) => v?.name || 'Walk-in' },
    { key: 'sale_date', label: 'Date', render: (v) => formatDate(v) },
    { key: 'total_amount', label: 'Total', render: (v) => <span className="font-semibold">{formatCurrency(v)}</span> },
    { key: 'payment_status', label: 'Status', render: (v) => <Badge variant={paymentStatusVariant(v)} className="capitalize">{v}</Badge> },
    { key: 'payment_method', label: 'Method', render: (v) => <span className="capitalize">{v || '—'}</span> },
    { key: 'actions', label: '', cellClassName: 'text-right', render: (_, row) => (
      <button onClick={() => viewSale(row.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
        <Eye className="w-4 h-4" />
      </button>
    )},
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb items={[{ label: 'Sales' }, { label: 'Sales Orders' }]} />
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{total} sales total</p>
        </div>
        {isStaff && <Button variant="primary" icon={Plus} onClick={openCreate}>New Sale</Button>}
      </div>

      <div className="card p-4">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search invoice number..." className="max-w-sm" />
      </div>

      <div className="card" style={{ padding: 0 }}>
        <DataTable columns={columns} data={sales} loading={loading} emptyMessage="No sales found." emptyIcon={DollarSign} />
        <div className="px-4 pb-4">
          <Pagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} onPageChange={setPage} totalItems={total} pageSize={PAGE_SIZE} />
        </div>
      </div>

      {/* POS / Create Sale Modal */}
      <Modal isOpen={creating} onClose={() => setCreating(false)} title="New Sale" size="xl"
        footer={
          <div className="flex justify-between items-center">
            <div className="text-sm">
              <span className="text-gray-500">Total: </span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(grandTotal)}</span>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setCreating(false)}>Cancel</Button>
              <Button variant="success" onClick={handleSave} loading={saving} icon={ShoppingBag}>Complete Sale</Button>
            </div>
          </div>
        }
      >
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select label="Customer" options={customerOptions} value={form.customer_id} placeholder="Walk-in customer"
              onChange={(e) => setForm({ ...form, customer_id: e.target.value })} />
            <Input label="Sale Date" type="date" value={form.sale_date}
              onChange={(e) => setForm({ ...form, sale_date: e.target.value })} required />
            <Input label="Invoice Number" value={form.invoice_number}
              onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} />
          </div>

          {/* Product Search */}
          <div>
            <label className="label">Search Products</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={productSearch} onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search by name or SKU..." className="input pl-9" />
              {productResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto">
                  {productResults.map(p => {
                    const stock = p.inventory?.[0]?.quantity || 0
                    return (
                      <button key={p.id} onClick={() => addToCart(p)} disabled={stock <= 0}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</p>
                          <p className="text-xs text-gray-500">{p.sku} · Stock: {stock}</p>
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{formatCurrency(p.selling_price)}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            {errors.items && <p className="text-xs text-red-500 mt-1">{errors.items}</p>}
          </div>

          {/* Cart */}
          {cartItems.length > 0 && (
            <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    {['Product', 'Avail.', 'Qty', 'Price', 'Discount', 'Total', ''].map(h => (
                      <th key={h} className="table-cell text-left text-xs font-medium text-gray-500 dark:text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((item, idx) => (
                    <tr key={idx} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="table-cell">
                        <p className="font-medium text-gray-900 dark:text-white">{item.product?.name}</p>
                        <p className="text-xs text-gray-500">{item.product?.sku}</p>
                      </td>
                      <td className="table-cell text-gray-500">{item.available_stock}</td>
                      <td className="table-cell w-20">
                        <input type="number" min="1" max={item.available_stock} value={item.quantity}
                          onChange={(e) => updateCartItem(idx, 'quantity', Number(e.target.value))}
                          className="input text-center" />
                      </td>
                      <td className="table-cell w-28">
                        <input type="number" min="0" step="0.01" value={item.selling_price}
                          onChange={(e) => updateCartItem(idx, 'selling_price', Number(e.target.value))}
                          className="input" />
                      </td>
                      <td className="table-cell w-24">
                        <input type="number" min="0" value={item.discount}
                          onChange={(e) => updateCartItem(idx, 'discount', Number(e.target.value))}
                          className="input" />
                      </td>
                      <td className="table-cell font-semibold text-gray-900 dark:text-white">{formatCurrency(item.total)}</td>
                      <td className="table-cell">
                        <button onClick={() => removeFromCart(idx)} className="p-1 text-red-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Select label="Payment Status" value={form.payment_status}
                options={[{ value: 'paid', label: 'Paid' }, { value: 'partial', label: 'Partial' }, { value: 'pending', label: 'Pending' }]}
                onChange={(e) => setForm({ ...form, payment_status: e.target.value })} placeholder="" />
              <Select label="Payment Method" value={form.payment_method}
                options={[{ value: 'cash', label: 'Cash' }, { value: 'card', label: 'Card' }, { value: 'upi', label: 'UPI' }, { value: 'bank', label: 'Bank Transfer' }]}
                onChange={(e) => setForm({ ...form, payment_method: e.target.value })} placeholder="" />
              <Input label="Global Discount (₹)" type="number" min="0" value={form.discount}
                onChange={(e) => setForm({ ...form, discount: e.target.value })} />
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2.5 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Tax</span><span>{formatCurrency(totalTax)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Discount</span><span>-{formatCurrency(globalDiscount)}</span>
              </div>
              <div className="divider" />
              <div className="flex justify-between text-base font-bold text-gray-900 dark:text-white">
                <span>Grand Total</span><span>{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* View Sale Modal */}
      <Modal isOpen={viewModal.open} onClose={() => setViewModal({ open: false, sale: null })} title="Sale Details" size="xl"
        footer={
          <div className="flex justify-end gap-3 no-print">
            <Button variant="secondary" onClick={() => setViewModal({ open: false, sale: null })}>Close</Button>
            <Button variant="primary" icon={Printer} onClick={() => window.print()}>Print PDF</Button>
          </div>
        }
      >
        {viewModal.sale && (
          <div className="p-6 space-y-4 printable-area">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {[['Invoice', viewModal.sale.invoice_number], ['Customer', viewModal.sale.customers?.name || 'Walk-in'],
                ['Date', formatDate(viewModal.sale.sale_date)], ['Status', viewModal.sale.payment_status]].map(([k, v]) => (
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
                  {(viewModal.sale.sale_items || []).map((item, i) => (
                    <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="table-cell">{item.products?.name || '—'}</td>
                      <td className="table-cell">{item.quantity}</td>
                      <td className="table-cell">{formatCurrency(item.selling_price)}</td>
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
                  <span>Subtotal</span><span>{formatCurrency(viewModal.sale.subtotal)}</span>
                </div>
                <div className="flex justify-between gap-8 text-gray-600 dark:text-gray-400">
                  <span>Tax</span><span>{formatCurrency(viewModal.sale.tax)}</span>
                </div>
                <div className="flex justify-between gap-8 text-gray-600 dark:text-gray-400">
                  <span>Discount</span><span>-{formatCurrency(viewModal.sale.discount)}</span>
                </div>
                <div className="flex justify-between gap-8 font-bold text-gray-900 dark:text-white text-base border-t border-gray-200 dark:border-gray-700 pt-1">
                  <span>Total</span><span>{formatCurrency(viewModal.sale.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
