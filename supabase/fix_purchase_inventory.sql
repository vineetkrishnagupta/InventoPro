-- ============================================================
-- FIX: create_purchase — ensure inventory is incremented
-- Run this in your Supabase SQL Editor
-- ============================================================

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
  v_user_id := COALESCE(
    (purchase_data->>'user_id')::UUID,
    (purchase_data->>'created_by')::UUID,
    auth.uid()
  );

  -- Insert purchase record
  INSERT INTO purchases (
    purchase_number, supplier_id, purchase_date,
    subtotal, discount, tax, total_amount,
    payment_status, payment_method, notes,
    created_by, user_id
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

  -- Insert items and INCREMENT inventory
  FOR item IN SELECT * FROM jsonb_array_elements(items_data) LOOP

    -- Insert purchase item row
    INSERT INTO purchase_items (
      purchase_id, product_id, quantity,
      purchase_price, tax_percent, discount, total, user_id
    )
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

    -- ── KEY FIX: Increment stock ──────────────────────────────
    -- If inventory row exists → add quantity
    -- If it doesn't exist    → create it with this quantity
    INSERT INTO inventory (product_id, quantity, reserved_quantity, updated_at, user_id)
    VALUES (
      (item->>'product_id')::UUID,
      (item->>'quantity')::NUMERIC,
      0,
      NOW(),
      v_user_id
    )
    ON CONFLICT (product_id)
    DO UPDATE SET
      quantity   = inventory.quantity + EXCLUDED.quantity,
      updated_at = NOW();

  END LOOP;

  -- Create payment record if status is 'paid'
  IF purchase_data->>'payment_status' = 'paid' THEN
    INSERT INTO payments (
      transaction_type, transaction_id, amount,
      payment_method, payment_date, created_by, user_id
    )
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
    'Purchase order created: ' || (purchase_data->>'purchase_number')
  );

  RETURN purchase_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
