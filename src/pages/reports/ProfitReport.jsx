import { useState, useCallback } from 'react'
import { PieChart, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { reportService } from '../../services'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Breadcrumb from '../../components/common/Breadcrumb'
import { formatCurrency } from '../../utils'
import toast from 'react-hot-toast'
import { format, subDays } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts'
import clsx from 'clsx'

export default function ProfitReport() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await reportService.getProfitReport(filters)
      setData(result)
    } catch (err) { toast.error(err.message) }
    finally { setLoading(false) }
  }, [filters])

  const margin = data ? (data.grossProfit / (data.revenue || 1)) * 100 : 0

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb items={[{ label: 'Reports' }, { label: 'Profit Report' }]} />
      <div className="page-header">
        <h1 className="page-title">Profit Report</h1>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <Input label="Start Date" type="date" value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} containerClassName="w-40" />
          <Input label="End Date" type="date" value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} containerClassName="w-40" />
          <Button variant="primary" onClick={load} loading={loading} icon={PieChart}>Generate Report</Button>
        </div>
      </div>

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Revenue</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(data.revenue)}</p>
                </div>
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Cost of Goods</p>
                  <p className="text-xl font-bold text-orange-600">{formatCurrency(data.cogs)}</p>
                </div>
              </div>
            </div>
            <div className={clsx('card p-6', data.grossProfit >= 0 ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800')}>
              <div className="flex items-center gap-3 mb-3">
                <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', data.grossProfit >= 0 ? 'bg-blue-100 dark:bg-blue-900/20' : 'bg-red-100 dark:bg-red-900/20')}>
                  <DollarSign className={clsx('w-5 h-5', data.grossProfit >= 0 ? 'text-blue-600' : 'text-red-600')} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Gross Profit ({margin.toFixed(1)}% margin)</p>
                  <p className={clsx('text-xl font-bold', data.grossProfit >= 0 ? 'text-blue-600' : 'text-red-600')}>
                    {formatCurrency(data.grossProfit)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="card p-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Revenue vs Cost Overview</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={[{ name: 'Financial Summary', Revenue: data.revenue, 'Cost of Goods': data.cogs, 'Gross Profit': Math.max(0, data.grossProfit) }]}
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v.toLocaleString('en-IN')}`} width={80} />
                <Tooltip formatter={(val) => formatCurrency(val)} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                <Bar dataKey="Revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Cost of Goods" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Gross Profit" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {!data && !loading && (
        <div className="card p-16 text-center">
          <PieChart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Select a date range and click Generate Report</p>
        </div>
      )}
    </div>
  )
}
