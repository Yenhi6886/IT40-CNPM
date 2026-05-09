import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import PublicHome from '@/pages/PublicHome'
import CareersPage from '@/pages/CareersPage'
import JobDetailPage from '@/pages/JobDetailPage'
import BenefitsPage from '@/pages/BenefitsPage'
import AdminLogin from '@/pages/AdminLogin'
import AdminDashboard from '@/pages/AdminDashboard'
import AdminJobDetailPage from '@/pages/AdminJobDetailPage'

function RouteScrollManager() {
  const location = useLocation()

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1)
      const el = document.getElementById(id)
      if (el) {
        requestAnimationFrame(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
        return
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname, location.search, location.hash])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <RouteScrollManager />
      <Routes>
        <Route path="/" element={<PublicHome />} />
        <Route path="/careers" element={<CareersPage />} />
        <Route path="/careers/:id" element={<JobDetailPage />} />
        <Route path="/benefits" element={<BenefitsPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/site" element={<AdminDashboard />} />
        <Route path="/admin/jobs" element={<AdminDashboard />} />
        <Route path="/admin/job-edit" element={<AdminDashboard />} />
        <Route path="/admin/cv" element={<AdminDashboard />} />
        <Route path="/admin/jobs/:id" element={<AdminJobDetailPage />} />
      </Routes>
    </BrowserRouter>
  )
}
