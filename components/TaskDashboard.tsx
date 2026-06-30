"use client"

import { FormEvent, useEffect, useMemo, useState } from 'react'
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

const TASK_CATEGORIES = [
  'General',
  'Work',
  'Personal',
  'Health',
  'Finance',
  'Household Chores',
  'Self Improvement',
]

const supabase = createClient()

export default function TaskDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authMessage, setAuthMessage] = useState<string | null>(null)
  const [updatingTaskIds, setUpdatingTaskIds] = useState<number[]>([])
  const [deletingTaskIds, setDeletingTaskIds] = useState<number[]>([])
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<'dueDateAsc' | 'dueDateDesc' | 'category'>('dueDateAsc')
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: 'General',
    dueDate: '',
  })
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn')
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'General',
    dueDate: '',
    email: '',
    password: '',
  })

  const sortedTasks = useMemo(() => {
    const next = [...tasks]

    if (sortBy === 'category') {
      return next.sort((a, b) => {
        const categoryCompare = a.category.localeCompare(b.category)
        if (categoryCompare !== 0) return categoryCompare
        return a.title.localeCompare(b.title)
      })
    }

    return next.sort((a, b) => {
      if (!a.due_date && !b.due_date) return a.title.localeCompare(b.title)
      if (!a.due_date) return 1
      if (!b.due_date) return -1
      return sortBy === 'dueDateAsc'
        ? a.due_date.localeCompare(b.due_date)
        : b.due_date.localeCompare(a.due_date)
    })
  }, [tasks, sortBy])

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

  const handleToggleTaskComplete = async (taskId: number, isCompleted: boolean) => {
    if (!user) return

    setError(null)
    setUpdatingTaskIds((prev) => [...prev, taskId])
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, is_completed: isCompleted } : task
      )
    )

    const { error } = await supabase
      .from('tasks')
      .update({ is_completed: isCompleted })
      .eq('id', taskId)
      .eq('user_id', user.id)

    if (error) {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, is_completed: !isCompleted } : task
        )
      )
      setError(error.message)
    }

    setUpdatingTaskIds((prev) => prev.filter((id) => id !== taskId))
  }

  const handleDeleteTask = async (taskId: number) => {
    if (!user) return

    setError(null)
    setDeletingTaskIds((prev) => [...prev, taskId])

    const previousTasks = tasks
    setTasks((prev) => prev.filter((task) => task.id !== taskId))

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', user.id)

    if (error) {
      setTasks(previousTasks)
      setError(error.message)
    }

    setDeletingTaskIds((prev) => prev.filter((id) => id !== taskId))
  }

  const handleStartEditTask = (task: Task) => {
    setError(null)
    setEditingTaskId(task.id)
    setEditForm({
      title: task.title,
      description: task.description ?? '',
      category: task.category,
      dueDate: task.due_date ? task.due_date.split('T')[0] : '',
    })
  }

  const handleCancelEditTask = () => {
    setEditingTaskId(null)
  }

  const handleSaveTaskEdits = async (taskId: number) => {
    if (!user) return

    const title = editForm.title.trim()
    if (!title) {
      setError('Task title is required.')
      return
    }

    setError(null)
    setUpdatingTaskIds((prev) => [...prev, taskId])

    const previousTasks = tasks
    const editedTask = {
      title,
      description: editForm.description.trim() || null,
      category: editForm.category || 'General',
      due_date: editForm.dueDate || null,
    }

    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              title: editedTask.title,
              description: editedTask.description,
              category: editedTask.category,
              due_date: editedTask.due_date,
            }
          : task
      )
    )

    const { error } = await supabase
      .from('tasks')
      .update(editedTask)
      .eq('id', taskId)
      .eq('user_id', user.id)

    if (error) {
      setTasks(previousTasks)
      setError(error.message)
    } else {
      setEditingTaskId(null)
    }

    setUpdatingTaskIds((prev) => prev.filter((id) => id !== taskId))
  }

  if (authLoading) {
    return <p className="text-center text-sm text-slate-500">Loading auth...</p>
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-semibold text-green-900 mb-2">Sign in to Tend</h1>
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
          <p className="text-base font-semibold text-green-900">{user.email}</p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50"
          disabled={loading}
        >
          Sign out
        </button>
      </div>

      <form onSubmit={handleAddTask} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-green-900">Add a New Task</h2>

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
                {TASK_CATEGORIES.map((category) => (
                  <option key={category}>{category}</option>
                ))}
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
            className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Adding task...' : 'Add Task'}
          </button>
        </div>
      </form>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-green-900 uppercase tracking-wider">Your List</h3>
          <div className="flex items-center gap-2">
            <label htmlFor="sortTasks" className="text-xs text-slate-500">Sort</label>
            <select
              id="sortTasks"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as 'dueDateAsc' | 'dueDateDesc' | 'category')}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-700"
            >
              <option value="dueDateAsc">Due date (ascending)</option>
              <option value="dueDateDesc">Due date (descending)</option>
              <option value="category">Category (A-Z)</option>
            </select>
            <span className="text-xs text-slate-400">{tasks.length} tasks</span>
          </div>
        </div>

        {loading && <p className="text-slate-500">Loading tasks...</p>}

        {!loading && tasks.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-6 border border-dashed rounded-xl">Your mind is clear. No active tasks to tend to.</p>
        ) : (
          sortedTasks.map((task) => {
            const isEditing = editingTaskId === task.id
            const isUpdating = updatingTaskIds.includes(task.id)
            const isDeleting = deletingTaskIds.includes(task.id)

            return (
              <div key={task.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={task.is_completed}
                        disabled={isUpdating || isDeleting}
                        onChange={(event) => handleToggleTaskComplete(task.id, event.target.checked)}
                        className="h-4 w-4 cursor-pointer rounded border-slate-300 text-green-700 focus:ring-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={`Mark ${task.title} as complete`}
                      />
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(event) => setEditForm((prev) => ({ ...prev, title: event.target.value }))}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-700"
                          placeholder="Task title"
                        />
                      ) : (
                        <p className={`text-sm font-semibold ${task.is_completed ? 'text-green-900/50 line-through' : 'text-green-900'}`}>
                          {task.title}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => (isEditing ? handleSaveTaskEdits(task.id) : handleStartEditTask(task))}
                        disabled={isUpdating || isDeleting}
                        className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isUpdating && isEditing ? 'Saving...' : isEditing ? 'Save task' : 'Edit task'}
                      </button>
                      {isEditing && (
                        <button
                          type="button"
                          onClick={handleCancelEditTask}
                          disabled={isUpdating}
                          className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteTask(task.id)}
                        disabled={isDeleting || isUpdating}
                        className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isDeleting ? 'Deleting...' : 'Delete task'}
                      </button>
                    </div>
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.description}
                      onChange={(event) => setEditForm((prev) => ({ ...prev, description: event.target.value }))}
                      className="w-full rounded border border-slate-300 px-2 py-1 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-700"
                      placeholder="Description"
                    />
                  ) : (
                    task.description && <p className="text-sm text-slate-600">{task.description}</p>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    {isEditing ? (
                      <select
                        value={editForm.category}
                        onChange={(event) => setEditForm((prev) => ({ ...prev, category: event.target.value }))}
                        className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-700"
                      >
                        {TASK_CATEGORIES.map((category) => (
                          <option key={category}>{category}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{task.category}</span>
                    )}
                    {isEditing ? (
                      <input
                        type="date"
                        value={editForm.dueDate}
                        onChange={(event) => setEditForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                        className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-700"
                      />
                    ) : (
                      <p className="text-right text-xs text-slate-400">
                        {task.due_date ? `Due: ${new Date(task.due_date).toLocaleDateString()}` : ''}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </section>
    </div>
  )
}
