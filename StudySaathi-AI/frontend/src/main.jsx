import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Remove StrictMode temporarily to fix Firestore double-init issue
createRoot(document.getElementById('root')).render(
  <App />
)
