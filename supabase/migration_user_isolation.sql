-- ============================================================
-- InventoPro - Multi-Tenant / Per-User Data Isolation Migration
-- Run this script in your Supabase Project -> SQL Editor
-- ============================================================

-- 1. ADD user_id COLUMN TO ALL DATA TABLES (IF NOT EXISTS)
-- ────────────────────────────────────────────────────────────

-- Categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
-- Suppliers
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
-- Customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
-- Products
ALTER TABLE products ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
-- Inventory
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
-- Purchases
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
-- Purchase Items
ALTER TABLE purchase_items ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
-- Sales
ALTER TABLE sales ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
-- Sale Items
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
-- Stock Adjustments
ALTER TABLE stock_adjustments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
-- Payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();

-- 2. MIGRATE EXISTING DATA TO CREATOR OR DEFAULT USER
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_default_user UUID;
BEGIN
  -- Find the first user in profiles
  SELECT id INTO v_default_user FROM profiles ORDER BY created_at ASC LIMIT 1;

  IF v_default_user IS NOT NULL THEN
    -- Update existing records to link with their creator or default user
    UPDATE suppliers SET user_id = COALESCE(user_id, v_default_user) WHERE user_id IS NULL;
    UPDATE categories SET user_id = COALESCE(user_id, v_default_user) WHERE user_id IS NULL;
    UPDATE customers SET user_id = COALESCE(user_id, v_default_user) WHERE user_id IS NULL;
    UPDATE products SET user_id = COALESCE(user_id, v_default_user) WHERE user_id IS NULL;
    UPDATE purchases SET user_id = COALESCE(user_id, created_by, v_default_user) WHERE user_id IS NULL;
    UPDATE sales SET user_id = COALESCE(user_id, created_by, v_default_user) WHERE user_id IS NULL;
    UPDATE stock_adjustments SET user_id = COALESCE(user_id, created_by, v_default_user) WHERE user_id IS NULL;
    UPDATE payments SET user_id = COALESCE(user_id, created_by, v_default_user) WHERE user_id IS NULL;

    -- Update inventory user_id from products
    UPDATE inventory i
    SET user_id = p.user_id
    FROM products p
    WHERE i.product_id = p.id AND i.user_id IS NULL;

    -- Update purchase_items user_id from purchases
    UPDATE purchase_items pi
    SET user_id = p.user_id
    FROM purchases p
    WHERE pi.purchase_id = p.id AND pi.user_id IS NULL;

    -- Update sale_items user_id from sales
    UPDATE sale_items si
    SET user_id = s.user_id
    FROM sales s
    WHERE si.sale_id = s.id AND si.user_id IS NULL;
  END IF;
END $$;

-- 3. UPDATE UNIQUE CONSTRAINTS (SCOPED BY USER)
-- ────────────────────────────────────────────────────────────
-- Products SKU: per-user unique
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_sku_key;
DROP INDEX IF EXISTS idx_products_sku;
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_user_sku ON products(user_id, sku);

-- Purchases purchase_number: per-user unique
ALTER TABLE purchases DROP CONSTRAINT IF EXISTS purchases_purchase_number_key;
DROP INDEX IF EXISTS idx_purchases_purchase_number_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_purchases_user_number ON purchases(user_id, purchase_number);

-- Sales invoice_number: per-user unique
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_invoice_number_key;
DROP INDEX IF EXISTS idx_sales_invoice_number_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_user_invoice ON sales(user_id, invoice_number);

