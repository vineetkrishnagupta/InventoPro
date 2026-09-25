import { useState, useEffect } from 'react'
import { Download, Warehouse } from 'lucide-react'
import { reportService } from '../../services'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import Breadcrumb from '../../components/common/Breadcrumb'
import { DataTable } from '../../components/common/DataTable'
import { formatCurrency, getStockStatus, exportToCSV } from '../../utils'
import toast from 'react-hot-toast'

export default function StockReport() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({ total: 0, low: 0, out: 0, value: 0 })

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const result = await reportService.getStockReport()
        setData(result)
        const low = result.filter(p => { const q = p.inventory?.[0]?.quantity || 0; return q > 0 && q <= p.minimum_stock }).length
        const out = result.filter(p => (p.inventory?.[0]?.quantity || 0) === 0).length
        const value = result.reduce((s, p) => s + (p.inventory?.[0]?.quantity || 0) * p.purchase_price, 0)
        setSummary({ total: result.length, low, out, value })
      } catch (err) { toast.error(err.message) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const handleExport = () => {
    exportToCSV(data.map(p => ({
      Product: p.name, SKU: p.sku, Category: p.categories?.name || '',
      Stock: p.inventory?.[0]?.quantity || 0, 'Min Stock': p.minimum_stock,
      'Purchase Price': p.purchase_price, 'Selling Price': p.selling_price,
      'Stock Value': (p.inventory?.[0]?.quantity || 0) * p.purchase_price,
    })), 'stock_report')
    toast.success('Stock report exported')
  }

  const columns = [
    { key: 'name', label: 'Product', render: (v, row) => (
      <div><p className="font-medium text-gray-900 dark:text-white">{v}</p><p className="text-xs text-gray-500">{row.sku}</p></div>
    )},
    { key: 'categories', label: 'Category', render: (v) => v?.name || '—' },
    { key: 'quantity', label: 'Stock', render: (_, row) => {
      const qty = row.inventory?.[0]?.quantity || 0
      return <span className="font-semibold">{qty}</span>
    }},
    { key: 'minimum_stock', label: 'Min Stock', render: (v) => v },
    { key: 'purchase_price', label: 'Purchase Price', render: (v) => formatCurrency(v) },
    { key: 'selling_price', label: 'Selling Price', render: (v) => formatCurrency(v) },
    { key: 'stock_value', label: 'Stock Value', render: (_, row) => {
      const qty = row.inventory?.[0]?.quantity || 0
      return <span className="font-medium">{formatCurrency(qty * row.purchase_price)}</span>
    }},
    { key: 'stock_status', label: 'Status', render: (_, row) => {
      const qty = row.inventory?.[0]?.quantity || 0
      const status = getStockStatus(qty, row.minimum_stock)
      return <Badge variant={status.variant}>{status.label}</Badge>
    }},
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb items={[{ label: 'Reports' }, { label: 'Stock Report' }]} />
      <div className="page-header">
        <div><h1 className="page-title">Stock Report</h1><p className="text-sm text-gray-500 dark:text-gray-400">{data.length} products</p></div>
        <Button variant="secondary" size="sm" icon={Download} onClick={handleExport} disabled={!data.length}>Export</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Products', value: summary.total, color: 'text-blue-600' },
          { label: 'Low Stock', value: summary.low, color: 'text-yellow-600' },
          { label: 'Out of Stock', value: summary.out, color: 'text-red-600' },
          { label: 'Stock Value', value: formatCurrency(summary.value), color: 'text-emerald-600' },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <DataTable columns={columns} data={data} loading={loading} emptyMessage="No stock data." emptyIcon={Warehouse} />
      </div>
    </div>
  )
}
