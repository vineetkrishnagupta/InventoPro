-- ============================================================
-- InventoPro - Complete Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────────────

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'staff', 'viewer')),
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  company_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  gst_number TEXT,
  opening_balance NUMERIC(12, 2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  gst_number TEXT,
  opening_balance NUMERIC(12, 2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  barcode TEXT,
  category_id UUID REFERENCES categories(id),
  supplier_id UUID REFERENCES suppliers(id),
  brand TEXT,
  unit TEXT DEFAULT 'pcs',
  purchase_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  selling_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tax_percent NUMERIC(5, 2) DEFAULT 0,
  minimum_stock INTEGER DEFAULT 5,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
  quantity NUMERIC(12, 2) DEFAULT 0,
  reserved_quantity NUMERIC(12, 2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchases
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_number TEXT NOT NULL UNIQUE,
  supplier_id UUID REFERENCES suppliers(id),
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  subtotal NUMERIC(12, 2) DEFAULT 0,
  discount NUMERIC(12, 2) DEFAULT 0,
  tax NUMERIC(12, 2) DEFAULT 0,
  total_amount NUMERIC(12, 2) DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('paid', 'partial', 'pending', 'cancelled')),
  payment_method TEXT DEFAULT 'cash',
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase Items
CREATE TABLE IF NOT EXISTS purchase_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity NUMERIC(12, 2) NOT NULL DEFAULT 0,
  purchase_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tax_percent NUMERIC(5, 2) DEFAULT 0,
  discount NUMERIC(12, 2) DEFAULT 0,
  total NUMERIC(12, 2) DEFAULT 0
);

-- Sales
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES customers(id),
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  subtotal NUMERIC(12, 2) DEFAULT 0,
  discount NUMERIC(12, 2) DEFAULT 0,
  tax NUMERIC(12, 2) DEFAULT 0,
  total_amount NUMERIC(12, 2) DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('paid', 'partial', 'pending', 'cancelled')),
  payment_method TEXT DEFAULT 'cash',
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sale Items
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity NUMERIC(12, 2) NOT NULL DEFAULT 0,
  selling_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tax_percent NUMERIC(5, 2) DEFAULT 0,
  discount NUMERIC(12, 2) DEFAULT 0,
  total NUMERIC(12, 2) DEFAULT 0
);

