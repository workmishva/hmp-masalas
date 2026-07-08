'use client'

import { useState } from 'react'
import { getAuth, sendSignInLinkToEmail } from 'firebase/auth'
import toast from 'react-hot-toast'
import { firebaseApp } from '@/lib/firebase'
import { Mail, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface EmailSignInButtonProps {
  email: string
  label?: string
}

export const EMAIL_SIGN_IN_KEY = 'hmp-email-for-signin'

/**
 * Masks an email: shows first 2 chars, replaces rest with asterisks before @.
 * e.g. mishvapanchani20@gmail.com → mi**************@gmail.com
 */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain || local.length <= 2) return email
  const visible = local.slice(0, 2)
  const masked = '*'.repeat(local.length - 2)
  return `${visible}${masked}@${domain}`
}

export function EmailSignInButton({ email, label = 'Continue with Email' }: EmailSignInButtonProps) {
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [maskedEmail, setMaskedEmail] = useState('')

  const handleEmailSignIn = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address.')
      return
    }

    setLoading(true)
    try {
      const auth = getAuth(firebaseApp)
      const actionCodeSettings = {
        url: `${window.location.origin}/`,
        handleCodeInApp: true,
      }

      await sendSignInLinkToEmail(auth, email, actionCodeSettings)
      window.localStorage.setItem(EMAIL_SIGN_IN_KEY, email)

      setMaskedEmail(maskEmail(email.trim().toLowerCase()))
      setShowModal(true)
    } catch (error) {
      console.error('Email sign-in error:', error)
      toast.error('Failed to send sign-in link. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleEmailSignIn}
        disabled={loading || !email.trim()}
        className="w-full flex items-center justify-center gap-3 rounded-xl border border-masala-200 bg-white dark:bg-masala-100 dark:border-masala-300 py-3.5 text-sm font-semibold text-masala-800 dark:text-masala-900 shadow-sm hover:bg-masala-50 dark:hover:bg-masala-200 hover:border-masala-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-masala-300 border-t-masala-700" />
        ) : (
          <>
            <Mail size={18} />
            {label}
          </>
        )}
      </button>

      {/* Email sent confirmation modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
            />

            {/* Modal content */}
            <motion.div
              className="relative z-10 w-full max-w-sm rounded-2xl border border-masala-200 dark:border-masala-700 bg-white dark:bg-masala-800 shadow-2xl overflow-hidden"
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 30 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              {/* Close button */}
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-3 right-3 p-1.5 rounded-full text-masala-400 dark:text-masala-500 hover:text-masala-600 dark:hover:text-masala-300 hover:bg-masala-100 dark:hover:bg-masala-700 transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>

              <div className="px-6 pt-8 pb-6 text-center">
                {/* Mail icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.15, type: 'spring', stiffness: 250, damping: 18 }}
                  className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-saffron-500 to-chili-600 shadow-lg shadow-chili-600/20"
                >
                  <Mail size={28} className="text-white" />
                </motion.div>

                {/* Message */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <p className="text-sm text-masala-700 dark:text-masala-300 leading-relaxed">
                    we have send the link on your email{' '}
                    <strong className="text-masala-900 dark:text-white font-bold">{maskedEmail}</strong>{' '}
                    check your mail inbox or check the spam and trash
                  </p>
                  <p className="mt-3 text-sm text-masala-700 dark:text-masala-300 leading-relaxed">
                    tap on link to sign in
                  </p>
                </motion.div>

                {/* Okay button */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  onClick={() => setShowModal(false)}
                  className="mt-6 w-full rounded-xl bg-gradient-to-r from-chili-600 to-chili-700 py-3 text-sm font-bold text-white shadow-lg shadow-chili-600/25 hover:shadow-xl hover:shadow-chili-600/35 transition-all"
                >
                  Okay
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
