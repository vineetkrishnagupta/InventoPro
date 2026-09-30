/**
 * Opens a clean print window with the innerHTML of the given element ID.
 * This bypasses the React modal nesting issue where window.print() on
 * the main page hides everything including the modal content.
 *
 * @param {string} elementId - The ID of the DOM element to print
 * @param {string} title     - Document title shown in the print dialog
 */
export function printElement(elementId, title = 'Invoice') {
  const el = document.getElementById(elementId)
  if (!el) {
    console.warn(`[printElement] Element #${elementId} not found.`)
    return
  }

  const content = el.innerHTML

  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) {
    alert('Pop-up blocked. Please allow pop-ups for this site to print.')
    return
  }

  win.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>${title}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <style>
        *, *::before, *::after {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        @page {
          size: A4;
          margin: 16mm 14mm;
        }

        html, body {
          margin: 0;
          padding: 0;
          font-family: 'Inter', Arial, sans-serif;
          font-size: 13px;
          color: #111;
          background: #fff;
          -webkit-font-smoothing: antialiased;
        }

        /* ── Layout ── */
        .p-6   { padding: 24px; }
        .space-y-4 > * + * { margin-top: 16px; }
        .space-y-1 > * + * { margin-top: 4px; }
        .gap-8 { gap: 32px; }

        /* ── Grid ── */
        .grid { display: grid; }
        .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
        .grid-cols-4, .md\\:grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
        .gap-4 { gap: 16px; }

        /* ── Flex ── */
        .flex { display: flex; }
        .justify-between { justify-content: space-between; }
        .justify-end { justify-content: flex-end; }
        .items-center { align-items: center; }
        .text-right { text-align: right; }

        /* ── Typography ── */
        .text-xs  { font-size: 11px; }
        .text-sm  { font-size: 12px; }
        .text-base { font-size: 14px; }
        .font-medium { font-weight: 500; }
        .font-semibold { font-weight: 600; }
        .font-bold { font-weight: 700; }
        .capitalize { text-transform: capitalize; }
        .uppercase { text-transform: uppercase; }
        .tracking-wider { letter-spacing: 0.05em; }

        /* ── Colors ── */
        .text-gray-500, .dark\\:text-gray-400 { color: #6b7280 !important; }
        .text-gray-600, .dark\\:text-gray-400 { color: #4b5563 !important; }
        .text-gray-900, .dark\\:text-white { color: #111827 !important; }
        .text-white { color: #111827 !important; }

        /* ── Spacing ── */
        .mt-1 { margin-top: 4px; }
        .pt-1 { padding-top: 4px; }
        .mt-4 { margin-top: 16px; }

        /* ── Divider ── */
        .divider {
          border: none;
          border-top: 1px solid #d1d5db;
          margin: 12px 0;
        }

        /* ── Table ── */
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
          font-size: 12px;
        }

        thead {
          background-color: #f3f4f6 !important;
        }

        th {
          padding: 8px 10px;
          text-align: left;
          font-weight: 600;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          border-bottom: 2px solid #e5e7eb;
          color: #374151;
        }

        td {
          padding: 8px 10px;
          border-bottom: 1px solid #e5e7eb;
          color: #111827;
        }

        tr:last-child td { border-bottom: none; }

        /* ── Table cell utility ── */
        .table-cell { padding: 8px 10px; font-size: 12px; color: #111827; }

        /* ── Summary box ── */
        .border-t {
          border-top: 1px solid #d1d5db;
        }

        /* ── overflow-x-auto ── */
        .overflow-x-auto { overflow: visible; }

        /* ── Misc ── */
        button, .no-print { display: none !important; }
        img { max-width: 100%; }
      </style>
    </head>
    <body>
      ${content}
    </body>
    </html>
  `)

  win.document.close()

  // Wait for fonts/images to load, then print
  win.onload = () => {
    win.focus()
    win.print()
    win.close()
  }

  // Fallback if onload doesn't fire (e.g. Firefox)
  setTimeout(() => {
    try {
      win.focus()
      win.print()
      win.close()
    } catch (_) {}
  }, 800)
}
