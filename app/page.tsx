import { createClient } from '@/utils/supabase/server'
import AddTaskForm from '@/components/AddTaskForm'

export default async function Dashboard() {
  const supabase = await createClient()
  
  // Fetch tasks sorted automatically by due date
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .order('due_date', { ascending: true })

  if (error) {
    return (
      <div className="p-6 text-red-500">
        <p className="font-semibold">Error loading Tend tasks.</p>
        <p className="mt-2 text-sm">{error.message}</p>
        <p className="mt-2 text-sm text-slate-600">
          This usually means the Supabase table permissions or Row Level Security policy need to be adjusted.
        </p>
      </div>
    )
  }

  return (
    <main className="max-w-xl mx-auto p-8">
      <header className="mb-6 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-green-900 leading-tight" style={{ fontFamily: 'var(--font-festive)' }}>
          Tend
        </h1>
        <p className="text-slate-500 italic mt-2">Tend to What Matters</p>
      </header>

      {/* Task Creation Form Action */}
      <AddTaskForm />

      {/* Tasks List Feed */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Your List</h3>
        
        {error && <p className="text-red-500 text-sm">Failed to sync with database.</p>}
        
        {tasks && tasks.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-6 border border-dashed rounded-xl">Your mind is clear. No active tasks to tend to.</p>
        ) : (
          tasks?.map((task) => (
            <div key={task.id} className="flex justify-between items-center p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-1">
                <span className={`text-sm font-medium ${task.is_completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                  {task.title}
                </span>
                {task.due_date && (
                  <span className="text-xs text-slate-400">
                    Due: {new Date(task.due_date).toLocaleDateString()}
                  </span>
                )}
              </div>
              <span className="text-xs bg-slate-100 px-2.5 py-1 rounded-full font-medium text-slate-600">
                {task.category}
              </span>
            </div>
          ))
        )}
      </div>
    </main>
  )
}



