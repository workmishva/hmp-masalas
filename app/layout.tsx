import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans, Inter, Playfair_Display } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { auth } from '@/lib/auth'
import { getSettings } from '@/lib/settings'
import { Providers } from '@/components/Providers'
import { PWAInstallPrompt } from '@/components/ui/PWAInstallPrompt'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  subsets:  ['latin'],
  variable: '--font-jakarta',
  display:  'swap',
})

const inter = Inter({
  subsets:  ['latin'],
  variable: '--font-inter',
  display:  'swap',
})

const playfair = Playfair_Display({
  subsets:  ['latin'],
  variable: '--font-playfair',
  display:  'swap',
})

export const viewport: Viewport = {
  themeColor:    '#7A0908',
  width:         'device-width',
  initialScale:  1,
  maximumScale:  1,
}

export const metadata: Metadata = {
  title:       'HMP Masala — Pure Spices. Family Recipe.',
  description: 'Handcrafted masalas made with love. Shop authentic family-recipe spice blends from HMP Masala.',
  keywords:    ['masala', 'spices', 'HMP Masala', 'garam masala', 'Indian spices'],
  manifest:    '/manifest.json',
  appleWebApp: {
    capable:         true,
    statusBarStyle:  'black-translucent',
    title:           'HMP Masala',
  },
  icons: {
    icon:  [
      { url: '/icon-192.svg',    sizes: '192x192', type: 'image/svg+xml' },
      { url: '/icon-192.png?v=2', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png?v=2', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png?v=2', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title:    'HMP Masala',
    description: 'Pure Spices. Family Recipe.',
    siteName: 'HMP Masala',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [session, settings] = await Promise.all([auth(), getSettings()])
  // Admins always retain dark-mode access regardless of the global toggle
  const darkModeEnabled = session?.user?.role === 'admin' ? true : settings.darkModeEnabled

  return (
    <html lang="en" className={`${jakarta.variable} ${inter.variable} ${playfair.variable}`} suppressHydrationWarning data-scroll-behavior="smooth">
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:px-4 focus:py-2 focus:bg-chili-600 focus:text-white focus:rounded-xl focus:font-medium focus:text-sm"
        >
          Skip to content
        </a>
        <Providers darkModeEnabled={darkModeEnabled}>
          {children}
          <PWAInstallPrompt />
        </Providers>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: {
              background:  '#fff',
              color:       '#292524',
              border:      '1px solid #E7E5E4',
              borderRadius:'12px',
              fontSize:    '14px',
            },
            success: {
              iconTheme: { primary: '#16A34A', secondary: '#fff' },
              style: { borderLeft: '4px solid #16A34A' },
            },
            error: {
              duration:  5000,
              iconTheme: { primary: '#DC2626', secondary: '#fff' },
              style: { borderLeft: '4px solid #DC2626' },
            },
          }}
        />
      </body>

    </html>
  )
}
