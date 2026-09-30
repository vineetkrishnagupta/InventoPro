import { supabase } from '../lib/supabase'

const handleError = (error) => {
  console.error('Supabase error:', error)
  if (error?.code === '42501') throw new Error('You do not have permission to perform this action')
  if (error?.code === '23505') throw new Error('A record with this value already exists')
  if (error?.code === '23503') throw new Error('Related record not found')
  throw new Error(error?.message || 'An unexpected error occurred')
}

// Helper to normalize Supabase product inventory (which can be 1-to-1 object or 1-to-many array)
export const normalizeProduct = (p) => {
  if (!p) return p
  const invObj = Array.isArray(p.inventory) ? p.inventory[0] : p.inventory
  const qty = Number(invObj?.quantity ?? p.stock ?? p.quantity ?? 0)
  const reserved = Number(invObj?.reserved_quantity ?? 0)

  // Dual-compatible: supports p.inventory[0].quantity AND p.inventory.quantity AND p.stock
  const normalizedInv = [{ quantity: qty, reserved_quantity: reserved }]
  normalizedInv.quantity = qty
  normalizedInv.reserved_quantity = reserved

  return {
    ...p,
    inventory: normalizedInv,
    stock: qty,
    current_stock: qty,
  }
}

// ─── Products ─────────────────────────────────────────────────────────────────

