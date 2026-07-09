import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.tsx'

// Google OAuth client IDs are public identifiers (the secret lives in the
// auth-server). Fall back to the project client ID so the sign-in button always
// renders even when a local .env is absent; VITE_GOOGLE_CLIENT_ID can override.
const GOOGLE_CLIENT_ID =
  (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ||
  '355354020888-nmt0qlr55adgprvhaht50oamstv637qs.apps.googleusercontent.com'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
