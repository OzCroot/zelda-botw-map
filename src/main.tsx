import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { initData } from './data/loadMarkers'

// Fetch the marker data and the app code in parallel; render once both are ready.
void (async () => {
  const [, { default: App }] = await Promise.all([initData(), import('./App.tsx')])
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})()
