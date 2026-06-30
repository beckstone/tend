"use client"

import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

const supabase = createClient()

export default function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="rounded-lg bg-green-700 px-3 py-2 text-xs font-medium text-white hover:bg-green-600"
    >
      Sign out
    </button>
  )
}
