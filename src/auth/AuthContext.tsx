import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api } from '../api/client'
import type { SessionUser } from '../types'

const STORAGE_KEY = 'pasantias_session'

interface AuthContextValue {
  user: SessionUser | null
  login: (email: string, password: string) => Promise<SessionUser>
  logout: () => void
  setUser: (user: SessionUser | null) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as SessionUser
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<SessionUser | null>(() => loadSession())

  const setUser = useCallback((next: SessionUser | null) => {
    setUserState(next)
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    else localStorage.removeItem(STORAGE_KEY)
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      const session = await api<SessionUser>('login', { email, password })
      setUser(session)
      return session
    },
    [setUser],
  )

  const logout = useCallback(() => setUser(null), [setUser])

  const value = useMemo(
    () => ({ user, login, logout, setUser }),
    [user, login, logout, setUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
