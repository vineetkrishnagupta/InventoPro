#!/bin/bash
# Script to apply RPC functions and RLS policies to Supabase
# Uses the service role key via the Supabase SQL endpoint

SUPABASE_URL="https://rrjkzgojiajrdupojutq.supabase.co"
SERVICE_KEY="your-service-role-key-here"

run_sql() {
  local sql="$1"
  local result
  result=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_raw_sql" \
    -H "apikey: ${SERVICE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"sql\": $(echo "$sql" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read()))')}" 2>&1)
  echo "$result"
}

echo "Applying SQL schema..."
SQL=$(cat supabase/schema.sql)
echo "Schema length: ${#SQL} chars"

# Try psql approach if available
if command -v psql &>/dev/null; then
  echo "psql available, using direct connection..."
  # Would need DATABASE_URL
fi

echo "Done."
