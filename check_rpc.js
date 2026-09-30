import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://rrjkzgojiajrdupojutq.supabase.co',
  'sb_publishable_l-drrdfgR3pNRxDmKD9fwA_BnTcK1So'
)

async function check() {
  const { data, error } = await supabase.rpc('create_purchase', { purchase_data: {}, items_data: [] })
  console.log(error)
}
check()
