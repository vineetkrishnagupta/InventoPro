import { useState, useEffect, useCallback } from 'react'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { notificationService } from '../../services'
import { useAuth } from '../../context/AuthContext'
import Button from '../../components/common/Button'
import Pagination from '../../components/common/Pagination'
import Breadcrumb from '../../components/common/Breadcrumb'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'

const PAGE_SIZE = 20

const typeColors = {
  warning: 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800',
  error: 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800',
  success: 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800',
  info: 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800',
}

const typeDots = {
  warning: 'bg-yellow-400', error: 'bg-red-400', success: 'bg-green-400', info: 'bg-blue-400',
}

export default function Notifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [marking, setMarking] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, count } = await notificationService.getAll(user.id, { page, pageSize: PAGE_SIZE })
      setNotifications(data); setTotal(count)
    } catch (err) { toast.error(err.message) }
    finally { setLoading(false) }
  }, [user, page])

  useEffect(() => { load() }, [load])

  const markRead = async (id) => {
    try {
      await notificationService.markRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch { /* non-critical */ }
  }

  const markAllRead = async () => {
    setMarking(true)
    try {
      await notificationService.markAllRead(user.id)
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      toast.success('All notifications marked as read')
    } catch (err) { toast.error(err.message) }
    finally { setMarking(false) }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb items={[{ label: 'Notifications' }]} />
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" icon={CheckCheck} onClick={markAllRead} loading={marking}>
            Mark All Read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-4">
              <div className="flex gap-3">
                <div className="skeleton w-3 h-3 rounded-full mt-1" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-1/3 rounded" />
                  <div className="skeleton h-3 w-2/3 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="card p-16 text-center">
          <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No notifications yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(notif => (
            <div
              key={notif.id}
              onClick={() => !notif.is_read && markRead(notif.id)}
              className={clsx(
                'card p-4 border transition-all cursor-pointer',
                !notif.is_read ? typeColors[notif.type] || typeColors.info : '',
                !notif.is_read ? 'hover:shadow-md' : 'opacity-70 hover:opacity-100'
              )}
            >
              <div className="flex items-start gap-3">
                <div className={clsx('w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0', notif.is_read ? 'bg-gray-200 dark:bg-gray-600' : typeDots[notif.type] || typeDots.info)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={clsx('text-sm font-semibold', notif.is_read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white')}>
                      {notif.title}
                    </p>
                    {!notif.is_read && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markRead(notif.id) }}
                        className="text-gray-400 hover:text-gray-600 p-0.5 flex-shrink-0"
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{notif.message}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} onPageChange={setPage} totalItems={total} pageSize={PAGE_SIZE} />
    </div>
  )
}
