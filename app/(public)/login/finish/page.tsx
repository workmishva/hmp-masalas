'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { getAuth, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth'
import toast from 'react-hot-toast'
import { firebaseApp } from '@/lib/firebase'
import { EMAIL_SIGN_IN_KEY } from '@/components/ui/EmailSignInButton'

export default function FinishLoginPage() {
  const router = useRouter()
  const [message, setMessage] = useState('Verifying your sign-in link...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function handleSignIn() {
      const auth = getAuth(firebaseApp)
      const href = window.location.href

      if (isSignInWithEmailLink(auth, href)) {
        let email = window.localStorage.getItem(EMAIL_SIGN_IN_KEY)
        if (!email) {
          // User opened the link on a different device. To prevent session fixation
          // attacks, ask the user to provide the email again.
          // For simplicity in this implementation, we will show an error.
          // A more robust solution would be a form to re-enter the email.
          setError('Sign-in email not found. Please try signing in again from the same device.')
          setMessage('Error')
          return
        }

        try {
          setMessage('Confirming your email...')
          const result = await signInWithEmailLink(auth, email, href)
          window.localStorage.removeItem(EMAIL_SIGN_IN_KEY)
          if (cancelled) return

          setMessage('Signing you in...')
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
                router.push('/profile/setup')
                router.refresh()
                return
              }
            }
          } catch {
            // Fall through to normal redirect
          }

          window.location.replace('/')

        } catch (err) {
          if (cancelled) return
          console.error('Failed to sign in with email link:', err)
          setError('The sign-in link is invalid or has expired. Please try again.')
          setMessage('Error')
        }
      } else {
        setError('This is not a valid sign-in link.')
        setMessage('Error')
      }
    }

    handleSignIn()

    return () => {
      cancelled = true
    }
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">{error ? 'Sign-In Failed' : 'Signing In'}</h1>
        <p className="text-masala-600 mb-8">{error || message}</p>
        <div className="flex items-center justify-center">
          {!error && (
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-masala-200 border-t-chili-600" />
          )}
        </div>
        {error && (
          <button
            onClick={() => router.push('/login')}
            className="mt-4 px-6 py-2 bg-chili-600 text-white font-semibold rounded-lg"
          >
            Back to Login
          </button>
        )}
      </div>
    </div>
  )
}
