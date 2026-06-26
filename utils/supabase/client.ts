import { createBrowserClient } from '@supabase/ssr'

function getPublicSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Missing Supabase environment variables for the browser client.')
  }

  if (anonKey.startsWith('sb_secret_')) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is set to a secret key. Use the public anon key instead.')
  }

  return { url, anonKey }
}

export function createClient() {
  const { url, anonKey } = getPublicSupabaseConfig()

  return createBrowserClient(url, anonKey)
}

