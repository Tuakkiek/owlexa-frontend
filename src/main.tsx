import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initAuthStorage } from './auth/authService'
import './index.css'
import App from './App.tsx'

initAuthStorage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
