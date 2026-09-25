import { useState, useCallback } from 'react'
import { Download, TrendingUp } from 'lucide-react'
import { reportService, customerService } from '../../services'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Badge from '../../components/common/Badge'
import Breadcrumb from '../../components/common/Breadcrumb'
import { DataTable } from '../../components/common/DataTable'
import { formatCurrency, formatDate, exportToCSV, paymentStatusVariant } from '../../utils'
import toast from 'react-hot-toast'
import { format, subDays } from 'date-fns'

export default function SalesReport() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    paymentStatus: '',
  })
  const [summary, setSummary] = useState({ total: 0, count: 0, tax: 0, discount: 0 })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await reportService.getSalesReport(filters)
      setData(result)
      setSummary({
        count: result.length,
        total: result.reduce((s, r) => s + (r.total_amount || 0), 0),
        tax: result.reduce((s, r) => s + (r.tax || 0), 0),
        discount: result.reduce((s, r) => s + (r.discount || 0), 0),
      })
    } catch (err) { toast.error(err.message) }
    finally { setLoading(false) }
  }, [filters])

  const handleExport = () => {
    exportToCSV(data.map(r => ({
      Invoice: r.invoice_number, Date: formatDate(r.sale_date),
      Customer: r.customers?.name || 'Walk-in',
      Subtotal: r.subtotal, Tax: r.tax, Discount: r.discount,
      Total: r.total_amount, Status: r.payment_status, Method: r.payment_method,
    })), 'sales_report')
    toast.success('Sales report exported')
  }

  const columns = [
    { key: 'invoice_number', label: 'Invoice', render: (v) => <span className="font-mono text-sm">{v}</span> },
    { key: 'sale_date', label: 'Date', render: (v) => formatDate(v) },
    { key: 'customers', label: 'Customer', render: (v) => v?.name || 'Walk-in' },
    { key: 'subtotal', label: 'Subtotal', render: (v) => formatCurrency(v) },
    { key: 'tax', label: 'Tax', render: (v) => formatCurrency(v) },
    { key: 'discount', label: 'Discount', render: (v) => formatCurrency(v) },
    { key: 'total_amount', label: 'Total', render: (v) => <span className="font-semibold">{formatCurrency(v)}</span> },
    { key: 'payment_status', label: 'Status', render: (v) => <Badge variant={paymentStatusVariant(v)} className="capitalize">{v}</Badge> },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb items={[{ label: 'Reports' }, { label: 'Sales Report' }]} />
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Report</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{data.length} records</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={Download} onClick={handleExport} disabled={!data.length}>Export</Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Sales', value: formatCurrency(summary.total), color: 'text-green-600' },
          { label: 'Total Orders', value: summary.count, color: 'text-blue-600' },
          { label: 'Total Tax', value: formatCurrency(summary.tax), color: 'text-orange-600' },
          { label: 'Total Discount', value: formatCurrency(summary.discount), color: 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <Input label="Start Date" type="date" value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} containerClassName="w-40" />
          <Input label="End Date" type="date" value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} containerClassName="w-40" />
          <Select label="Payment Status" value={filters.paymentStatus} placeholder="All"
            options={[{ value: 'paid', label: 'Paid' }, { value: 'partial', label: 'Partial' }, { value: 'pending', label: 'Pending' }]}
            onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })} containerClassName="w-40" />
          <Button variant="primary" onClick={load} loading={loading} icon={TrendingUp}>Generate Report</Button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <DataTable columns={columns} data={data} loading={loading} emptyMessage="No sales data. Apply filters and click Generate Report." emptyIcon={TrendingUp} />
      </div>
    </div>
  )
}
