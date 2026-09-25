import clsx from 'clsx'

export default function Badge({ children, variant = 'gray', className = '' }) {
  const variants = {
    gray: 'badge-gray',
    green: 'badge-green',
    red: 'badge-red',
    yellow: 'badge-yellow',
    blue: 'badge-blue',
    purple: 'badge-purple',
  }

  return (
    <span className={clsx(variants[variant] || 'badge-gray', className)}>
      {children}
    </span>
  )
}
