import { BrowserRouter, Route, Routes } from 'react-router-dom'
import PublicHome from '@/pages/PublicHome'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicHome />} />
      </Routes>
    </BrowserRouter>
  )
}
