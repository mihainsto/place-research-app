import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/App'
import '@/styles/theme.css'
import '@/styles/prose.css'

/**
 * When a deploy's service worker takes over, reload once so the page is
 * actually running the new build.
 *
 * Without this the first visit after a deploy renders the previous build, and
 * anything the deploy *added* — a new route especially — appears missing. The
 * `hadController` guard means a first-ever visit (no previous worker) never
 * reloads; only a genuine update does.
 */
if ('serviceWorker' in navigator) {
  const hadController = Boolean(navigator.serviceWorker.controller)
  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return
    reloading = true
    window.location.reload()
  })
}

const root = document.getElementById('root')
if (!root) throw new Error('#root not found')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
