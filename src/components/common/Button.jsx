import { Loader2 } from 'lucide-react'
import clsx from 'clsx'

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconRight: IconRight,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    success: 'btn-success',
    ghost: 'btn-ghost',
  }

  const sizes = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={clsx(variants[variant], sizes[size], className)}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : Icon ? (
        <Icon className={clsx('w-4 h-4', size === 'lg' ? 'w-5 h-5' : '')} />
      ) : null}
      {children}
      {!loading && IconRight && <IconRight className="w-4 h-4" />}
    </button>
  )
}
