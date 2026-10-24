import { useEffect, useState } from 'react'
import SmartCalendar from './SmartCalendarLive'
import LoadingScreen from './components/LoadingScreen'
import LoginPage from './components/LoginPage'
import {
  auth,
  getFriendlyAuthError,
  getRedirectResult,
  isFirebaseConfigured,
  onAuthStateChanged,
  signInWithGoogle,
  signOut,
  type User,
} from './firebase/firebase'

const GUEST_SESSION_KEY = 'smartmail_guest'

export default function App() {
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [guestMode, setGuestMode] = useState<boolean>(() => sessionStorage.getItem(GUEST_SESSION_KEY) === 'true')
  const [route, setRoute] = useState<string>(() => window.location.pathname || '/')
  const [authReady, setAuthReady] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    if (!auth) {
      setAuthReady(true)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user ?? null)
      setAuthReady(true)
    })

    void getRedirectResult(auth).catch((error) => {
      setAuthError(getFriendlyAuthError(error))
      setAuthReady(true)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    const handlePopState = () => setRoute(window.location.pathname || '/')
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (!authReady) return

    const currentPath = window.location.pathname || '/'
    const isGuestSession = sessionStorage.getItem(GUEST_SESSION_KEY) === 'true'
    const isAuthorized = Boolean(authUser) || isGuestSession

    if (currentPath === '/dashboard' && !isAuthorized) {
      window.history.replaceState({}, '', '/')
      setRoute('/')
      return
    }

    if ((currentPath === '/' || currentPath === '') && isAuthorized) {
      window.history.replaceState({}, '', '/dashboard')
      setRoute('/dashboard')
      return
    }

    if (currentPath !== '/' && currentPath !== '/dashboard') {
      window.history.replaceState({}, '', isAuthorized ? '/dashboard' : '/')
      setRoute(isAuthorized ? '/dashboard' : '/')
    }
  }, [authReady, authUser, guestMode])

  const navigateTo = (nextRoute: string) => {
    const safeRoute = nextRoute.startsWith('/') ? nextRoute : `/${nextRoute}`
    window.history.pushState({}, '', safeRoute)
    setRoute(safeRoute)
  }

  const handleGoogleLogin = async () => {
    if (!auth || !isFirebaseConfigured) {
      setAuthError('Google login is not configured yet. Please add the Firebase environment variables.')
      return
    }

    setIsSubmitting(true)
    setAuthError(null)

    try {
      const result = await signInWithGoogle()
      if (result?.user) {
        sessionStorage.removeItem(GUEST_SESSION_KEY)
        setGuestMode(false)
        setAuthUser(result.user)
        navigateTo('/dashboard')
      }
    } catch (error) {
      setAuthError(getFriendlyAuthError(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGuestLogin = () => {
    sessionStorage.setItem(GUEST_SESSION_KEY, 'true')
    setGuestMode(true)
    setAuthUser(null)
    setAuthError(null)
    navigateTo('/dashboard')
  }

  const handleLogout = async () => {
    if (auth && authUser) {
      await signOut(auth)
    }

    sessionStorage.removeItem(GUEST_SESSION_KEY)
    setGuestMode(false)
    setAuthUser(null)
    setAuthError(null)
    navigateTo('/')
  }

  if (!authReady) {
    return <LoadingScreen />
  }

  const isGuestSession = sessionStorage.getItem(GUEST_SESSION_KEY) === 'true'
  const isAuthorized = Boolean(authUser) || isGuestSession

  if (!isAuthorized && route !== '/') {
    setTimeout(() => {
      window.history.replaceState({}, '', '/')
      setRoute('/')
    }, 0)
  }

  if (!isAuthorized) {
    return (
      <LoginPage
        onGoogleLogin={handleGoogleLogin}
        onGuestLogin={handleGuestLogin}
        isSubmitting={isSubmitting}
        error={authError}
      />
    )
  }

  return (
    <SmartCalendar
      user={authUser}
      guestMode={guestMode || isGuestSession}
      onLogout={handleLogout}
    />
  )
}
