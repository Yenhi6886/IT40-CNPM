import { BrowserRouter, Route, Routes } from 'react-router-dom'
import PublicHome from '@/pages/PublicHome'
import AdminLogin from '@/pages/AdminLogin'
import AdminDashboard from '@/pages/AdminDashboard'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicHome />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}
