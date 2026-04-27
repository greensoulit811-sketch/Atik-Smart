import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function getSlug() {
  const { data, error } = await supabase.from('landing_pages').select('slug').limit(1)
  if (error) {
    console.error(error)
    return
  }
  console.log('Slug:', data[0]?.slug)
}

getSlug()
