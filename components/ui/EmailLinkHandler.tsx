'use client'

import { useEffect, useState } from 'react'
import { signIn } from 'next-auth/react'
import { getAuth, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth'
import toast from 'react-hot-toast'
import { firebaseApp } from '@/lib/firebase'
import { EMAIL_SIGN_IN_KEY } from '@/components/ui/EmailSignInButton'

/**
 * Silently handles Firebase email-link sign-in on any page.
 * When the user clicks the magic link from their email, Firebase appends
 * query params to the URL. This component detects those params, completes
 * sign-in, and redirects to home.
 */
export function EmailLinkHandler() {
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function handleSignIn() {
      const auth = getAuth(firebaseApp)
      const href = window.location.href

      if (!isSignInWithEmailLink(auth, href)) return

      let email = window.localStorage.getItem(EMAIL_SIGN_IN_KEY)
      if (!email) {
        toast.error('Sign-in email not found. Please try signing in again from the same device.')
        return
      }

      setProcessing(true)

      try {
        const result = await signInWithEmailLink(auth, email, href)
        window.localStorage.removeItem(EMAIL_SIGN_IN_KEY)
        if (cancelled) return

        const idToken = await result.user.getIdToken()
        const nextAuthResult = await signIn('firebase-email-link', { idToken, redirect: false })

        if (nextAuthResult?.error) {
          throw new Error('NextAuth sign-in failed.')
        }

        toast.success('Successfully signed in!')

        // Check for profile completion and redirect
        try {
          const pr = await fetch('/api/user/profile')
          if (pr.ok) {
            const { data } = await pr.json()
            if (data && !data.profileCompleted) {
              window.location.replace('/profile/setup')
              return
            }
          }
        } catch {
          // Fall through to normal redirect
        }

        // Full page reload to home so the session is picked up
        window.location.replace('/')
      } catch (err) {
        if (cancelled) return
        console.error('Failed to sign in with email link:', err)
        toast.error('The sign-in link is invalid or has expired. Please try again.')
      } finally {
        if (!cancelled) setProcessing(false)
      }
    }

    handleSignIn()

    return () => {
      cancelled = true
    }
  }, [])

  if (!processing) return null

  // Show a subtle full-screen loading overlay while processing the sign-in
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 dark:bg-masala-900/80 backdrop-blur-sm">
      <div className="text-center">
        <div className="h-12 w-12 mx-auto animate-spin rounded-full border-4 border-masala-200 border-t-chili-600" />
        <p className="mt-4 text-sm font-medium text-masala-700 dark:text-masala-300">
          Signing you in...
        </p>
      </div>
    </div>
  )
}
