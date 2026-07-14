import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import type { StudentProfile } from '../types'

export function HomeRedirect() {
  const { user } = useAuth()
  const [checking, setChecking] = useState(user?.role === 'alumno')
  const [needsSetup, setNeedsSetup] = useState(false)

  useEffect(() => {
    if (!user || user.role !== 'alumno') {
      setChecking(false)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const profile = await api<StudentProfile>('getProfile', { studentId: user.id })
        if (!cancelled) setNeedsSetup(!profile.setupCompleted)
      } catch {
        if (!cancelled) setNeedsSetup(true)
      } finally {
        if (!cancelled) setChecking(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user])

  if (!user) return <Navigate to="/login" replace />
  if (checking) return <p className="center-msg">Cargando…</p>
  if (user.role === 'admin') return <Navigate to="/admin" replace />
  if (user.role === 'profesor') return <Navigate to="/profesor" replace />
  if (user.role === 'responsable') return <Navigate to="/mentor" replace />
  if (needsSetup) return <Navigate to="/alumno/onboarding" replace />
  return <Navigate to="/alumno" replace />
}
