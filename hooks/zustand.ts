import { create } from "zustand"

interface UserSettings {
  name: string
  avatar: string
  themePreference: string
  defaultModel: string
  autoScroll: boolean
}

interface AppState {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
  settings: UserSettings | null
  setSettings: (settings: UserSettings) => void
}

export const useZustand = create<AppState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  settings: null,
  setSettings: (settings) => set({ settings }),
}))
