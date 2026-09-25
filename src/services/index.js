import { supabase } from '../lib/supabase'

const handleError = (error) => {
  console.error('Supabase error:', error)
  if (error?.code === '42501') throw new Error('You do not have permission to perform this action')
  if (error?.code === '23505') throw new Error('A record with this value already exists')
  if (error?.code === '23503') throw new Error('Related record not found')
  throw new Error(error?.message || 'An unexpected error occurred')
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
    return { data: data || [], count: count || 0 }
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('products')
      .select(`*, categories(id, name), suppliers(id, name), inventory(quantity, reserved_quantity)`)
      .eq('id', id)
      .single()
    if (error) handleError(error)
    return data
  },

  async create(product) {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single()
    if (error) handleError(error)
    // Initialize inventory
    await supabase.from('inventory').insert({ product_id: data.id, quantity: 0, reserved_quantity: 0 })
    return data
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('products')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) handleError(error)
    return data
  },

  async delete(id) {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) handleError(error)
  },

  async getLowStock() {
    const { data, error } = await supabase
      .from('products')
      .select(`*, inventory(quantity), categories(name)`)
      .eq('status', 'active')
      .order('name')
    if (error) handleError(error)
    return (data || []).filter(p =>
      p.inventory?.[0]?.quantity !== undefined &&
      p.inventory[0].quantity <= p.minimum_stock
    )
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
    const { data, error } = await supabase.from('categories').insert(category).select().single()
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
    const { data, error } = await supabase.from('suppliers').insert(supplier).select().single()
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
    const { data, error } = await supabase.from('customers').insert(customer).select().single()
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
    // Use RPC for atomic operation
    const { data, error } = await supabase.rpc('create_purchase', {
      purchase_data: purchase,
      items_data: items,
    })
    if (error) handleError(error)
    return data
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
    const { data, error } = await supabase.rpc('create_sale', {
      sale_data: sale,
      items_data: items,
    })
    if (error) {
      if (error.message?.includes('Insufficient stock')) throw new Error(error.message)
      handleError(error)
    }
    return data
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

    let filtered = data || []
    if (stockStatus === 'out') {
      filtered = filtered.filter(p => (p.inventory?.[0]?.quantity || 0) === 0)
    } else if (stockStatus === 'low') {
      filtered = filtered.filter(p => {
        const qty = p.inventory?.[0]?.quantity || 0
        return qty > 0 && qty <= p.minimum_stock
      })
    } else if (stockStatus === 'in') {
      filtered = filtered.filter(p => (p.inventory?.[0]?.quantity || 0) > p.minimum_stock)
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
      .select(`*, categories(name), inventory(quantity)`)
      .eq('status', 'active')
      .order('name')
    if (error) handleError(error)
    return data || []
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
