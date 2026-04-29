import { BrowserRouter, Route, Routes } from 'react-router-dom'
import PublicHome from '@/pages/PublicHome'
import CareersPage from '@/pages/CareersPage'
import JobDetailPage from '@/pages/JobDetailPage'
import BenefitsPage from '@/pages/BenefitsPage'
import AdminLogin from '@/pages/AdminLogin'
import AdminDashboard from '@/pages/AdminDashboard'
import AdminJobDetailPage from '@/pages/AdminJobDetailPage'

export default function App() {
  return (
    <BrowserRouter>
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
