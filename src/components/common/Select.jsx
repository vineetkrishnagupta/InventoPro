import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import clsx from 'clsx'

const Select = forwardRef(({
  label,
  error,
  hint,
  options = [],
  placeholder = 'Select...',
  className = '',
  containerClassName = '',
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
        <select
          ref={ref}
          className={clsx(
            error ? 'input-error' : 'input',
            'appearance-none pr-9 cursor-pointer',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  )
})

Select.displayName = 'Select'

export default Select
