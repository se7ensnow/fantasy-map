import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Toaster 
      position="bottom-right"
      richColors
      toastOptions={{
        success: {
          className: "bg-amber-100 text-green-900 border border-green-400",
        },
        error: {
          className: "bg-amber-100 text-red-900 border border-red-400",
        },
        info: {
          className: "bg-amber-100 text-blue-900 border border-blue-400",
        },
        warning: {
          className: "bg-amber-100 text-orange-900 border border-orange-400",
        },
      }}
    />
  </StrictMode>,
)
