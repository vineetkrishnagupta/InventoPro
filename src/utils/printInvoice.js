/**
 * printInvoice(data, type)
 * Zoho-style clean, professional invoice / purchase order.
 */

// Accent color map — mirrors ThemeContext ACCENT_COLORS
const ACCENT_MAP = {
  blue:    '#2563eb',
  indigo:  '#4f46e5',
  emerald: '#059669',
  violet:  '#7c3aed',
  rose:    '#e11d48',
  amber:   '#d97706',
  cyan:    '#0891b2',
}

export function printInvoice(data, type = 'sale') {
  if (!data) return

  // ── Theme color from localStorage ────────────────────────────────────────
  const accentId   = localStorage.getItem('theme_accent') || 'blue'
  const themeColor = ACCENT_MAP[accentId] || '#2563eb'

  // ── Business info from localStorage ─────────────────────────────────────
  let biz = {}
  try {
    const key = Object.keys(localStorage).find(k => k.startsWith('ims_business_settings'))
    if (key) biz = JSON.parse(localStorage.getItem(key) || '{}')
  } catch {}

  const bizName    = biz.name    || 'Your Company'
  const bizAddress = biz.address || ''
  const bizPhone   = biz.phone   || ''
  const bizEmail   = biz.email   || ''
  const bizGST     = biz.gst     || ''

  // ── Document fields ──────────────────────────────────────────────────────
  const isSale     = type === 'sale'
  const docNumber  = isSale ? data.invoice_number  : data.purchase_number
  const docTitle   = isSale ? 'TAX INVOICE'        : 'PURCHASE ORDER'
  const docDate    = isSale ? data.sale_date        : data.purchase_date
  const party      = isSale ? (data.customers?.name || 'Walk-in Customer')
                            : (data.suppliers?.name  || '—')
  const partyPhone = isSale ? (data.customers?.phone || '') : (data.suppliers?.phone || '')
  const partyEmail = isSale ? (data.customers?.email || '') : (data.suppliers?.email || '')
  const partyLabel = isSale ? 'Bill To' : 'Vendor'
  const items      = isSale ? (data.sale_items || []) : (data.purchase_items || [])
  const subtotal   = Number(data.subtotal     || 0)
  const taxTotal   = Number(data.tax          || 0)
  const discount   = Number(data.discount     || 0)
  const grandTotal = Number(data.total_amount || 0)
  const status     = (data.payment_status || '').toUpperCase()
  const method     = (data.payment_method || '').replace(/_/g, ' ')
  const notes      = data.notes || ''

  // ── Helpers ───────────────────────────────────────────────────────────────
  const fmt = n => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', minimumFractionDigits: 2
  }).format(Number(n) || 0)

  const fmtDate = d => {
    if (!d) return '—'
    try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) }
    catch { return d }
  }

  // ── Item rows ─────────────────────────────────────────────────────────────
  const rows = items.map((item, i) => {
    const name  = item.products?.name || '—'
    const unit  = item.products?.unit || ''
    const qty   = item.quantity || 0
    const price = Number(isSale ? item.selling_price : item.purchase_price) || 0
    const tax   = Number(item.tax_percent || 0)
    const disc  = Number(item.discount    || 0)
    const total = Number(item.total       || 0)
    return `
      <tr>
        <td class="td-center">${i + 1}</td>
        <td class="td-left">${name}${unit ? `<br/><span class="unit">${unit}</span>` : ''}</td>
        <td class="td-center">${qty}</td>
        <td class="td-right">${fmt(price)}</td>
        <td class="td-center">${tax > 0 ? tax + '%' : '—'}</td>
        <td class="td-right">${disc > 0 ? fmt(disc) : '—'}</td>
        <td class="td-right fw6">${fmt(total)}</td>
      </tr>`
  }).join('')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${docTitle} #${docNumber}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @page { size: A4; margin: 12mm 14mm; }

    body {
      margin: 0; padding: 0;
      font-family: 'Inter', Arial, sans-serif;
      font-size: 12px;
      color: #333;
      background: #fff;
      -webkit-font-smoothing: antialiased;
    }

    /* ── Top color stripe ── */
    .top-stripe {
      height: 5px;
      background: ${themeColor};
      margin-bottom: 24px;
    }

    /* ── Header ── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 28px;
    }

    .biz-name {
      font-size: 22px;
      font-weight: 700;
      color: #111;
      margin: 0 0 6px;
    }
    .biz-detail {
      font-size: 11.5px;
      color: #666;
      line-height: 1.8;
    }

    .doc-block { text-align: right; }
    .doc-type {
      font-size: 11px;
      font-weight: 600;
      color: ${themeColor};
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 4px;
    }
    .doc-number {
      font-size: 20px;
      font-weight: 700;
      color: #111;
      margin-bottom: 8px;
    }
    .doc-meta {
      font-size: 11.5px;
      color: #555;
      line-height: 1.9;
    }
    .doc-meta b { color: #111; }

    /* ── Divider ── */
    .divider { border: none; border-top: 1px solid #E5E7EB; margin: 0 0 20px; }

    /* ── Party row ── */
    .party-row {
      display: flex;
      gap: 32px;
      margin-bottom: 24px;
    }
    .party-col { flex: 1; }
    .party-label {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: ${themeColor};
      margin-bottom: 6px;
    }
    .party-name {
      font-size: 13.5px;
      font-weight: 600;
      color: #111;
      margin-bottom: 3px;
    }
    .party-detail { font-size: 11.5px; color: #666; line-height: 1.8; }

    /* ── Status chip ── */
    .chip {
      display: inline-block;
      padding: 2px 9px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .chip-paid    { background: #D1FAE5; color: #065F46; }
    .chip-pending { background: #FEE2E2; color: #991B1B; }
    .chip-partial { background: #FEF3C7; color: #92400E; }
    .chip-default { background: #F3F4F6; color: #374151; }

    /* ── Table ── */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin-bottom: 4px;
    }
    thead tr {
      background: #F9FAFB;
      border-top: 1px solid #E5E7EB;
      border-bottom: 1px solid #E5E7EB;
    }
    thead th {
      padding: 9px 10px;
      font-size: 10px;
      font-weight: 600;
      color: #6B7280;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      text-align: center;
    }
    thead th.th-left  { text-align: left; }
    thead th.th-right { text-align: right; }

    tbody tr { border-bottom: 1px solid #F3F4F6; }
    tbody tr:last-child { border-bottom: 1px solid #E5E7EB; }

    .td-center { padding: 9px 10px; text-align: center; color: #555; vertical-align: top; }
    .td-left   { padding: 9px 10px; text-align: left;   color: #222; vertical-align: top; }
    .td-right  { padding: 9px 10px; text-align: right;  color: #222; vertical-align: top; }
    .fw6       { font-weight: 600; }
    .unit      { font-size: 10px; color: #999; }

    /* ── Totals ── */
    .totals-wrap {
      display: flex;
      justify-content: flex-end;
      margin-top: 10px;
      margin-bottom: 24px;
    }
    .totals-box { width: 260px; }
    .t-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid #F3F4F6;
      font-size: 12px;
    }
    .t-row .lbl { color: #666; }
    .t-row .val { color: #111; font-weight: 500; }
    .t-total {
      display: flex;
      justify-content: space-between;
      padding: 10px 12px;
      margin-top: 4px;
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-left: 3px solid ${themeColor};
      border-radius: 6px;
      font-size: 13.5px;
      font-weight: 700;
      color: #111;
    }

    /* ── Notes ── */
    .notes-section { margin-bottom: 24px; }
    .notes-label {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #9CA3AF;
      margin-bottom: 5px;
    }
    .notes-text { font-size: 11.5px; color: #555; line-height: 1.7; }

    /* ── Signature ── */
    .sig-row {
      display: flex;
      justify-content: space-between;
      margin-top: 28px;
      padding-top: 16px;
      border-top: 1px solid #E5E7EB;
    }
    .sig-col { width: 180px; }
    .sig-line { border-top: 1px solid #9CA3AF; margin-top: 36px; padding-top: 5px; font-size: 10.5px; color: #9CA3AF; }

    /* ── Footer ── */
    .footer {
      margin-top: 24px;
      padding-top: 10px;
      border-top: 1px solid #F3F4F6;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #C4C4C4;
    }
  </style>
</head>
<body>

  <!-- Top stripe -->
  <div class="top-stripe"></div>

  <!-- Header -->
  <div class="header">
    <div>
      <p class="biz-name">${bizName}</p>
      <div class="biz-detail">
        ${bizAddress ? `${bizAddress}<br/>` : ''}
        ${bizPhone   ? `${bizPhone}` : ''}
        ${bizEmail   ? (bizPhone ? `&nbsp;&nbsp;·&nbsp;&nbsp;${bizEmail}` : bizEmail) : ''}
        ${bizGST     ? `<br/>GSTIN: ${bizGST}` : ''}
      </div>
    </div>
    <div class="doc-block">
      <p class="doc-type">${docTitle}</p>
      <p class="doc-number">#${docNumber || '—'}</p>
      <div class="doc-meta">
        <b>Date:</b> ${fmtDate(docDate)}<br/>
        <b>Status:</b>&nbsp;
        <span class="chip ${
          status === 'PAID' ? 'chip-paid' :
          status === 'PENDING' ? 'chip-pending' :
          status === 'PARTIAL' ? 'chip-partial' : 'chip-default'
        }">${status}</span>
        ${method ? `<br/><b>Payment:</b> ${method}` : ''}
      </div>
    </div>
  </div>

  <hr class="divider"/>

  <!-- Party -->
  <div class="party-row">
    <div class="party-col">
      <p class="party-label">From</p>
      <p class="party-name">${bizName}</p>
      <div class="party-detail">
        ${bizAddress ? `${bizAddress}<br/>` : ''}
        ${bizPhone   ? `${bizPhone}<br/>` : ''}
        ${bizEmail   ? bizEmail : ''}
        ${!bizAddress && !bizPhone && !bizEmail ? '—' : ''}
      </div>
    </div>
    <div class="party-col">
      <p class="party-label">${partyLabel}</p>
      <p class="party-name">${party}</p>
      <div class="party-detail">
        ${partyPhone ? `${partyPhone}<br/>` : ''}
        ${partyEmail ? partyEmail : ''}
        ${!partyPhone && !partyEmail ? '—' : ''}
      </div>
    </div>
  </div>

  <!-- Items Table -->
  <table>
    <thead>
      <tr>
        <th style="width:28px">#</th>
        <th class="th-left">Item &amp; Description</th>
        <th style="width:60px">Qty</th>
        <th class="th-right" style="width:100px">Rate</th>
        <th style="width:55px">Tax</th>
        <th class="th-right" style="width:85px">Discount</th>
        <th class="th-right" style="width:105px">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="7" style="text-align:center;padding:18px;color:#9CA3AF">No items found</td></tr>'}
    </tbody>
  </table>

  <!-- Totals -->
  <div class="totals-wrap">
    <div class="totals-box">
      <div class="t-row"><span class="lbl">Subtotal</span><span class="val">${fmt(subtotal)}</span></div>
      <div class="t-row"><span class="lbl">Tax</span><span class="val">${fmt(taxTotal)}</span></div>
      ${discount > 0 ? `<div class="t-row"><span class="lbl">Discount</span><span class="val">− ${fmt(discount)}</span></div>` : ''}
      <div class="t-total"><span>Total</span><span>${fmt(grandTotal)}</span></div>
    </div>
  </div>

  <!-- Notes -->
  ${notes || true ? `
  <div class="notes-section">
    <p class="notes-label">Notes</p>
    <p class="notes-text">${notes || 'Thank you for your business.'}</p>
  </div>` : ''}

  <!-- Signature -->
  <div class="sig-row">
    <div class="sig-col">
      <div class="sig-line">Authorized Signature</div>
    </div>
    <div class="sig-col" style="text-align:right">
      <div class="sig-line">Received By &amp; Date</div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <span>Generated by InventoPro</span>
    <span>#${docNumber}</span>
    <span>Printed: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
  </div>

</body>
</html>`

  const win = window.open('', '_blank', 'width=860,height=720')
  if (!win) { alert('Pop-ups blocked. Please allow pop-ups to print.'); return }
  win.document.write(html)
  win.document.close()
  win.onload = () => { win.focus(); win.print(); win.close() }
  setTimeout(() => { try { win.focus(); win.print(); win.close() } catch(_){} }, 900)
}

// Legacy helper
export function printElement(elementId, title = 'Invoice') {
  const el = document.getElementById(elementId)
  if (!el) return
  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) { alert('Pop-ups blocked.'); return }
  win.document.write(`<!DOCTYPE html><html><head><title>${title}</title></head><body>${el.innerHTML}</body></html>`)
  win.document.close()
  win.onload = () => { win.focus(); win.print(); win.close() }
  setTimeout(() => { try { win.focus(); win.print(); win.close() } catch(_){} }, 800)
}