-- 4. CREATE INDEXES ON user_id FOR HIGH PERFORMANCE
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_user_id ON inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_user_id ON purchase_items(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_user_id ON sale_items(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_user_id ON stock_adjustments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);

-- 5. UPDATE ROW LEVEL SECURITY (RLS) POLICIES
-- ────────────────────────────────────────────────────────────

-- Ensure RLS is enabled on all tables
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

-- Drop old shared policies
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can manage own profile" ON profiles;

DROP POLICY IF EXISTS "All authenticated can view categories" ON categories;
DROP POLICY IF EXISTS "Managers+ can insert categories" ON categories;
DROP POLICY IF EXISTS "Managers+ can update categories" ON categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON categories;
DROP POLICY IF EXISTS "Users can manage own categories" ON categories;

DROP POLICY IF EXISTS "All authenticated can view suppliers" ON suppliers;
DROP POLICY IF EXISTS "Managers+ can manage suppliers" ON suppliers;
DROP POLICY IF EXISTS "Managers+ can update suppliers" ON suppliers;
DROP POLICY IF EXISTS "Admins can delete suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can manage own suppliers" ON suppliers;

DROP POLICY IF EXISTS "All authenticated can view customers" ON customers;
DROP POLICY IF EXISTS "Staff+ can manage customers" ON customers;
DROP POLICY IF EXISTS "Staff+ can update customers" ON customers;
DROP POLICY IF EXISTS "Managers+ can delete customers" ON customers;
DROP POLICY IF EXISTS "Users can manage own customers" ON customers;

DROP POLICY IF EXISTS "All authenticated can view products" ON products;
DROP POLICY IF EXISTS "Managers+ can create products" ON products;
DROP POLICY IF EXISTS "Managers+ can update products" ON products;
DROP POLICY IF EXISTS "Admins can delete products" ON products;
DROP POLICY IF EXISTS "Users can manage own products" ON products;

DROP POLICY IF EXISTS "All authenticated can view inventory" ON inventory;
DROP POLICY IF EXISTS "System can manage inventory" ON inventory;
DROP POLICY IF EXISTS "Users can manage own inventory" ON inventory;

DROP POLICY IF EXISTS "Managers+ can view purchases" ON purchases;
DROP POLICY IF EXISTS "Managers+ can create purchases" ON purchases;
DROP POLICY IF EXISTS "Managers+ can update purchases" ON purchases;
DROP POLICY IF EXISTS "Users can manage own purchases" ON purchases;

DROP POLICY IF EXISTS "Managers+ can view purchase items" ON purchase_items;
DROP POLICY IF EXISTS "System can manage purchase items" ON purchase_items;
DROP POLICY IF EXISTS "Users can manage own purchase items" ON purchase_items;

DROP POLICY IF EXISTS "Staff+ can view sales" ON sales;
DROP POLICY IF EXISTS "Staff+ can create sales" ON sales;
DROP POLICY IF EXISTS "Managers+ can update sales" ON sales;
DROP POLICY IF EXISTS "Users can manage own sales" ON sales;

DROP POLICY IF EXISTS "Staff+ can view sale items" ON sale_items;
DROP POLICY IF EXISTS "System can manage sale items" ON sale_items;
DROP POLICY IF EXISTS "Users can manage own sale items" ON sale_items;

DROP POLICY IF EXISTS "Managers+ can view adjustments" ON stock_adjustments;
DROP POLICY IF EXISTS "Managers+ can create adjustments" ON stock_adjustments;
DROP POLICY IF EXISTS "Users can manage own stock adjustments" ON stock_adjustments;

DROP POLICY IF EXISTS "Managers+ can view payments" ON payments;
DROP POLICY IF EXISTS "System can manage payments" ON payments;
DROP POLICY IF EXISTS "Users can manage own payments" ON payments;

DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
DROP POLICY IF EXISTS "System can create audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can manage own audit logs" ON audit_logs;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can manage own notifications" ON notifications;

-- Create strict user-isolated policies
CREATE POLICY "Users can manage own profile" ON profiles
  FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "Users can manage own categories" ON categories
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage own suppliers" ON suppliers
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage own customers" ON customers
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage own products" ON products
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage own inventory" ON inventory
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage own purchases" ON purchases
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage own purchase items" ON purchase_items
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage own sales" ON sales
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage own sale items" ON sale_items
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage own stock adjustments" ON stock_adjustments
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage own payments" ON payments
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage own audit logs" ON audit_logs
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage own notifications" ON notifications
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 6. UPDATE RPC FUNCTIONS TO PRESERVE user_id
-- ────────────────────────────────────────────────────────────

-- RPC: create_purchase
CREATE OR REPLACE FUNCTION create_purchase(
  purchase_data JSONB,
  items_data JSONB
)
RETURNS UUID AS $$
DECLARE
  purchase_id UUID;
  item JSONB;
  v_user_id UUID;
BEGIN
  v_user_id := COALESCE((purchase_data->>'user_id')::UUID, (purchase_data->>'created_by')::UUID, auth.uid());

  -- Insert purchase
  INSERT INTO purchases (
    purchase_number, supplier_id, purchase_date, subtotal, discount, tax,
    total_amount, payment_status, payment_method, notes, created_by, user_id
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
    (purchase_data->>'created_by')::UUID,
    v_user_id
  )
  RETURNING id INTO purchase_id;

  -- Insert items and update inventory
  FOR item IN SELECT * FROM jsonb_array_elements(items_data) LOOP
    -- Insert purchase item
    INSERT INTO purchase_items (purchase_id, product_id, quantity, purchase_price, tax_percent, discount, total, user_id)
    VALUES (
      purchase_id,
      (item->>'product_id')::UUID,
      (item->>'quantity')::NUMERIC,
      (item->>'purchase_price')::NUMERIC,
      (item->>'tax_percent')::NUMERIC,
      (item->>'discount')::NUMERIC,
      (item->>'total')::NUMERIC,
      v_user_id
    );

    -- Update or insert inventory
    INSERT INTO inventory (product_id, quantity, updated_at, user_id)
    VALUES ((item->>'product_id')::UUID, (item->>'quantity')::NUMERIC, NOW(), v_user_id)
    ON CONFLICT (product_id) DO UPDATE
    SET quantity = inventory.quantity + (item->>'quantity')::NUMERIC,
        updated_at = NOW(),
        user_id = v_user_id;
  END LOOP;

  -- Create payment record if paid
  IF purchase_data->>'payment_status' = 'paid' THEN
    INSERT INTO payments (transaction_type, transaction_id, amount, payment_method, payment_date, created_by, user_id)
    VALUES (
      'purchase', purchase_id,
      (purchase_data->>'total_amount')::NUMERIC,
      purchase_data->>'payment_method',
      (purchase_data->>'purchase_date')::DATE,
      (purchase_data->>'created_by')::UUID,
      v_user_id
    );
  END IF;

  -- Audit log
  INSERT INTO audit_logs (user_id, action, module, record_id, description)
  VALUES (
    v_user_id,
    'CREATE_PURCHASE', 'PURCHASES', purchase_id,
    'Created purchase order: ' || (purchase_data->>'purchase_number')
  );

  RETURN purchase_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: create_sale
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
  v_user_id UUID;
BEGIN
  v_user_id := COALESCE((sale_data->>'user_id')::UUID, (sale_data->>'created_by')::UUID, auth.uid());

  -- Validate stock for all items FIRST
  FOR item IN SELECT * FROM jsonb_array_elements(items_data) LOOP
    SELECT i.quantity, p.name
    INTO cur_qty, product_name
    FROM inventory i
    JOIN products p ON p.id = i.product_id
    WHERE i.product_id = (item->>'product_id')::UUID;

    IF cur_qty IS NULL THEN
      RAISE EXCEPTION 'Product % is not found in inventory', (item->>'product_id');
    END IF;

    IF cur_qty < (item->>'quantity')::NUMERIC THEN
      RAISE EXCEPTION 'Insufficient stock for product "%". Available: %, Requested: %',
        COALESCE(product_name, 'Unknown'), cur_qty, (item->>'quantity')::NUMERIC;
    END IF;
  END LOOP;

  -- Insert sale
  INSERT INTO sales (
    invoice_number, customer_id, sale_date, subtotal, discount, tax,
    total_amount, payment_status, payment_method, notes, created_by, user_id
  )
  VALUES (
    sale_data->>'invoice_number',
    (sale_data->>'customer_id')::UUID,
    (sale_data->>'sale_date')::DATE,
    (sale_data->>'subtotal')::NUMERIC,
    (sale_data->>'discount')::NUMERIC,
    (sale_data->>'tax')::NUMERIC,
    (sale_data->>'total_amount')::NUMERIC,
    sale_data->>'payment_status',
    sale_data->>'payment_method',
    sale_data->>'notes',
    (sale_data->>'created_by')::UUID,
    v_user_id
  )
  RETURNING id INTO sale_id;

  -- Insert items and deduct inventory
  FOR item IN SELECT * FROM jsonb_array_elements(items_data) LOOP
    -- Insert sale item
    INSERT INTO sale_items (sale_id, product_id, quantity, selling_price, tax_percent, discount, total, user_id)
    VALUES (
      sale_id,
      (item->>'product_id')::UUID,
      (item->>'quantity')::NUMERIC,
      (item->>'selling_price')::NUMERIC,
      (item->>'tax_percent')::NUMERIC,
      (item->>'discount')::NUMERIC,
      (item->>'total')::NUMERIC,
      v_user_id
    );

    -- Deduct stock
    UPDATE inventory
    SET quantity = quantity - (item->>'quantity')::NUMERIC,
        updated_at = NOW()
    WHERE product_id = (item->>'product_id')::UUID;
  END LOOP;

  -- Create payment record if paid
  IF sale_data->>'payment_status' = 'paid' THEN
    INSERT INTO payments (transaction_type, transaction_id, amount, payment_method, payment_date, created_by, user_id)
    VALUES (
      'sale', sale_id,
      (sale_data->>'total_amount')::NUMERIC,
      sale_data->>'payment_method',
      (sale_data->>'sale_date')::DATE,
      (sale_data->>'created_by')::UUID,
      v_user_id
    );
  END IF;

  -- Audit log
  INSERT INTO audit_logs (user_id, action, module, record_id, description)
  VALUES (
    v_user_id,
    'CREATE_SALE', 'SALES', sale_id,
    'Created sale invoice: ' || (sale_data->>'invoice_number')
  );

  RETURN sale_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: adjust_stock
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
    product_id, adjustment_type, quantity, previous_quantity, new_quantity, reason, created_by, user_id
  )
  VALUES (p_product_id, p_adjustment_type, v_abs_qty, v_current_qty, v_new_qty, p_reason, p_user_id, p_user_id);

  -- Audit log
  INSERT INTO audit_logs (user_id, action, module, record_id, description)
  VALUES (p_user_id, 'STOCK_ADJUSTMENT', 'INVENTORY', p_product_id,
    'Stock adjusted (' || p_adjustment_type || '): ' || v_current_qty || ' → ' || v_new_qty);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. AUTO-ASSIGN ADMIN ROLE TO NEW USERS
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'admin'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    email = COALESCE(EXCLUDED.email, profiles.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
