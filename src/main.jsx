import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// Poore page par link/image drag band (sab browsers mein)
document.addEventListener('dragstart', (e) => {
  if (e.target instanceof Element && e.target.closest('a, img')) {
    e.preventDefault()
  }
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)