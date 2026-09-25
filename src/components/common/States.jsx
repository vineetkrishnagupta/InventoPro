import { PackageX, AlertCircle, RefreshCw } from 'lucide-react'
import Button from './Button'

export function EmptyState({ title, message, icon: Icon, action, actionLabel }) {
  const DisplayIcon = Icon || PackageX
  return (
    <div className="empty-state">
      <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <DisplayIcon className="w-10 h-10 text-gray-400" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      {message && <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">{message}</p>}
      {action && (
        <div className="mt-4">
          <Button variant="primary" onClick={action}>{actionLabel || 'Get Started'}</Button>
        </div>
      )}
    </div>
  )
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="empty-state">
      <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
        <AlertCircle className="w-10 h-10 text-red-400" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      {message && <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-4">{message}</p>}
      {onRetry && (
        <Button variant="secondary" icon={RefreshCw} onClick={onRetry}>Try Again</Button>
      )}
    </div>
  )
}
