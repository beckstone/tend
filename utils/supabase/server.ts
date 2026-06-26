import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function getPublicSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Missing Supabase environment variables for the server client.')
  }

  if (anonKey.startsWith('sb_secret_')) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is set to a secret key. Use the public anon key instead.')
  }

  return { url, anonKey }
}

export async function createClient() {
  const cookieStore = await cookies()
  const { url, anonKey } = getPublicSupabaseConfig()

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method can be ignored if the function
            // is called from a Server Component
          }
        },
      },
    }
  )
}
