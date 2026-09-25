import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Tag,
  Layers,
  Sliders,
  ShoppingCart,
  Truck,
  DollarSign,
  Users,
  BarChart2,
  TrendingDown,
  TrendingUp,
  PieChart,
  ScrollText,
  Bell,
  Settings,
  ChevronDown,
  ChevronRight,
  X,
  Warehouse,
  ChevronLeft,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import clsx from 'clsx'

const menuGroups = [
  {
    label: null,
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'dashboard' },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { label: 'Products', href: '/products', icon: Package, permission: 'products' },
      { label: 'Categories', href: '/categories', icon: Tag, permission: 'categories' },
      { label: 'Stock', href: '/inventory', icon: Layers, permission: 'stock' },
      { label: 'Stock Adjustments', href: '/stock-adjustments', icon: Sliders, permission: 'stock' },
    ],
  },
  {
    label: 'Purchases',
    items: [
      { label: 'Purchase Orders', href: '/purchases', icon: ShoppingCart, permission: 'purchases' },
      { label: 'Suppliers', href: '/suppliers', icon: Truck, permission: 'suppliers' },
    ],
  },
  {
    label: 'Sales',
    items: [
      { label: 'Sales', href: '/sales', icon: DollarSign, permission: 'sales' },
      { label: 'Customers', href: '/customers', icon: Users, permission: 'customers' },
    ],
  },
  {
    label: 'Reports',
    items: [
      { label: 'Sales Report', href: '/reports/sales', icon: TrendingUp, permission: 'reports' },
      { label: 'Purchase Report', href: '/reports/purchases', icon: TrendingDown, permission: 'reports' },
      { label: 'Stock Report', href: '/reports/stock', icon: Warehouse, permission: 'reports' },
      { label: 'Profit Report', href: '/reports/profit', icon: PieChart, permission: 'reports' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Users', href: '/users', icon: Users, permission: null, adminOnly: true },
      { label: 'Audit Logs', href: '/audit-logs', icon: ScrollText, permission: null, adminOnly: true },
      { label: 'Notifications', href: '/notifications', icon: Bell, permission: 'notifications' },
      { label: 'Settings', href: '/settings', icon: Settings, permission: 'settings' },
    ],
  },
]

export default function Sidebar({ isOpen, onClose, isCollapsed, toggleCollapse }) {
  const { profile, hasPermission, isAdmin } = useAuth()

  const canSee = (item) => {
    if (item.adminOnly && !isAdmin) return false
    if (!item.permission) return true
    return hasPermission(item.permission)
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed top-0 left-0 h-full bg-[#0f172a] z-40 flex flex-col transition-all duration-300',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          isCollapsed ? 'w-[72px]' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className={clsx("flex items-center h-16 px-4 border-b border-slate-700/50 flex-shrink-0", isCollapsed ? "justify-center" : "justify-between")}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0">
              <BarChart2 className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <span className="text-white font-semibold text-sm leading-tight">InventoPro</span>
                <p className="text-slate-500 text-xs leading-tight">Management System</p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* User info */}
        <div className={clsx("py-3 border-b border-slate-700/50 flex-shrink-0 flex items-center", isCollapsed ? "justify-center px-0" : "px-4 gap-3")}>
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-medium">
              {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {profile?.full_name || 'User'}
              </p>
              <p className="text-slate-400 text-xs capitalize">
                {profile?.role || 'viewer'}
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 no-scrollbar">
          {menuGroups.map((group, gi) => {
            const visibleItems = group.items.filter(canSee)
            if (visibleItems.length === 0) return null

            return (
              <div key={gi}>
                {group.label && !isCollapsed && (
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
                    {group.label}
                  </p>
                )}
                {group.label && isCollapsed && (
                  <div className="h-2" />
                )}
                <div className="space-y-0.5">
                  {visibleItems.map((item) => (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      onClick={onClose}
                      title={isCollapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        clsx(
                          'sidebar-item flex items-center',
                          isCollapsed ? 'justify-center px-0' : '',
                          isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'
                        )
                      }
                    >
                      <item.icon className={clsx("w-5 h-5 flex-shrink-0", isCollapsed ? "mx-auto" : "")} />
                      {!isCollapsed && <span className="text-sm ml-3">{item.label}</span>}
                    </NavLink>
                  ))}
                </div>
              </div>
            )
          })}
        </nav>

        {/* Version & Toggle */}
        <div className={clsx("px-4 py-3 border-t border-slate-700/50 flex items-center", isCollapsed ? "justify-center" : "justify-between")}>
          {!isCollapsed && <p className="text-slate-600 text-xs">v1.0.0</p>}
          <button 
            onClick={toggleCollapse}
            className="hidden lg:flex p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </aside>
    </>
  )
}
