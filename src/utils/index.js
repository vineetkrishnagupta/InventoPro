import { format, parseISO, isValid } from 'date-fns'

// Format currency
export function formatCurrency(amount, currency = 'INR') {
  if (amount == null || isNaN(amount)) return '₹0.00'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Format number with commas
export function formatNumber(num) {
  if (num == null || isNaN(num)) return '0'
  return new Intl.NumberFormat('en-IN').format(num)
}

// Format date
export function formatDate(date, fmt = 'dd MMM yyyy') {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return isValid(d) ? format(d, fmt) : '—'
  } catch {
    return '—'
  }
}

// Format datetime
export function formatDateTime(date) {
  return formatDate(date, 'dd MMM yyyy, hh:mm a')
}

// Generate invoice number
export function generateInvoiceNumber(prefix = 'INV') {
  const date = format(new Date(), 'yyyyMMdd')
  const random = Math.floor(Math.random() * 9000) + 1000
  return `${prefix}-${date}-${random}`
}

// Generate purchase number
export function generatePurchaseNumber() {
  return generateInvoiceNumber('PO')
}

// Calculate percentage change
export function percentageChange(current, previous) {
  if (!previous || previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

// Truncate text
export function truncate(text, length = 50) {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

// Get stock status
export function getStockStatus(quantity, minimumStock) {
  if (quantity <= 0) return { label: 'Out of Stock', variant: 'red' }
  if (quantity <= minimumStock) return { label: 'Low Stock', variant: 'yellow' }
  return { label: 'In Stock', variant: 'green' }
}

// Parse CSV
export function parseCSV(csvText) {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
    return headers.reduce((obj, header, i) => {
      obj[header] = values[i] || ''
      return obj
    }, {})
  })
}

// Export to CSV
export function exportToCSV(data, filename = 'export') {
  if (!data || data.length === 0) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => {
        const val = row[h]
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : (val ?? '')
      }).join(',')
    ),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}_${format(new Date(), 'yyyyMMdd')}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

// Debounce
export function debounce(fn, delay = 300) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

// Deep clone
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

// Flatten object (for form defaults)
export function flattenObject(obj, prefix = '') {
  return Object.keys(obj).reduce((acc, key) => {
    const value = obj[key]
    const newKey = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(acc, flattenObject(value, newKey))
    } else {
      acc[newKey] = value
    }
    return acc
  }, {})
}

// Payment status badge variant
export function paymentStatusVariant(status) {
  const map = {
    paid: 'green',
    partial: 'yellow',
    pending: 'red',
    cancelled: 'gray',
  }
  return map[status] || 'gray'
}

// Role badge variant
export function roleVariant(role) {
  const map = {
    admin: 'purple',
    manager: 'blue',
    staff: 'green',
    viewer: 'gray',
  }
  return map[role] || 'gray'
}
