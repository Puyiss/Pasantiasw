import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { AdminPage } from './pages/AdminPage'
import { AlumnoDetailPage } from './pages/AlumnoDetailPage'
import { AlumnoPage } from './pages/AlumnoPage'
import { HomeRedirect } from './pages/HomeRedirect'
import { LoginPage } from './pages/LoginPage'
import { MentorPage } from './pages/MentorPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { ProfesorPage } from './pages/ProfesorPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<HomeRedirect />} />
          </Route>
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={['profesor']} />}>
            <Route path="/profesor" element={<ProfesorPage />} />
            <Route path="/profesor/alumno/:id" element={<AlumnoDetailPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={['alumno']} />}>
            <Route path="/alumno" element={<AlumnoPage />} />
            <Route path="/alumno/onboarding" element={<OnboardingPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={['responsable']} />}>
            <Route path="/mentor" element={<MentorPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
