import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { redirigirEnlaceRecuperacion } from './utils/enlaceRecuperacion'

// HU-32: si el correo trae el enlace sin "#" (…/reset-password?token=…), se pasa a la ruta del HashRouter.
redirigirEnlaceRecuperacion()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