export const productService = {
  async getAll({ search = '', categoryId = '', status = '', page = 1, pageSize = 20 } = {}) {
    let query = supabase
      .from('products')
      .select(`
        *,
        categories(id, name),
        suppliers(id, name),
        inventory(quantity, reserved_quantity)
      `, { count: 'exact' })

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,barcode.ilike.%${search}%`)
    }
    if (categoryId) query = query.eq('category_id', categoryId)
    if (status) query = query.eq('status', status)

    const from = (page - 1) * pageSize
    query = query.range(from, from + pageSize - 1).order('created_at', { ascending: false })

    const { data, error, count } = await query
    if (error) handleError(error)
    return { data: (data || []).map(normalizeProduct), count: count || 0 }
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('products')
      .select(`*, categories(id, name), suppliers(id, name), inventory(quantity, reserved_quantity)`)
      .eq('id', id)
      .single()
    if (error) handleError(error)
    return normalizeProduct(data)
  },

  async create(product) {
    const { data: { user } } = await supabase.auth.getUser()
    const payload = user?.id ? { ...product, user_id: user.id } : product
    const { data, error } = await supabase
      .from('products')
      .insert(payload)
      .select()
      .single()
    if (error) handleError(error)
    // Initialize inventory
    const invPayload = { product_id: data.id, quantity: 0, reserved_quantity: 0 }
    if (user?.id) invPayload.user_id = user.id
    await supabase.from('inventory').insert(invPayload)
    return normalizeProduct(data)
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('products')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) handleError(error)
    return normalizeProduct(data)
  },

  async delete(id) {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) handleError(error)
  },

  async getLowStock() {
    const { data, error } = await supabase
      .from('products')
      .select(`*, inventory(quantity, reserved_quantity), categories(name)`)
      .eq('status', 'active')
      .order('name')
    if (error) handleError(error)
    return (data || []).map(normalizeProduct).filter(p => p.stock <= p.minimum_stock)
  },
}

// ─── Categories ───────────────────────────────────────────────────────────────

export const categoryService = {
  async getAll({ search = '', status = '' } = {}) {
    let query = supabase
      .from('categories')
      .select('*, products(count)', { count: 'exact' })

    if (search) query = query.ilike('name', `%${search}%`)
    if (status) query = query.eq('status', status)

    const { data, error } = await query.order('name')
    if (error) handleError(error)
    return data || []
  },

  async create(category) {
    const { data: { user } } = await supabase.auth.getUser()
    const payload = user?.id ? { ...category, user_id: user.id } : category
    const { data, error } = await supabase.from('categories').insert(payload).select().single()
    if (error) handleError(error)
    return data
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('categories')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id).select().single()
    if (error) handleError(error)
    return data
  },

  async delete(id) {
    // Check if products exist
    const { data: products } = await supabase.from('products').select('id').eq('category_id', id).limit(1)
    if (products?.length > 0) throw new Error('Cannot delete category with associated products')
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) handleError(error)
  },
}

// ─── Suppliers ────────────────────────────────────────────────────────────────

export const supplierService = {
  async getAll({ search = '', status = '' } = {}) {
    let query = supabase.from('suppliers').select('*', { count: 'exact' })
    if (search) query = query.or(`name.ilike.%${search}%,company_name.ilike.%${search}%,email.ilike.%${search}%`)
    if (status) query = query.eq('status', status)
    const { data, error } = await query.order('name')
    if (error) handleError(error)
    return data || []
  },

  async getById(id) {
    const { data, error } = await supabase.from('suppliers').select('*').eq('id', id).single()
    if (error) handleError(error)
    return data
  },

  async create(supplier) {
    const { data: { user } } = await supabase.auth.getUser()
    const payload = user?.id ? { ...supplier, user_id: user.id } : supplier
    const { data, error } = await supabase.from('suppliers').insert(payload).select().single()
    if (error) handleError(error)
    return data
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('suppliers').update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id).select().single()
    if (error) handleError(error)
    return data
  },

  async delete(id) {
    const { error } = await supabase.from('suppliers').delete().eq('id', id)
    if (error) handleError(error)
  },
}

// ─── Customers ────────────────────────────────────────────────────────────────

export const customerService = {
  async getAll({ search = '', status = '' } = {}) {
    let query = supabase.from('customers').select('*', { count: 'exact' })
    if (search) query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
    if (status) query = query.eq('status', status)
    const { data, error } = await query.order('name')
    if (error) handleError(error)
    return data || []
  },

  async getById(id) {
    const { data, error } = await supabase.from('customers').select('*').eq('id', id).single()
    if (error) handleError(error)
    return data
  },

  async create(customer) {
    const { data: { user } } = await supabase.auth.getUser()
    const payload = user?.id ? { ...customer, user_id: user.id } : customer
    const { data, error } = await supabase.from('customers').insert(payload).select().single()
    if (error) handleError(error)
    return data
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('customers').update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id).select().single()
    if (error) handleError(error)
    return data
  },

  async delete(id) {
    const { error } = await supabase.from('customers').delete().eq('id', id)
    if (error) handleError(error)
  },
}

// ─── Purchases ────────────────────────────────────────────────────────────────

export const purchaseService = {
  async getAll({ search = '', supplierId = '', status = '', page = 1, pageSize = 20 } = {}) {
    let query = supabase
      .from('purchases')
      .select(`*, suppliers(id, name), profiles(id, full_name)`, { count: 'exact' })

    if (search) query = query.ilike('purchase_number', `%${search}%`)
    if (supplierId) query = query.eq('supplier_id', supplierId)
    if (status) query = query.eq('payment_status', status)

    const from = (page - 1) * pageSize
    const { data, error, count } = await query
      .range(from, from + pageSize - 1)
      .order('created_at', { ascending: false })
    if (error) handleError(error)
    return { data: data || [], count: count || 0 }
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('purchases')
      .select(`*, suppliers(*), purchase_items(*, products(id, name, sku, unit))`)
      .eq('id', id).single()
    if (error) handleError(error)
    return data
  },

  async create(purchase, items) {
    const { data: { user } } = await supabase.auth.getUser()
    const purchaseData = { ...purchase, user_id: user?.id, created_by: user?.id }
    
    // 1. Create Purchase
    const { data: purchaseResult, error: pError } = await supabase
      .from('purchases')
      .insert(purchaseData)
      .select('id')
      .single()
      
    if (pError) handleError(pError)
    
    const purchaseId = purchaseResult.id
    
    // 2. Create Items
    const itemsData = (items || []).map(item => ({ 
      ...item, 
      purchase_id: purchaseId, 
      user_id: user?.id 
    }))
    
    const { error: iError } = await supabase
      .from('purchase_items')
      .insert(itemsData)
      
    if (iError) handleError(iError)

    // 3. Increment Inventory
    for (const item of itemsData) {
      const { data: invData, error: selErr } = await supabase
        .from('inventory')
        .select('id, quantity, user_id')
        .eq('product_id', item.product_id)
        .maybeSingle()
        
      if (selErr) handleError(selErr)
        
      if (invData) {
        const updatePayload = { 
          quantity: Number(invData.quantity || 0) + Number(item.quantity),
          updated_at: new Date().toISOString()
        }
        if (!invData.user_id && user?.id) {
          updatePayload.user_id = user.id
        }
        const { error: updErr } = await supabase
          .from('inventory')
          .update(updatePayload)
          .eq('product_id', item.product_id)
        if (updErr) handleError(updErr)
      } else {
        const { error: insErr } = await supabase
          .from('inventory')
          .insert({
            product_id: item.product_id,
            quantity: Number(item.quantity),
            reserved_quantity: 0,
            user_id: user?.id,
            updated_at: new Date().toISOString()
          })
        if (insErr) handleError(insErr)
      }
    }
    
    // 4. Create Payment if Paid
    if (purchaseData.payment_status === 'paid') {
      await supabase.from('payments').insert({
        transaction_type: 'purchase',
        transaction_id: purchaseId,
        amount: purchaseData.total_amount,
        payment_method: purchaseData.payment_method,
        payment_date: purchaseData.purchase_date,
        created_by: user?.id,
        user_id: user?.id
      })
    }

    // 5. Audit Log
    if (user?.id) {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'CREATE_PURCHASE',
        module: 'PURCHASES',
        record_id: purchaseId,
        description: `Purchase order created: ${purchaseData.purchase_number || purchaseId}`
      }).then(() => {}).catch(() => {})
    }
    
    return purchaseId
  },

  async updateStatus(id, status) {
    const { data, error } = await supabase
      .from('purchases').update({ payment_status: status, updated_at: new Date().toISOString() })
      .eq('id', id).select().single()
    if (error) handleError(error)
    return data
  },
}

// ─── Sales ────────────────────────────────────────────────────────────────────

export const salesService = {
  async getAll({ search = '', customerId = '', status = '', page = 1, pageSize = 20 } = {}) {
    let query = supabase
      .from('sales')
      .select(`*, customers(id, name), profiles(id, full_name)`, { count: 'exact' })

    if (search) query = query.ilike('invoice_number', `%${search}%`)
    if (customerId) query = query.eq('customer_id', customerId)
    if (status) query = query.eq('payment_status', status)

    const from = (page - 1) * pageSize
    const { data, error, count } = await query
      .range(from, from + pageSize - 1)
      .order('created_at', { ascending: false })
    if (error) handleError(error)
    return { data: data || [], count: count || 0 }
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('sales')
      .select(`*, customers(*), sale_items(*, products(id, name, sku, unit))`)
      .eq('id', id).single()
    if (error) handleError(error)
    return data
  },

  async create(sale, items) {
    const { data: { user } } = await supabase.auth.getUser()
    const saleData = { ...sale, user_id: user?.id, created_by: user?.id }
    
    // 1. Verify Stock first
    for (const item of items) {
      const { data: invData } = await supabase
        .from('inventory')
        .select('quantity, products(name)')
        .eq('product_id', item.product_id)
        .single()
        
      if (!invData || Number(invData.quantity) < Number(item.quantity)) {
        throw new Error(`Insufficient stock for product. Available: ${invData?.quantity || 0}`)
      }
    }

    // 2. Create Sale
    const { data: saleResult, error: sError } = await supabase
      .from('sales')
      .insert(saleData)
      .select('id')
      .single()
      
    if (sError) handleError(sError)
    
    const saleId = saleResult.id
    
    // 3. Create Items
    const itemsData = (items || []).map(item => ({ 
      ...item, 
      sale_id: saleId, 
      user_id: user?.id 
    }))
    
    const { error: iError } = await supabase
      .from('sale_items')
      .insert(itemsData)
      
    if (iError) handleError(iError)

    // 4. Decrement Inventory
    for (const item of itemsData) {
      const { data: invData, error: selErr } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('product_id', item.product_id)
        .single()
        
      if (selErr) handleError(selErr)
        
      const { error: updErr } = await supabase
        .from('inventory')
        .update({ quantity: Number(invData.quantity) - Number(item.quantity) })
        .eq('product_id', item.product_id)
        
      if (updErr) handleError(updErr)
    }
    
    // 5. Create Payment if Paid
    if (saleData.payment_status === 'paid') {
      await supabase.from('payments').insert({
        transaction_type: 'sale',
        transaction_id: saleId,
        amount: saleData.total_amount,
        payment_method: saleData.payment_method,
        payment_date: saleData.sale_date,
        created_by: user?.id,
        user_id: user?.id
      })
    }
    
    return saleId
  },
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export const inventoryService = {
  async getAll({ search = '', category = '', stockStatus = '', page = 1, pageSize = 20 } = {}) {
    let query = supabase
      .from('products')
      .select(`
        id, name, sku, minimum_stock, purchase_price, selling_price, status,
        categories(id, name),
        inventory(quantity, reserved_quantity)
      `, { count: 'exact' })
      .eq('status', 'active')

    if (search) query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`)
    if (category) query = query.eq('category_id', category)

    const { data, error, count } = await query.order('name')
    if (error) handleError(error)

    const normalized = (data || []).map(normalizeProduct)
    let filtered = normalized
    if (stockStatus === 'out') {
      filtered = filtered.filter(p => p.stock === 0)
    } else if (stockStatus === 'low') {
      filtered = filtered.filter(p => p.stock > 0 && p.stock <= p.minimum_stock)
    } else if (stockStatus === 'in') {
      filtered = filtered.filter(p => p.stock > p.minimum_stock)
    }

    const start = (page - 1) * pageSize
    return {
      data: filtered.slice(start, start + pageSize),
      count: filtered.length,
    }
  },

  async adjustStock(adjustment) {
    const { data, error } = await supabase.rpc('adjust_stock', adjustment)
    if (error) handleError(error)
    return data
  },

  async getAdjustments({ page = 1, pageSize = 20 } = {}) {
    const from = (page - 1) * pageSize
    const { data, error, count } = await supabase
      .from('stock_adjustments')
      .select(`*, products(id, name, sku), profiles(id, full_name)`, { count: 'exact' })
      .range(from, from + pageSize - 1)
      .order('created_at', { ascending: false })
    if (error) handleError(error)
    return { data: data || [], count: count || 0 }
  },
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export const dashboardService = {
  async getStats() {
    const today = new Date().toISOString().split('T')[0]

    const [
      { count: totalProducts },
      { data: todaySales },
      { data: todayPurchases },
      { count: totalSuppliers },
      { count: totalCustomers },
      { data: inventory },
    ] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('sales').select('total_amount').gte('sale_date', today),
      supabase.from('purchases').select('total_amount').gte('purchase_date', today),
      supabase.from('suppliers').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('customers').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('inventory').select('quantity, products(purchase_price, minimum_stock, status)'),
    ])

    const todaySalesTotal = (todaySales || []).reduce((s, r) => s + (r.total_amount || 0), 0)
    const todayPurchasesTotal = (todayPurchases || []).reduce((s, r) => s + (r.total_amount || 0), 0)

    const activeInventory = (inventory || []).filter(i => i.products?.status === 'active')
    const stockValue = activeInventory.reduce((s, i) => s + (i.quantity || 0) * (i.products?.purchase_price || 0), 0)
    const lowStock = activeInventory.filter(i => (i.quantity || 0) > 0 && (i.quantity || 0) <= (i.products?.minimum_stock || 0)).length
    const outOfStock = activeInventory.filter(i => (i.quantity || 0) === 0).length

    return {
      totalProducts: totalProducts || 0,
      todaySales: todaySalesTotal,
      todayPurchases: todayPurchasesTotal,
      totalSuppliers: totalSuppliers || 0,
      totalCustomers: totalCustomers || 0,
      stockValue,
      lowStock,
      outOfStock,
    }
  },

  async getSalesChart(days = 7) {
    const from = new Date()
    from.setDate(from.getDate() - days)
    const { data, error } = await supabase
      .from('sales')
      .select('sale_date, total_amount')
      .gte('sale_date', from.toISOString().split('T')[0])
      .order('sale_date')
    if (error) handleError(error)
    return data || []
  },

  async getPurchasesChart(days = 7) {
    const from = new Date()
    from.setDate(from.getDate() - days)
    const { data, error } = await supabase
      .from('purchases')
      .select('purchase_date, total_amount')
      .gte('purchase_date', from.toISOString().split('T')[0])
      .order('purchase_date')
    if (error) handleError(error)
    return data || []
  },

  async getTopProducts(limit = 5) {
    const { data, error } = await supabase
      .from('sale_items')
      .select('quantity, products(id, name, sku)')
      .limit(100)
    if (error) return []

    const grouped = {}
    ;(data || []).forEach(item => {
      const id = item.products?.id
      if (!id) return
      if (!grouped[id]) grouped[id] = { ...item.products, totalQty: 0 }
      grouped[id].totalQty += item.quantity || 0
    })

    return Object.values(grouped)
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, limit)
  },
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export const auditService = {
  async getAll({ page = 1, pageSize = 20, module = '', action = '' } = {}) {
    let query = supabase
      .from('audit_logs')
      .select(`*, profiles(id, full_name, email)`, { count: 'exact' })

    if (module) query = query.eq('module', module)
    if (action) query = query.eq('action', action)

    const from = (page - 1) * pageSize
    const { data, error, count } = await query
      .range(from, from + pageSize - 1)
      .order('created_at', { ascending: false })
    if (error) handleError(error)
    return { data: data || [], count: count || 0 }
  },

  async log({ userId, action, module, recordId, description }) {
    try {
      await supabase.from('audit_logs').insert({ user_id: userId, action, module, record_id: recordId, description })
    } catch { /* non-critical */ }
  },
}

