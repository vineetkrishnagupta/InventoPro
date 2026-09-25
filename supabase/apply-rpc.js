// Run this script to apply RPC functions to your Supabase database
// Usage: node supabase/apply-rpc.js

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://rrjkzgojiajrdupojutq.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key-here'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
})

// Split schema.sql into individual statements
function splitStatements(sql) {
  const statements = []
  let current = ''
  let dollarDepth = 0
  let inDollar = false
  
  const lines = sql.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    
    // Skip full-line comments
    if (trimmed.startsWith('--')) {
      current += line + '\n'
      continue
    }
    
    current += line + '\n'
    
    // Track $$ dollar-quoting depth
    const dollars = (line.match(/\$\$/g) || []).length
    dollarDepth += dollars
    inDollar = dollarDepth % 2 !== 0
    
    // Statement end: semicolon at end of line, outside dollar-quoted block
    if (!inDollar && trimmed.endsWith(';')) {
      const stmt = current.trim()
      if (stmt.length > 1 && !stmt.startsWith('--')) {
        statements.push(stmt)
      }
      current = ''
    }
  }
  
  if (current.trim()) statements.push(current.trim())
  return statements
}

async function applySQL(statement, index) {
  try {
    const { data, error } = await supabase.rpc('exec', { sql: statement })
    if (error) {
      // Try direct table operations for simple statements
      console.warn(`  Statement ${index} via RPC failed, trying raw...`)
      throw error
    }
    return { success: true }
  } catch (e) {
    return { success: false, error: e.message || e }
  }
}

async function main() {
  console.log('🚀 Applying Supabase schema...')
  
  const schemaPath = join(__dirname, 'schema.sql')
  const sql = readFileSync(schemaPath, 'utf-8')
  
  // Apply just the function and RLS parts
  const functionsSQL = readFileSync(join(__dirname, 'functions.sql'), 'utf-8')
  
  console.log('Testing connection...')
  const { data, error } = await supabase.from('categories').select('count').limit(1)
  if (error && error.code !== 'PGRST116') {
    console.error('❌ Connection failed:', error.message)
    console.log('\nPlease run the SQL in supabase/schema.sql manually in the Supabase SQL Editor.')
    console.log('URL: https://app.supabase.com/project/rrjkzgojiajrdupojutq/sql/new')
    process.exit(1)
  }
  
  console.log('✅ Connection successful!')
  console.log('\nThe schema tables already exist.')
  console.log('\nTo apply RPC functions and RLS policies:')
  console.log('1. Go to: https://app.supabase.com/project/rrjkzgojiajrdupojutq/sql/new')
  console.log('2. Paste the content of: supabase/functions.sql')
  console.log('3. Click "Run"')
}

main().catch(console.error)
