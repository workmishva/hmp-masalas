import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import { authConfig } from '@/lib/auth.config'

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(6),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    // ── Email / password ────────────────────────────────────────
    Credentials({
      id: 'credentials',
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        await connectDB()
        const user = await User.findOne({ email: parsed.data.email }).select('+password')
        if (!user) return null
        if (!user.password) return null  // Google-only account — cannot sign in with password

        const valid = await bcrypt.compare(parsed.data.password, user.password)
        if (!valid) return null

        return {
          id:    user._id.toString(),
          name:  user.name,
          email: user.email,
          role:  user.role,
        }
      },
    }),

    // ── Google via Firebase ──────────────────────────────────────
    Credentials({
      id: 'google-firebase',
      credentials: {
        idToken: { label: 'Firebase ID Token', type: 'text' },
      },
      async authorize(credentials) {
        const idToken = credentials?.idToken as string | undefined
        if (!idToken) return null

        const { verifyFirebaseToken } = await import('@/lib/firebase-admin')
        const decoded = await verifyFirebaseToken(idToken)
        if (!decoded?.email) return null

        await connectDB()

        let user = await User.findOne({ email: decoded.email.toLowerCase() })

        if (!user) {
          // First Google sign-in — create account with available data
          const nameParts = (decoded.name ?? decoded.email.split('@')[0]).split(' ')
          user = await User.create({
            name:             decoded.name ?? nameParts[0],
            email:            decoded.email.toLowerCase(),
            phone:            '',
            googleId:         decoded.uid,
            firstName:        nameParts[0] ?? '',
            lastName:         nameParts.slice(1).join(' ') ?? '',
            role:             'enduser',
            profileCompleted: false,
          })
        } else if (!user.googleId) {
          // Existing email/password user — link Google UID to their account
          await User.findByIdAndUpdate(user._id, { googleId: decoded.uid })
        }

        return {
          id:    user._id.toString(),
          name:  user.name,
          email: user.email,
          role:  (user.role as string),
        }
      },
    }),

    // ── Email link via Firebase ──────────────────────────────────
    Credentials({
      id: 'firebase-email-link',
      credentials: {
        idToken: { label: 'Firebase ID Token', type: 'text' },
      },
      async authorize(credentials) {
        const idToken = credentials?.idToken as string | undefined
        if (!idToken) return null

        const { verifyFirebaseToken } = await import('@/lib/firebase-admin')
        const decoded = await verifyFirebaseToken(idToken)
        if (!decoded?.email) return null

        await connectDB()

        let user = await User.findOne({ email: decoded.email.toLowerCase() })

        if (!user) {
          // First sign-in with this email — create account
          const nameParts = (decoded.name ?? decoded.email.split('@')[0]).split(' ')
          user = await User.create({
            name:             decoded.name ?? nameParts[0],
            email:            decoded.email.toLowerCase(),
            phone:            '',
            // No googleId for email link sign in
            firstName:        nameParts[0] ?? '',
            lastName:         nameParts.slice(1).join(' ') ?? '',
            role:             'enduser',
            profileCompleted: false,
          })
        }
        // If user exists, we just sign them in.

        return {
          id:    user._id.toString(),
          name:  user.name,
          email: user.email,
          role:  (user.role as string),
        }
      },
    }),
  ],
})
