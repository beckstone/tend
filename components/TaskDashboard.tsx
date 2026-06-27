"use client"

import { FormEvent, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

type Task = {
  id: number
  title: string
  description?: string | null
  category: string
  due_date?: string | null
  is_completed: boolean
  created_at: string
}

type User = {
  id: string
  email?: string | null
}

const supabase = createClient()

export default function TaskDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authMessage, setAuthMessage] = useState<string | null>(null)
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn')
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'General',
    dueDate: '',
    email: '',
    password: '',
  })

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        setAuthError(error.message)
      }
      const session = data.session
      setUser(session?.user ?? null)
      setAuthLoading(false)
      if (session?.user) {
        await fetchTasks(session.user.id)
      }
    }

    getSession()

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchTasks(session.user.id)
      } else {
        setTasks([])
      }
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  const fetchTasks = async (userId: string) => {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('tasks')
      .select('id,title,description,category,due_date,is_completed,created_at')
      .eq('user_id', userId)
      .order('due_date', { ascending: true })

    if (error) {
      setError(error.message)
      setTasks([])
    } else {
      setTasks(data ?? [])
    }

    setLoading(false)
  }

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAuthError(null)
    setAuthMessage(null)
    setLoading(true)

    const email = form.email.trim()
    const password = form.password

    if (!email || !password) {
      setAuthError('Email and password are required.')
      setLoading(false)
      return
    }

    if (mode === 'signIn') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setAuthError(error.message)
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'http://localhost:3001/',
        },
      })
      if (error) {
        setAuthError(error.message)
      } else {
        setAuthMessage('Account created. Check your email to confirm your address.')
      }
    }

    setLoading(false)
  }

  const handleSignOut = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    setUser(null)
    setTasks([])
    setLoading(false)
  }

  const handleAddTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) return
    setError(null)
    setLoading(true)

    const { error } = await supabase
      .from('tasks')
      .insert({
        title: form.title.trim(),
        description: form.description || null,
        category: form.category || 'General',
        due_date: form.dueDate || null,
        user_id: user.id,
      })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setForm((prev) => ({ ...prev, title: '', description: '', dueDate: '' }))

    await fetchTasks(user.id)

    setLoading(false)
  }

  if (authLoading) {
    return <p className="text-center text-sm text-slate-500">Loading auth...</p>
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-semibold text-green-700 mb-2">Sign in to Tend</h1>
          <p className="text-sm text-slate-500 mb-4">Sign in or create an account </p>
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-slate-600 mb-1">Email</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-800"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-slate-600 mb-1">Password</label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-800"
              />
            </div>
            {authError && <p className="text-sm text-red-500">{authError}</p>}
            {authMessage && <p className="text-sm text-emerald-600">{authMessage}</p>}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="submit"
                className="w-full rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Working...' : mode === 'signIn' ? 'Sign in' : 'New Account'}
              </button>
              <button
                type="button"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap text-nowrap sm:w-auto"
                disabled={loading}
                onClick={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}
              >
                {mode === 'signIn' ? 'New Account' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-slate-500">Signed in as</p>
          <p className="text-base font-semibold text-slate-900">{user.email}</p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          disabled={loading}
        >
          Sign out
        </button>
      </div>

      <form onSubmit={handleAddTask} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Add a New Task</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-xs font-medium text-slate-600 mb-1">Title</label>
            <input
              id="title"
              type="text"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="What needs to be tended to?"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-800"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-xs font-medium text-slate-600 mb-1">Description</label>
            <input
              id="description"
              type="text"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Briefly describe this task."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label htmlFor="category" className="block text-xs font-medium text-slate-600 mb-1">Category</label>
              <select
                id="category"
                value={form.category}
                onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-800"
              >
                <option>General</option>
                <option>Work</option>
                <option>Personal</option>
                <option>Health</option>
                <option>Finance</option>
                <option>Household Chores</option>
                <option>Self Improvement</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="dueDate" className="block text-xs font-medium text-slate-600 mb-1">Due Date</label>
              <input
                id="dueDate"
                type="date"
                value={form.dueDate}
                onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-800"
              />
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-green-900 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
          >
            {loading ? 'Adding task...' : 'Add Task'}
          </button>
        </div>
      </form>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Your List</h3>
          <span className="text-xs text-slate-400">{tasks.length} tasks</span>
        </div>

        {loading && <p className="text-slate-500">Loading tasks...</p>}

        {!loading && tasks.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-6 border border-dashed rounded-xl">Your mind is clear. No active tasks to tend to.</p>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{task.category}</span>
                </div>
                {task.description && <p className="text-sm text-slate-600">{task.description}</p>}
                {task.due_date && <p className="text-xs text-slate-400">Due: {new Date(task.due_date).toLocaleDateString()}</p>}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  )
}
