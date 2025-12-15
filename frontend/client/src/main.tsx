import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'

// Pages
import Dashboard from './pages/Dashboard.tsx'
import LandingPage from './pages/LandingPage.tsx'
import AuthPage from './pages/AuthPage.tsx'
import ProfilePage from './pages/ProfilePage.tsx' // <--- ADDED
import FavoritesPage from './pages/FavoritesPage.tsx' // <--- ADDED

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<ProfilePage />} /> {/* <--- ADDED */}
        <Route path="/favorites" element={<FavoritesPage />} /> {/* <--- ADDED */}
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
