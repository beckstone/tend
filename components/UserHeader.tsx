import { createClient } from '@/utils/supabase/client'

const supabase = createClient()

export default async function UserHeader() {
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return (
    <div className="mb-6 flex items-center justify-end gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700">
      <span>Signed in as {user.email}</span>
      <form action={async () => { 'use server'; await supabase.auth.signOut() }}>
        <button type="submit" className="rounded-lg bg-green-700 px-3 py-2 text-white text-xs font-medium hover:bg-green-600">
          Sign out
        </button>
      </form>
    </div>
  )
}
