'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { GoogleSignInButton } from '@/components/ui/GoogleSignInButton'
import { EmailSignInButton } from '@/components/ui/EmailSignInButton'

export function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl  = searchParams.get('callbackUrl') ?? '/'

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) return

    setLoading(true)
    const result = await signIn('credentials', {
      email:    email.trim().toLowerCase(),
      password,
      redirect: false,
    })

    if (result?.error) {
      toast.error('Invalid email or password')
      setLoading(false)
      return
    }

    toast.success('Welcome back!')

    // Redirect new users to profile setup; existing users go to callbackUrl
    if (callbackUrl === '/') {
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
        // silently ignore — fall through to normal redirect
      }
    }

    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="rounded-3xl border border-masala-200/80 bg-white dark:bg-masala-100 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-10 pb-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-chili-600 to-chili-700 shadow-lg shadow-chili-600/25"
          >
            <ShieldCheck size={28} className="text-white" />
          </motion.div>
          <h1 className="font-heading text-2xl font-bold text-masala-900">Welcome Back</h1>
          <p className="mt-2 text-sm text-masala-600 leading-relaxed">
            Sign in to your HMP Masala account to continue.
          </p>
        </div>

        {/* Form */}
        <div className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-masala-800 mb-2">
                Email Address <span className="text-chili-600" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-masala-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="w-full rounded-xl border border-masala-200 bg-masala-50 pl-11 pr-4 py-3.5 text-sm text-masala-900 placeholder:text-masala-400 focus:border-chili-600 focus:ring-2 focus:ring-chili-600/20 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-masala-800 mb-2">
                Password <span className="text-chili-600" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-masala-400" />
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-masala-200 bg-masala-50 pl-11 pr-12 py-3.5 text-sm text-masala-900 placeholder:text-masala-400 focus:border-chili-600 focus:ring-2 focus:ring-chili-600/20 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-masala-400 hover:text-masala-600 transition-colors"
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim() || !password}
              className="group mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-chili-600 to-chili-700 py-3.5 text-sm font-bold text-white shadow-lg shadow-chili-600/25 hover:shadow-xl hover:shadow-chili-600/35 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Email sign-in divider + button */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-masala-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white dark:bg-masala-100 px-3 text-xs font-medium text-masala-400 uppercase tracking-wider">
                or
              </span>
            </div>
          </div>

          <EmailSignInButton email={email} label="Continue with Email" />

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-masala-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white dark:bg-masala-100 px-3 text-xs font-medium text-masala-400 uppercase tracking-wider">
                or
              </span>
            </div>
          </div>

          <GoogleSignInButton label="Continue with Google" />
        </div>

        {/* Footer */}
        <div className="border-t border-masala-200 px-8 py-5 text-center space-y-2">
          <p className="text-sm text-masala-600">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold text-saffron-600 hover:text-saffron-700 hover:underline transition-colors">
              Create Account
            </Link>
          </p>
          <p className="text-xs text-masala-500">
            By continuing, you agree to our{' '}
            <span className="font-medium text-masala-700 cursor-pointer hover:underline">Terms</span>
            {' & '}
            <span className="font-medium text-masala-700 cursor-pointer hover:underline">Privacy Policy</span>
          </p>
        </div>
      </div>
    </motion.div>
  )
}
