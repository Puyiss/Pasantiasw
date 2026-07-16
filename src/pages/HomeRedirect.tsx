import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function HomeRedirect() {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'admin') return <Navigate to="/admin" replace />
  if (user.role === 'profesor') return <Navigate to="/profesor" replace />
  if (user.role === 'responsable') return <Navigate to="/mentor" replace />
  return <Navigate to="/alumno" replace />
}