-- Stock Adjustments
CREATE TABLE IF NOT EXISTS stock_adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id),
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('opening_stock', 'damage', 'expired', 'lost', 'correction', 'return', 'other')),
  quantity NUMERIC(12, 2) NOT NULL,
  previous_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0,
  new_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0,
  reason TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'sale')),
  transaction_id UUID NOT NULL,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference_number TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  record_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier_id ON purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_purchase_items_product_id ON purchase_items(product_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- ─────────────────────────────────────────────────
-- TRIGGER: Auto-create profile on signup
-- ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ─────────────────────────────────────────────────
-- RPC: create_purchase (atomic)
-- ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION create_purchase(
  purchase_data JSONB,
  items_data JSONB
)
RETURNS UUID AS $$
DECLARE
  purchase_id UUID;
  item JSONB;
  cur_qty NUMERIC;
BEGIN
  -- Insert purchase
  INSERT INTO purchases (
    purchase_number, supplier_id, purchase_date, subtotal, discount, tax,
    total_amount, payment_status, payment_method, notes, created_by
  )
  VALUES (
    purchase_data->>'purchase_number',
    (purchase_data->>'supplier_id')::UUID,
    (purchase_data->>'purchase_date')::DATE,
    (purchase_data->>'subtotal')::NUMERIC,
    (purchase_data->>'discount')::NUMERIC,
    (purchase_data->>'tax')::NUMERIC,
    (purchase_data->>'total_amount')::NUMERIC,
    purchase_data->>'payment_status',
    purchase_data->>'payment_method',
    purchase_data->>'notes',
    (purchase_data->>'created_by')::UUID
  )
  RETURNING id INTO purchase_id;

  -- Insert items and update inventory
  FOR item IN SELECT * FROM jsonb_array_elements(items_data) LOOP
    -- Insert purchase item
    INSERT INTO purchase_items (purchase_id, product_id, quantity, purchase_price, tax_percent, discount, total)
    VALUES (
      purchase_id,
      (item->>'product_id')::UUID,
      (item->>'quantity')::NUMERIC,
      (item->>'purchase_price')::NUMERIC,
      (item->>'tax_percent')::NUMERIC,
      (item->>'discount')::NUMERIC,
      (item->>'total')::NUMERIC
    );

    -- Update or insert inventory
    INSERT INTO inventory (product_id, quantity, updated_at)
    VALUES ((item->>'product_id')::UUID, (item->>'quantity')::NUMERIC, NOW())
    ON CONFLICT (product_id) DO UPDATE
    SET quantity = inventory.quantity + (item->>'quantity')::NUMERIC,
        updated_at = NOW();
  END LOOP;

  -- Create payment record if paid
  IF purchase_data->>'payment_status' = 'paid' THEN
    INSERT INTO payments (transaction_type, transaction_id, amount, payment_method, payment_date, created_by)
    VALUES (
      'purchase', purchase_id,
      (purchase_data->>'total_amount')::NUMERIC,
      purchase_data->>'payment_method',
      (purchase_data->>'purchase_date')::DATE,
      (purchase_data->>'created_by')::UUID
    );
  END IF;

  -- Audit log
  INSERT INTO audit_logs (user_id, action, module, record_id, description)
  VALUES (
    (purchase_data->>'created_by')::UUID,
    'CREATE_PURCHASE', 'PURCHASES', purchase_id,
    'Created purchase order: ' || (purchase_data->>'purchase_number')
  );

  RETURN purchase_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────
-- RPC: create_sale (atomic, with stock validation)
-- ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION create_sale(
  sale_data JSONB,
  items_data JSONB
)
RETURNS UUID AS $$
DECLARE
  sale_id UUID;
  item JSONB;
  cur_qty NUMERIC;
  product_name TEXT;
BEGIN
  -- Validate stock for all items FIRST
  FOR item IN SELECT * FROM jsonb_array_elements(items_data) LOOP
    SELECT i.quantity, p.name
    INTO cur_qty, product_name
    FROM inventory i
    JOIN products p ON p.id = i.product_id
    WHERE i.product_id = (item->>'product_id')::UUID;

    IF cur_qty IS NULL THEN
      RAISE EXCEPTION 'Product not found in inventory';
    END IF;

    IF (item->>'quantity')::NUMERIC > cur_qty THEN
      RAISE EXCEPTION 'Insufficient stock for "%". Available: %, Requested: %',
        product_name, cur_qty, (item->>'quantity')::NUMERIC;
    END IF;
  END LOOP;

  -- Insert sale
  INSERT INTO sales (
    invoice_number, customer_id, sale_date, subtotal, discount, tax,
    total_amount, payment_status, payment_method, notes, created_by
  )
  VALUES (
    sale_data->>'invoice_number',
    NULLIF(sale_data->>'customer_id', '')::UUID,
    (sale_data->>'sale_date')::DATE,
    (sale_data->>'subtotal')::NUMERIC,
    (sale_data->>'discount')::NUMERIC,
    (sale_data->>'tax')::NUMERIC,
    (sale_data->>'total_amount')::NUMERIC,
    sale_data->>'payment_status',
    sale_data->>'payment_method',
    sale_data->>'notes',
    (sale_data->>'created_by')::UUID
  )
  RETURNING id INTO sale_id;

  -- Insert items and deduct inventory
  FOR item IN SELECT * FROM jsonb_array_elements(items_data) LOOP
    INSERT INTO sale_items (sale_id, product_id, quantity, selling_price, tax_percent, discount, total)
    VALUES (
      sale_id,
      (item->>'product_id')::UUID,
      (item->>'quantity')::NUMERIC,
      (item->>'selling_price')::NUMERIC,
      (item->>'tax_percent')::NUMERIC,
      (item->>'discount')::NUMERIC,
      (item->>'total')::NUMERIC
    );

    -- Deduct from inventory
    UPDATE inventory
    SET quantity = quantity - (item->>'quantity')::NUMERIC,
        updated_at = NOW()
    WHERE product_id = (item->>'product_id')::UUID;
  END LOOP;

  -- Create payment record if paid
  IF sale_data->>'payment_status' = 'paid' THEN
    INSERT INTO payments (transaction_type, transaction_id, amount, payment_method, payment_date, created_by)
    VALUES (
      'sale', sale_id,
      (sale_data->>'total_amount')::NUMERIC,
      sale_data->>'payment_method',
      (sale_data->>'sale_date')::DATE,
      (sale_data->>'created_by')::UUID
    );
  END IF;

  -- Audit log
  INSERT INTO audit_logs (user_id, action, module, record_id, description)
  VALUES (
    (sale_data->>'created_by')::UUID,
    'CREATE_SALE', 'SALES', sale_id,
    'Created sale invoice: ' || (sale_data->>'invoice_number')
  );

  RETURN sale_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────
-- RPC: adjust_stock (atomic)
-- ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION adjust_stock(
  p_product_id UUID,
  p_adjustment_type TEXT,
  p_quantity NUMERIC,
  p_reason TEXT,
  p_user_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_current_qty NUMERIC;
  v_new_qty NUMERIC;
  v_abs_qty NUMERIC;
BEGIN
  v_abs_qty := ABS(p_quantity);

  -- Get current stock (with row lock)
  SELECT quantity INTO v_current_qty
  FROM inventory
  WHERE product_id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found in inventory';
  END IF;

  -- Calculate new qty based on type
  IF p_adjustment_type IN ('damage', 'expired', 'lost') THEN
    v_new_qty := GREATEST(0, v_current_qty - v_abs_qty);
  ELSE
    v_new_qty := v_current_qty + v_abs_qty;
  END IF;

  -- Update inventory
  UPDATE inventory
  SET quantity = v_new_qty, updated_at = NOW()
  WHERE product_id = p_product_id;

  -- Create adjustment record
  INSERT INTO stock_adjustments (
    product_id, adjustment_type, quantity, previous_quantity, new_quantity, reason, created_by
  )
  VALUES (p_product_id, p_adjustment_type, v_abs_qty, v_current_qty, v_new_qty, p_reason, p_user_id);

  -- Audit log
  INSERT INTO audit_logs (user_id, action, module, record_id, description)
  VALUES (p_user_id, 'STOCK_ADJUSTMENT', 'INVENTORY', p_product_id,
    'Stock adjusted (' || p_adjustment_type || '): ' || v_current_qty || ' → ' || v_new_qty);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ─── PROFILES policies ───
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (get_user_role() = 'admin');

-- ─── CATEGORIES policies ───
CREATE POLICY "All authenticated can view categories" ON categories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Managers+ can insert categories" ON categories FOR INSERT WITH CHECK (get_user_role() IN ('admin', 'manager'));
CREATE POLICY "Managers+ can update categories" ON categories FOR UPDATE USING (get_user_role() IN ('admin', 'manager'));
CREATE POLICY "Admins can delete categories" ON categories FOR DELETE USING (get_user_role() IN ('admin', 'manager'));

-- ─── SUPPLIERS policies ───
CREATE POLICY "All authenticated can view suppliers" ON suppliers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Managers+ can manage suppliers" ON suppliers FOR INSERT WITH CHECK (get_user_role() IN ('admin', 'manager'));
CREATE POLICY "Managers+ can update suppliers" ON suppliers FOR UPDATE USING (get_user_role() IN ('admin', 'manager'));
CREATE POLICY "Admins can delete suppliers" ON suppliers FOR DELETE USING (get_user_role() IN ('admin', 'manager'));

-- ─── CUSTOMERS policies ───
CREATE POLICY "All authenticated can view customers" ON customers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Staff+ can manage customers" ON customers FOR INSERT WITH CHECK (get_user_role() IN ('admin', 'manager', 'staff'));
CREATE POLICY "Staff+ can update customers" ON customers FOR UPDATE USING (get_user_role() IN ('admin', 'manager', 'staff'));
CREATE POLICY "Managers+ can delete customers" ON customers FOR DELETE USING (get_user_role() IN ('admin', 'manager'));

-- ─── PRODUCTS policies ───
CREATE POLICY "All authenticated can view products" ON products FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Managers+ can create products" ON products FOR INSERT WITH CHECK (get_user_role() IN ('admin', 'manager'));
CREATE POLICY "Managers+ can update products" ON products FOR UPDATE USING (get_user_role() IN ('admin', 'manager'));
CREATE POLICY "Admins can delete products" ON products FOR DELETE USING (get_user_role() IN ('admin', 'manager'));

-- ─── INVENTORY policies ───
CREATE POLICY "All authenticated can view inventory" ON inventory FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "System can manage inventory" ON inventory FOR ALL USING (auth.role() = 'authenticated');

-- ─── PURCHASES policies ───
CREATE POLICY "Managers+ can view purchases" ON purchases FOR SELECT USING (get_user_role() IN ('admin', 'manager'));
CREATE POLICY "Managers+ can create purchases" ON purchases FOR INSERT WITH CHECK (get_user_role() IN ('admin', 'manager'));
CREATE POLICY "Managers+ can update purchases" ON purchases FOR UPDATE USING (get_user_role() IN ('admin', 'manager'));

-- ─── PURCHASE ITEMS policies ───
CREATE POLICY "Managers+ can view purchase items" ON purchase_items FOR SELECT USING (get_user_role() IN ('admin', 'manager'));
CREATE POLICY "System can manage purchase items" ON purchase_items FOR ALL USING (auth.role() = 'authenticated');

-- ─── SALES policies ───
CREATE POLICY "Staff+ can view sales" ON sales FOR SELECT USING (get_user_role() IN ('admin', 'manager', 'staff'));
CREATE POLICY "Staff+ can create sales" ON sales FOR INSERT WITH CHECK (get_user_role() IN ('admin', 'manager', 'staff'));
CREATE POLICY "Managers+ can update sales" ON sales FOR UPDATE USING (get_user_role() IN ('admin', 'manager'));

-- ─── SALE ITEMS policies ───
CREATE POLICY "Staff+ can view sale items" ON sale_items FOR SELECT USING (get_user_role() IN ('admin', 'manager', 'staff'));
CREATE POLICY "System can manage sale items" ON sale_items FOR ALL USING (auth.role() = 'authenticated');

-- ─── STOCK ADJUSTMENTS policies ───
CREATE POLICY "Managers+ can view adjustments" ON stock_adjustments FOR SELECT USING (get_user_role() IN ('admin', 'manager', 'staff'));
CREATE POLICY "Managers+ can create adjustments" ON stock_adjustments FOR INSERT WITH CHECK (get_user_role() IN ('admin', 'manager'));

-- ─── PAYMENTS policies ───
CREATE POLICY "Managers+ can view payments" ON payments FOR SELECT USING (get_user_role() IN ('admin', 'manager'));
CREATE POLICY "System can manage payments" ON payments FOR ALL USING (auth.role() = 'authenticated');

-- ─── AUDIT LOGS policies ───
CREATE POLICY "Admins can view audit logs" ON audit_logs FOR SELECT USING (get_user_role() = 'admin');
CREATE POLICY "System can create audit logs" ON audit_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ─── NOTIFICATIONS policies ───
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ─────────────────────────────────────────────────
-- OPTIONAL SEED DATA (Development only)
-- Uncomment to insert sample data
-- ─────────────────────────────────────────────────

/*
-- Sample categories
INSERT INTO categories (name, description, status) VALUES
  ('Electronics', 'Electronic devices and accessories', 'active'),
  ('Clothing', 'Apparel and fashion', 'active'),
  ('Food & Beverage', 'Food products and drinks', 'active'),
  ('Office Supplies', 'Stationery and office equipment', 'active'),
  ('Hardware', 'Tools and hardware items', 'active');

-- Sample suppliers
INSERT INTO suppliers (name, company_name, phone, email, status) VALUES
  ('Rajesh Kumar', 'TechSupply Co', '+91 9876543210', 'rajesh@techsupply.com', 'active'),
  ('Priya Sharma', 'Fashion Hub', '+91 9876543211', 'priya@fashionhub.com', 'active'),
  ('Amit Singh', 'Food Distributors', '+91 9876543212', 'amit@fooddist.com', 'active'),
  ('Meena Patel', 'Office Pro', '+91 9876543213', 'meena@officepro.com', 'active'),
  ('Vikram Nair', 'Hardware World', '+91 9876543214', 'vikram@hwworld.com', 'active');

-- Sample customers
INSERT INTO customers (name, phone, email, status) VALUES
  ('Arun Sharma', '+91 9876543220', 'arun@example.com', 'active'),
  ('Sunita Verma', '+91 9876543221', 'sunita@example.com', 'active'),
  ('Rahul Gupta', '+91 9876543222', 'rahul@example.com', 'active'),
  ('Anita Patel', '+91 9876543223', 'anita@example.com', 'active'),
  ('Ravi Kumar', '+91 9876543224', 'ravi@example.com', 'active');
*/
