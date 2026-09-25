import { forwardRef } from 'react'
import clsx from 'clsx'

const Input = forwardRef(({
  label,
  error,
  hint,
  icon: Icon,
  iconRight: IconRight,
  className = '',
  containerClassName = '',
  type = 'text',
  required = false,
  ...props
}, ref) => {
  return (
    <div className={clsx('form-group', containerClassName)}>
      {label && (
        <label className="label">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={clsx(
            error ? 'input-error' : 'input',
            Icon ? 'pl-9' : '',
            IconRight ? 'pr-9' : '',
            className
          )}
          {...props}
        />
        {IconRight && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <IconRight className="w-4 h-4" />
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  )
})

Input.displayName = 'Input'

export default Input
