"use client"

export function EmptyState() {
  const suggestions = [
    "Write a short story about a robot who learns to cook",
    "Explain blockchain like I'm five",
    "Help me fix this JavaScript error",
  ]

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">
        ✨
      </div>
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Ask anything—no experience needed</h1>
      <p className="max-w-xl text-sm text-slate-600 dark:text-slate-300">
        Start with one of these friendly ideas. The AI responds as you type, in real time.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {suggestions.map((item) => (
          <div key={item} className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900">
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}
