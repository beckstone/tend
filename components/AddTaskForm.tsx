import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export default function AddTaskForm() {
  // This function runs entirely on your server when the form is submitted
  async function createTask(formData: FormData) {
    'use server'

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const dueDate = formData.get('dueDate') as string

    // Simple validation
    if (!title || title.trim() === '') return

    const supabase = await createClient()

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !sessionData.session?.user) {
      console.error('Unable to insert task because the user is not authenticated.', sessionError)
      return
    }

    const { error } = await supabase.from('tasks').insert({
      title: title.trim(),
      description: description || null,
      category: category || 'General',
      due_date: dueDate || null,
      user_id: sessionData.session.user.id,
    })

    if (error) {
      console.error('Error inserting task:', error)
      return
    }

    // Refresh the dashboard page automatically to display the new task instantly
    revalidatePath('/')
  }

  return (
    <form action={createTask} className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-8 space-y-4">
      <h2 className="text-sm font-semibold text-green-900">Add a New Task</h2>
      
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Title Input */}
        <div className="md:col-span-3">
          <input
            type="text"
            name="title"
            placeholder="What needs to be tended to?"
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 bg-white text-slate-900 placeholder-slate-400"
          />
        </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Description Input */}
        <div className="md:col-span-3">
          <input
            type="text"
            name="description"
            placeholder="Briefly describe this task."
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 bg-white text-slate-900 placeholder-slate-400"
          />
        </div>

        {/* Category Selection */}
        <div>
          <select
            name="category"
            defaultValue="General"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 bg-white text-slate-800"
          >
            <option value="General">General</option>
            <option value="Work">Work</option>
            <option value="Personal">Personal</option>
            <option value="Personal">Self Care</option>
            <option value="Health">Health</option>
            <option value="Finance">Finance</option>
            <option value="Personal">Household Chores</option>
            <option value="Personal">Self Improvement</option>
          </select>
        </div>

        {/* Due Date Input */}
        <div className="md:col-span-2">
          <input
            type="date"
            name="dueDate"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 bg-white text-slate-800"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-center">
        <button
          type="submit"
          className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white font-medium text-sm rounded-lg transition-colors shadow-sm"
        >
          Add Task
        </button>
      </div>
    </form>
  )
}
