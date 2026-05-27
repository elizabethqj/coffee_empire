import { create } from 'zustand'
import type { User } from 'firebase/auth'

interface AuthStore {
  user: User | null
  sessionId: string | null
  loading: boolean
  setUser: (user: User | null) => void
  setSessionId: (id: string | null) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  sessionId: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  setSessionId: (id) => set({ sessionId: id }),
}))
