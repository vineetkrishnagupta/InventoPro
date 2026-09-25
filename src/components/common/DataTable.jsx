import clsx from 'clsx'

// Table wrapper
export function DataTable({ columns, data, loading, emptyMessage = 'No data found', emptyIcon }) {
  const EmptyIcon = emptyIcon

  return (
    <div className="table-container">
      <table className="w-full text-sm">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={clsx(
                  'table-cell table-header text-left whitespace-nowrap',
                  col.className
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="table-row">
                {columns.map((col) => (
                  <td key={col.key} className="table-cell">
                    <div className="skeleton h-4 w-full max-w-xs" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-16 text-center">
                <div className="flex flex-col items-center gap-3">
                  {EmptyIcon && (
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <EmptyIcon className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{emptyMessage}</p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={row.id || i} className="table-row">
                {columns.map((col) => (
                  <td key={col.key} className={clsx('table-cell', col.cellClassName)}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

// Skeleton rows for table
export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="table-container">
      <table className="w-full">
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="table-row">
              {Array.from({ length: cols }).map((_, j) => (
                <td key={j} className="table-cell">
                  <div className="skeleton h-4 rounded w-3/4" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
