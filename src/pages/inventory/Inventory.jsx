import { useState, useEffect, useCallback } from 'react'
import { Layers, AlertTriangle, Download } from 'lucide-react'
import { inventoryService, categoryService } from '../../services'
import SearchInput from '../../components/common/SearchInput'
import Select from '../../components/common/Select'
import Badge from '../../components/common/Badge'
import Pagination from '../../components/common/Pagination'
import Breadcrumb from '../../components/common/Breadcrumb'
import { DataTable } from '../../components/common/DataTable'
import Button from '../../components/common/Button'
import toast from 'react-hot-toast'
import { formatCurrency, getStockStatus, exportToCSV } from '../../utils'
import clsx from 'clsx'

const PAGE_SIZE = 20

export default function Inventory() {
  const [inventory, setInventory] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [stockFilter, setStockFilter] = useState('')
  const [categories, setCategories] = useState([])
  const [page, setPage] = useState(1)
  const [summary, setSummary] = useState({ total: 0, low: 0, out: 0, value: 0 })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data, count } = await inventoryService.getAll({
        search, category: categoryFilter, stockStatus: stockFilter, page, pageSize: PAGE_SIZE,
      })
      setInventory(data)
      setTotal(count)

      // Summary
      const { data: allData } = await inventoryService.getAll({ pageSize: 9999 })
      const low = allData.filter(p => { const q = p.inventory?.[0]?.quantity || 0; return q > 0 && q <= p.minimum_stock }).length
      const out = allData.filter(p => (p.inventory?.[0]?.quantity || 0) === 0).length
      const value = allData.reduce((s, p) => s + (p.inventory?.[0]?.quantity || 0) * (p.purchase_price || 0), 0)
      setSummary({ total: allData.length, low, out, value })
    } catch (err) { toast.error(err.message) }
    finally { setLoading(false) }
  }, [search, categoryFilter, stockFilter, page])

  useEffect(() => { load() }, [load])
  useEffect(() => { categoryService.getAll().then(setCategories).catch(() => {}) }, [])

  const handleExport = () => {
    exportToCSV(inventory.map(p => ({
      Product: p.name, SKU: p.sku, Category: p.categories?.name || '',
      'Current Stock': p.inventory?.[0]?.quantity || 0, 'Min Stock': p.minimum_stock,
      'Purchase Price': p.purchase_price, 'Selling Price': p.selling_price,
      'Stock Value': (p.inventory?.[0]?.quantity || 0) * p.purchase_price,
      Status: getStockStatus(p.inventory?.[0]?.quantity || 0, p.minimum_stock).label,
    })), 'stock_report')
    toast.success('Stock report exported')
  }

  const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }))

  const columns = [
    { key: 'name', label: 'Product', render: (v, row) => (
      <div>
        <p className="font-medium text-gray-900 dark:text-white">{v}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{row.sku}</p>
      </div>
    )},
    { key: 'categories', label: 'Category', render: (v) => v?.name || '—' },
    { key: 'quantity', label: 'Current Stock', render: (_, row) => {
      const qty = row.inventory?.[0]?.quantity || 0
      const status = getStockStatus(qty, row.minimum_stock)
      return (
        <div className="flex items-center gap-2">
          <span className={clsx('font-semibold text-base', status.variant === 'red' ? 'text-red-600' : status.variant === 'yellow' ? 'text-yellow-600' : 'text-gray-900 dark:text-white')}>
            {qty}
          </span>
        </div>
      )
    }},
    { key: 'minimum_stock', label: 'Min Stock', render: (v) => <span className="text-gray-500 dark:text-gray-400">{v}</span> },
    { key: 'purchase_price', label: 'Purchase Price', render: (v) => formatCurrency(v) },
    { key: 'selling_price', label: 'Selling Price', render: (v) => formatCurrency(v) },
    { key: 'stock_value', label: 'Stock Value', render: (_, row) => {
      const qty = row.inventory?.[0]?.quantity || 0
      return <span className="font-medium">{formatCurrency(qty * row.purchase_price)}</span>
    }},
    { key: 'stock_status', label: 'Status', render: (_, row) => {
      const qty = row.inventory?.[0]?.quantity || 0
      const status = getStockStatus(qty, row.minimum_stock)
      return (
        <div className="flex items-center gap-1.5">
          {status.variant === 'yellow' && <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />}
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      )
    }},
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb items={[{ label: 'Inventory' }, { label: 'Stock' }]} />
      <div className="page-header">
        <div>
          <h1 className="page-title">Stock Overview</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{total} products</p>
        </div>
        <Button variant="secondary" size="sm" icon={Download} onClick={handleExport}>Export</Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Products', value: summary.total, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Low Stock', value: summary.low, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
          { label: 'Out of Stock', value: summary.out, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
          { label: 'Total Value', value: formatCurrency(summary.value), color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        ].map(stat => (
          <div key={stat.label} className={clsx('card p-4', stat.bg)}>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
            <p className={clsx('text-xl font-bold', stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search product or SKU..." className="flex-1 min-w-48" />
          <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }} className="input w-auto min-w-36">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={stockFilter} onChange={(e) => { setStockFilter(e.target.value); setPage(1) }} className="input w-auto">
            <option value="">All Stock Status</option>
            <option value="in">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <DataTable columns={columns} data={inventory} loading={loading} emptyMessage="No inventory records found." emptyIcon={Layers} />
        <div className="px-4 pb-4">
          <Pagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} onPageChange={setPage} totalItems={total} pageSize={PAGE_SIZE} />
        </div>
      </div>
    </div>
  )
}
