"use client"

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-500">
      <div className="flex gap-1">
        <span className="h-2 w-2 rounded-full bg-slate-500 animate-pulse" />
        <span className="h-2 w-2 rounded-full bg-slate-500 animate-pulse animation-delay-75" />
        <span className="h-2 w-2 rounded-full bg-slate-500 animate-pulse animation-delay-150" />
      </div>
      <span>AI is typing...</span>
    </div>
  )
}
