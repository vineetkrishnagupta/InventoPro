import { ChevronRight, Home } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Breadcrumb({ items }) {
  return (
    <nav className="flex items-center gap-1.5 text-xs mb-3 select-none">
      <Link to="/dashboard" className="text-slate-400 hover:text-[#0066cc] dark:hover:text-blue-400 transition-colors flex items-center gap-1">
        <Home className="w-3.5 h-3.5" />
      </Link>
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-1.5">
          <span className="text-slate-300 dark:text-slate-600 font-light">/</span>
          {item.href && index < items.length - 1 ? (
            <Link to={item.href} className="text-slate-500 hover:text-[#0066cc] dark:text-slate-400 dark:hover:text-blue-400 transition-colors font-medium">
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-800 dark:text-slate-200 font-semibold">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
