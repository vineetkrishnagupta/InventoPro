import { useState, useEffect, useCallback } from 'react'
import {
  Package, TrendingUp, TrendingDown, Users, Truck, AlertTriangle,
  ShoppingBag, DollarSign, BarChart2, RefreshCw, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts'
import { dashboardService } from '../../services'
import { formatCurrency, formatDate, formatNumber } from '../../utils'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import { format, subDays, eachDayOfInterval } from 'date-fns'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const DATE_FILTERS = [
  { label: 'Today', value: 'today', days: 0 },
  { label: '7 Days', value: '7d', days: 7 },
  { label: '30 Days', value: '30d', days: 30 },
]

function StatCard({ title, value, icon: Icon, iconBg, iconColor, change, prefix = '', suffix = '' }) {
  const isPositive = change >= 0
  return (
    <div className="stat-card">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {prefix}{typeof value === 'number' ? formatNumber(Math.round(value)) : value}{suffix}
        </p>
        {change !== undefined && (
          <div className={clsx(
            'flex items-center gap-1 text-xs font-medium mt-1',
            isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          )}>
            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {Math.abs(change).toFixed(1)}% vs yesterday
          </div>
        )}
      </div>
      <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', iconBg)}>
        <Icon className={clsx('w-6 h-6', iconColor)} />
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label, prefix = '' }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-lg text-sm">
      <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-600 dark:text-gray-400">{p.name}:</span>
          <span className="font-semibold text-gray-900 dark:text-white">{prefix}{formatNumber(Math.round(p.value))}</span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState(null)
  const [chartData, setChartData] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(false)
  const [dateFilter, setDateFilter] = useState('7d')
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const loadStats = useCallback(async () => {
    try {
      const data = await dashboardService.getStats()
      setStats(data)
    } catch (err) {
      toast.error('Failed to load dashboard stats')
    }
  }, [])

  const loadCharts = useCallback(async () => {
    setChartLoading(true)
    try {
      const days = dateFilter === 'today' ? 1 : dateFilter === '7d' ? 7 : 30
      const [salesData, purchaseData, topP] = await Promise.all([
        dashboardService.getSalesChart(days),
        dashboardService.getPurchasesChart(days),
        dashboardService.getTopProducts(5),
      ])

      // Build chart data grouped by date
      const end = new Date()
      const start = subDays(end, days - 1)
      const dateRange = eachDayOfInterval({ start, end })

      const salesByDate = {}
      const purchaseByDate = {}
      salesData.forEach(s => { salesByDate[s.sale_date] = (salesByDate[s.sale_date] || 0) + (s.total_amount || 0) })
      purchaseData.forEach(p => { purchaseByDate[p.purchase_date] = (purchaseByDate[p.purchase_date] || 0) + (p.total_amount || 0) })

      const merged = dateRange.map(d => {
        const key = format(d, 'yyyy-MM-dd')
        return {
          date: format(d, days <= 7 ? 'EEE dd' : 'dd MMM'),
          Sales: Math.round(salesByDate[key] || 0),
          Purchases: Math.round(purchaseByDate[key] || 0),
        }
      })

      setChartData(merged)
      setTopProducts(topP)
    } catch {
      // non-critical
    } finally {
      setChartLoading(false)
    }
  }, [dateFilter])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([loadStats(), loadCharts()])
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (!loading) loadCharts()
  }, [dateFilter])

  const handleRefresh = async () => {
    setLoading(true)
    await Promise.all([loadStats(), loadCharts()])
    setLoading(false)
    setLastRefresh(new Date())
    toast.success('Dashboard refreshed')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Welcome back, <strong>{profile?.full_name?.split(' ')[0] || 'User'}</strong> · Last updated {format(lastRefresh, 'hh:mm a')}
          </p>
        </div>
        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={handleRefresh} loading={loading}>
          Refresh
        </Button>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card p-6">
              <div className="space-y-3">
                <div className="skeleton h-4 w-24 rounded" />
                <div className="skeleton h-7 w-20 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Total Products"
            value={stats?.totalProducts || 0}
            icon={Package}
            iconBg="bg-blue-50 dark:bg-blue-900/20"
            iconColor="text-blue-600 dark:text-blue-400"
          />
          <StatCard
            title="Stock Value"
            value={stats?.stockValue || 0}
            icon={DollarSign}
            iconBg="bg-emerald-50 dark:bg-emerald-900/20"
            iconColor="text-emerald-600 dark:text-emerald-400"
            prefix="₹"
          />
          <StatCard
            title="Today's Sales"
            value={stats?.todaySales || 0}
            icon={TrendingUp}
            iconBg="bg-violet-50 dark:bg-violet-900/20"
            iconColor="text-violet-600 dark:text-violet-400"
            prefix="₹"
          />
          <StatCard
            title="Today's Purchases"
            value={stats?.todayPurchases || 0}
            icon={ShoppingBag}
            iconBg="bg-orange-50 dark:bg-orange-900/20"
            iconColor="text-orange-600 dark:text-orange-400"
            prefix="₹"
          />
          <StatCard
            title="Low Stock"
            value={stats?.lowStock || 0}
            icon={AlertTriangle}
            iconBg="bg-yellow-50 dark:bg-yellow-900/20"
            iconColor="text-yellow-600 dark:text-yellow-400"
          />
          <StatCard
            title="Out of Stock"
            value={stats?.outOfStock || 0}
            icon={Package}
            iconBg="bg-red-50 dark:bg-red-900/20"
            iconColor="text-red-600 dark:text-red-400"
          />
          <StatCard
            title="Total Suppliers"
            value={stats?.totalSuppliers || 0}
            icon={Truck}
            iconBg="bg-sky-50 dark:bg-sky-900/20"
            iconColor="text-sky-600 dark:text-sky-400"
          />
          <StatCard
            title="Total Customers"
            value={stats?.totalCustomers || 0}
            icon={Users}
            iconBg="bg-pink-50 dark:bg-pink-900/20"
            iconColor="text-pink-600 dark:text-pink-400"
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Sales vs Purchase chart */}
        <div className="card p-6 xl:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Sales vs Purchases</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Revenue comparison over time</p>
            </div>
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {DATE_FILTERS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setDateFilter(f.value)}
                  className={clsx(
                    'px-3 py-1 rounded-md text-xs font-medium transition-all',
                    dateFilter === f.value
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {chartLoading ? (
            <div className="skeleton h-48 rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="purchaseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${formatNumber(v)}`} width={70} />
                <Tooltip content={<CustomTooltip prefix="₹" />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                <Area type="monotone" dataKey="Sales" stroke="#3b82f6" strokeWidth={2} fill="url(#salesGradient)" dot={false} />
                <Area type="monotone" dataKey="Purchases" stroke="#8b5cf6" strokeWidth={2} fill="url(#purchaseGradient)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Products */}
        <div className="card p-6">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Top Selling Products</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">By quantity sold</p>
          </div>

          {chartLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="skeleton h-4 w-4 rounded-full" />
                  <div className="flex-1">
                    <div className="skeleton h-3 w-3/4 rounded mb-1.5" />
                    <div className="skeleton h-2 w-full rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : topProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <BarChart2 className="w-10 h-10 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No sales data yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topProducts.map((product, i) => {
                const maxQty = topProducts[0]?.totalQty || 1
                const pct = (product.totalQty / maxQty) * 100
                const colors = ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-orange-500', 'bg-pink-500']
                return (
                  <div key={product.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={clsx('w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0', colors[i] || 'bg-gray-400')}>
                          {i + 1}
                        </span>
                        <span className="text-gray-700 dark:text-gray-300 truncate">{product.name}</span>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white ml-2 flex-shrink-0">{formatNumber(product.totalQty)}</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                      <div
                        className={clsx('h-1.5 rounded-full transition-all', colors[i] || 'bg-gray-400')}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Low Stock Alert */}
      {stats?.lowStock > 0 && (
        <div className="card p-4 border-l-4 border-l-yellow-400 bg-yellow-50 dark:bg-yellow-900/10">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                {stats.lowStock} product{stats.lowStock !== 1 ? 's' : ''} running low on stock
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5">
                Review the inventory page to restock before running out.
              </p>
            </div>
            <a
              href="/inventory"
              className="ml-auto btn btn-sm border border-yellow-300 dark:border-yellow-700 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50"
            >
              View Stock
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
