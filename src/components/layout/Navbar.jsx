import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Menu,
  Bell,
  Moon,
  Sun,
  LogOut,
  User,
  Settings,
  ChevronDown,
  Check,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'

export default function Navbar({ onMenuClick }) {
  const { user, profile, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loggingOut, setLoggingOut] = useState(false)

  const userMenuRef = useRef(null)
  const notifRef = useRef(null)

  useEffect(() => {
    if (user) fetchNotifications()
  }, [user])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchNotifications = async () => {
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      setNotifications(data || [])
      setUnreadCount((data || []).filter(n => !n.is_read).length)
    } catch { /* non-critical */ }
  }

  const markAllRead = async () => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch { /* non-critical */ }
  }

  const markOneRead = async (id) => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch { /* non-critical */ }
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
      navigate('/login')
    } catch (err) {
      toast.error('Failed to logout')
    } finally {
      setLoggingOut(false)
    }
  }

  const notifTypeColor = (type) => {
    const map = { warning: 'text-amber-500', error: 'text-rose-500', success: 'text-emerald-500', info: 'text-blue-500' }
    return map[type] || 'text-blue-500'
  }

  const [quickCreateOpen, setQuickCreateOpen] = useState(false)
  const quickCreateRef = useRef(null)

  useEffect(() => {
    const handleQuickOutside = (e) => {
      if (quickCreateRef.current && !quickCreateRef.current.contains(e.target)) setQuickCreateOpen(false)
    }
    document.addEventListener('mousedown', handleQuickOutside)
    return () => document.removeEventListener('mousedown', handleQuickOutside)
  }, [])

  return (
    <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-3 lg:px-5 flex-shrink-0 sticky top-0 z-20 shadow-2xs">
      {/* Left: Mobile Toggle & Zoho Org Indicator */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Zoho Organization Pill */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer select-none">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 tracking-tight">
            InventoPro Store
          </span>
          <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 bg-[#0066cc]/10 text-[#0066cc] dark:bg-blue-900/30 dark:text-blue-300 rounded">
            Live
          </span>
        </div>
      </div>

      {/* Middle: Zoho Omni-Search Box */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search items, invoices, customers... (Ctrl + /)"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.target.value.trim()) {
                navigate(`/products?search=${encodeURIComponent(e.target.value.trim())}`)
              }
            }}
            className="w-full pl-8 pr-12 py-1 text-xs rounded-md bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc] transition-all text-slate-800 dark:text-slate-100 placeholder-slate-400"
          />
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-200/60 dark:bg-slate-700 rounded border border-slate-300/60 dark:border-slate-600">
              /
            </kbd>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Zoho Quick Create "+" Button */}
        <div className="relative" ref={quickCreateRef}>
          <button
            onClick={() => setQuickCreateOpen(!quickCreateOpen)}
            className="flex items-center gap-1 px-2.5 py-1 bg-[#0066cc] hover:bg-[#0052a3] text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
            title="Quick Create"
          >
            <span className="text-base leading-none font-bold">+</span>
            <span className="hidden sm:inline">New</span>
          </button>

          {quickCreateOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xl z-50 animate-slide-down py-1.5">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                Quick Actions
              </div>
              <div className="py-1">
                <Link
                  to="/products"
                  onClick={() => setQuickCreateOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#0066cc] transition-colors"
                >
                  <span className="w-5 h-5 rounded bg-blue-50 text-[#0066cc] flex items-center justify-center font-bold text-xs">+</span>
                  New Product / Item
                </Link>
                <Link
                  to="/purchases"
                  onClick={() => setQuickCreateOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#0066cc] transition-colors"
                >
                  <span className="w-5 h-5 rounded bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">+</span>
                  New Purchase Order
                </Link>
                <Link
                  to="/sales"
                  onClick={() => setQuickCreateOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#0066cc] transition-colors"
                >
                  <span className="w-5 h-5 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">+</span>
                  New Invoice / Sale
                </Link>
                <Link
                  to="/stock-adjustments"
                  onClick={() => setQuickCreateOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#0066cc] transition-colors"
                >
                  <span className="w-5 h-5 rounded bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">+</span>
                  Stock Adjustment
                </Link>
                <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                <Link
                  to="/customers"
                  onClick={() => setQuickCreateOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <span className="w-5 h-5 rounded bg-slate-100 text-slate-600 flex items-center justify-center text-xs">+</span>
                  New Customer
                </Link>
                <Link
                  to="/suppliers"
                  onClick={() => setQuickCreateOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <span className="w-5 h-5 rounded bg-slate-100 text-slate-600 flex items-center justify-center text-xs">+</span>
                  New Supplier
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) fetchNotifications() }}
            className="relative p-1.5 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xl z-50 animate-slide-down overflow-hidden">
              <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className="font-semibold text-slate-900 dark:text-white text-xs">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-[11px] text-[#0066cc] hover:underline font-medium flex items-center gap-1">
                    <Check className="w-3 h-3" />Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={clsx(
                        'px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors',
                        !n.is_read && 'bg-blue-50/40 dark:bg-blue-900/10'
                      )}
                      onClick={() => markOneRead(n.id)}
                    >
                      <div className="flex items-start gap-2">
                        <div className={clsx('mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0', !n.is_read ? 'bg-[#0066cc]' : 'bg-transparent')} />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white">{n.title}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="px-3.5 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30">
                <Link
                  to="/notifications"
                  onClick={() => setNotifOpen(false)}
                  className="block text-center text-xs text-[#0066cc] hover:underline font-medium"
                >
                  View all notifications →
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

        {/* User menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="w-7 h-7 rounded-md bg-[#0066cc] flex items-center justify-center font-bold text-white text-xs shadow-xs">
              {profile?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                {profile?.full_name || 'User'}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize leading-tight">
                {profile?.role || 'Admin'}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xl z-50 animate-slide-down overflow-hidden py-1">
              <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50">
                <p className="text-xs font-semibold text-slate-900 dark:text-white">{profile?.full_name || 'User'}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
              </div>
              <div className="py-1">
                <Link
                  to="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#0066cc] transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  Preferences & Settings
                </Link>
                <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex items-center gap-2 w-full px-3.5 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  {loggingOut ? 'Signing out...' : 'Sign Out'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
