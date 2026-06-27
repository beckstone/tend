import TaskDashboard from '@/components/TaskDashboard'

export default function Dashboard() {
  return (
    <main className="max-w-xl mx-auto p-8 space-y-6">
      <header className="text-center space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Tend</h1>
        <p className="text-sm text-slate-500">Organize what matters and stay on top of your day.</p>
      </header>
      <TaskDashboard />
    </main>
  )
}




