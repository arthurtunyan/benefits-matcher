import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Fonts are bundled with the app (no Google Fonts request). Armenian files
// download only when Armenian text is on screen, thanks to unicode-range.
import '@fontsource-variable/public-sans'
import '@fontsource-variable/fraunces'
import '@fontsource-variable/noto-sans-armenian'
import '@fontsource-variable/noto-serif-armenian'
import './styles.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Offline support. The service worker only caches this site's own files.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('./sw.js')
}
