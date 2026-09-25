import clsx from 'clsx'

export default function Card({ children, className = '', padding = true }) {
  return (
    <div className={clsx('card', padding && 'p-6', className)}>
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, actions, className = '' }) {
  return (
    <div className={clsx('flex items-start justify-between gap-4 mb-4', className)}>
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  )
}