// ─── Notifications ────────────────────────────────────────────────────────────

export const notificationService = {
  async getAll(userId, { page = 1, pageSize = 20 } = {}) {
    const from = (page - 1) * pageSize
    const { data, error, count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .range(from, from + pageSize - 1)
      .order('created_at', { ascending: false })
    if (error) handleError(error)
    return { data: data || [], count: count || 0 }
  },

  async markRead(id) {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    if (error) handleError(error)
  },

  async markAllRead(userId) {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId)
    if (error) handleError(error)
  },

  async create(notification) {
    const { data, error } = await supabase.from('notifications').insert(notification).select().single()
    if (error) handleError(error)
    return data
  },
}

// ─── Users ────────────────────────────────────────────────────────────────────

export const userService = {
  async getAll({ search = '' } = {}) {
    let query = supabase.from('profiles').select('*', { count: 'exact' })
    if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    const { data, error } = await query.order('full_name')
    if (error) handleError(error)
    return data || []
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id).select().single()
    if (error) handleError(error)
    return data
  },
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export const reportService = {
  async getSalesReport({ startDate, endDate, customerId, paymentStatus } = {}) {
    let query = supabase
      .from('sales')
      .select(`*, customers(id, name)`)
    if (startDate) query = query.gte('sale_date', startDate)
    if (endDate) query = query.lte('sale_date', endDate)
    if (customerId) query = query.eq('customer_id', customerId)
    if (paymentStatus) query = query.eq('payment_status', paymentStatus)
    const { data, error } = await query.order('sale_date', { ascending: false })
    if (error) handleError(error)
    return data || []
  },

  async getPurchaseReport({ startDate, endDate, supplierId, paymentStatus } = {}) {
    let query = supabase.from('purchases').select(`*, suppliers(id, name)`)
    if (startDate) query = query.gte('purchase_date', startDate)
    if (endDate) query = query.lte('purchase_date', endDate)
    if (supplierId) query = query.eq('supplier_id', supplierId)
    if (paymentStatus) query = query.eq('payment_status', paymentStatus)
    const { data, error } = await query.order('purchase_date', { ascending: false })
    if (error) handleError(error)
    return data || []
  },

  async getStockReport() {
    const { data, error } = await supabase
      .from('products')
      .select(`*, categories(name), inventory(quantity, reserved_quantity)`)
      .eq('status', 'active')
      .order('name')
    if (error) handleError(error)
    return (data || []).map(normalizeProduct)
  },

  async getProfitReport({ startDate, endDate } = {}) {
    let salesQuery = supabase.from('sales').select('total_amount, sale_date')
    let purchaseQuery = supabase.from('purchases').select('total_amount, purchase_date')
    if (startDate) { salesQuery = salesQuery.gte('sale_date', startDate); purchaseQuery = purchaseQuery.gte('purchase_date', startDate) }
    if (endDate) { salesQuery = salesQuery.lte('sale_date', endDate); purchaseQuery = purchaseQuery.lte('purchase_date', endDate) }

    const [{ data: sales }, { data: purchases }] = await Promise.all([salesQuery, purchaseQuery])

    const revenue = (sales || []).reduce((s, r) => s + (r.total_amount || 0), 0)
    const cogs = (purchases || []).reduce((s, r) => s + (r.total_amount || 0), 0)
    return { revenue, cogs, grossProfit: revenue - cogs, sales: sales || [], purchases: purchases || [] }
  },
}
