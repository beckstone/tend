/* import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            To get started, edit the page.tsx file.
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Looking for a starting point or more instructions? Head over to{" "}
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Templates
            </a>{" "}
            or the{" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Learning
            </a>{" "}
            center.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  ); */
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
    return <div className="p-6 text-red-500">Error loading Tend tasks.</div>
  }

  return (
    <main className="max-w-xl mx-auto p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Tend</h1>
        <p className="text-slate-500 italic">Tend to What Matters</p>
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


    {/* /*   {<ul className="space-y-3">
        {tasks?.map((task) => (
          <li key={task.id} className="flex justify-between p-4 bg-white border rounded-lg shadow-sm">
            <span className={task.is_completed ? 'line-through text-slate-400' : 'text-slate-800'}>
              {task.title}
            </span>
            <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 self-center">
              {task.category}
            </span>
          </li>
        ))}
      </ul>
    </main>
  )
} */ */}
