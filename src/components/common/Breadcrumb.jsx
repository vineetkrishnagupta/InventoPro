import { ChevronRight, Home } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Breadcrumb({ items }) {
  return (
    <nav className="flex items-center gap-1 text-sm mb-4">
      <Link to="/dashboard" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
        <Home className="w-3.5 h-3.5" />
      </Link>
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-1">
          <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
          {item.href && index < items.length - 1 ? (
            <Link to={item.href} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-700 dark:text-gray-300 font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
