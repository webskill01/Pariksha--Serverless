// src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initGA } from './utils/analytics.js'

// Initialize Google Analytics
if (import.meta.env.PROD) {
  // Only initialize in production
  initGA()
} else {
  console.log('📊 Google Analytics: Development mode - tracking disabled')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
