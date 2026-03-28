"use client"

import { modelOptions, ModelOption } from "@/components/modelOptions"

interface ModelSelectorProps {
  selectedModelId: string
  onChangeModel: (modelId: string) => void
}

export function ModelSelector({ selectedModelId, onChangeModel }: ModelSelectorProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800">
      <label className="mb-2 block font-semibold text-slate-700 dark:text-slate-200">Choose free model:</label>
      <select
        value={selectedModelId}
        onChange={(e) => onChangeModel(e.target.value)}
        className="w-full rounded-lg border px-3 py-2 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:bg-slate-900 dark:text-slate-100"
      >
        {modelOptions.map((option: ModelOption) => (
          <option key={option.id} value={option.id}>
            {option.name} ({option.label})
          </option>
        ))}
      </select>
      <div className="mt-2 flex flex-wrap gap-1 text-xs text-slate-500 dark:text-slate-300">
        {modelOptions
          .find((m) => m.id === selectedModelId)
          ?.tags.map((tag) => (
            <span key={tag} className="rounded bg-indigo-100 px-2 py-1 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
              {tag}
            </span>
          ))}
      </div>
    </div>
  )
}
