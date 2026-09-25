import { useState, useEffect, useCallback } from 'react'
import { ScrollText, Shield } from 'lucide-react'
import { auditService } from '../../services'
import { useAuth } from '../../context/AuthContext'
import Select from '../../components/common/Select'
import Pagination from '../../components/common/Pagination'
import Breadcrumb from '../../components/common/Breadcrumb'
import Badge from '../../components/common/Badge'
import { DataTable } from '../../components/common/DataTable'
import toast from 'react-hot-toast'
import { formatDateTime } from '../../utils'
import clsx from 'clsx'

const PAGE_SIZE = 20

const ACTION_COLORS = {
  LOGIN: 'blue', LOGOUT: 'gray', CREATE_PRODUCT: 'green', UPDATE_PRODUCT: 'yellow',
  DELETE_PRODUCT: 'red', CREATE_PURCHASE: 'green', CREATE_SALE: 'green',
  STOCK_ADJUSTMENT: 'yellow', CREATE_USER: 'green', UPDATE_USER: 'yellow',
}

const MODULE_OPTIONS = [
  { value: 'AUTH', label: 'Authentication' }, { value: 'PRODUCTS', label: 'Products' },
  { value: 'PURCHASES', label: 'Purchases' }, { value: 'SALES', label: 'Sales' },
  { value: 'INVENTORY', label: 'Inventory' }, { value: 'USERS', label: 'Users' },
]

export default function AuditLogs() {
  const { isAdmin } = useAuth()
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ module: '', action: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data, count } = await auditService.getAll({ ...filters, page, pageSize: PAGE_SIZE })
      setLogs(data); setTotal(count)
    } catch (err) { toast.error(err.message) }
    finally { setLoading(false) }
  }, [filters, page])

  useEffect(() => { load() }, [load])

  const columns = [
    { key: 'profiles', label: 'User', render: (v) => (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-xs font-semibold text-primary-700 dark:text-primary-300">
          {v?.full_name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{v?.full_name || '—'}</p>
          <p className="text-xs text-gray-500">{v?.email}</p>
        </div>
      </div>
    )},
    { key: 'action', label: 'Action', render: (v) => (
      <Badge variant={ACTION_COLORS[v] || 'gray'} className="font-mono text-xs">{v}</Badge>
    )},
    { key: 'module', label: 'Module', render: (v) => <span className="text-gray-600 dark:text-gray-400">{v}</span> },
    { key: 'description', label: 'Description', render: (v) => <span className="text-gray-700 dark:text-gray-300">{v || '—'}</span> },
    { key: 'created_at', label: 'Date & Time', render: (v) => (
      <span className="text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">{formatDateTime(v)}</span>
    )},
  ]

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Admin access required to view audit logs.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb items={[{ label: 'Administration' }, { label: 'Audit Logs' }]} />
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Logs</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{total} log entries</p>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <Select value={filters.module} placeholder="All Modules" options={MODULE_OPTIONS}
            onChange={(e) => { setFilters({ ...filters, module: e.target.value }); setPage(1) }} containerClassName="w-44" />
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <DataTable columns={columns} data={logs} loading={loading} emptyMessage="No audit logs found." emptyIcon={ScrollText} />
        <div className="px-4 pb-4">
          <Pagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} onPageChange={setPage} totalItems={total} pageSize={PAGE_SIZE} />
        </div>
      </div>
    </div>
  )
}
