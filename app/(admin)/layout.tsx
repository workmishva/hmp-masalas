import Link from 'next/link'
import { Leaf } from 'lucide-react'
import { AdminNav } from '@/components/layout/AdminNav'
import { AdminMobileNav } from '@/components/layout/AdminMobileNav'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-masala-50">
      {/* Sidebar — desktop only */}
      <aside className="w-64 shrink-0 bg-masala-900 dark:bg-masala-200 hidden md:flex flex-col">
        <div className="h-16 px-6 flex items-center justify-between border-b border-masala-800 dark:border-masala-300">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-saffron-500" />
            <span className="font-brand font-bold text-white dark:text-masala-900 text-lg">HMP Masala</span>
          </div>
          <ThemeToggle className="text-masala-400 dark:text-masala-600" />
        </div>
        <AdminNav />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-auto">
        {/* Mobile header */}
        <header className="h-14 bg-masala-900 dark:bg-masala-200 border-b border-masala-800 dark:border-masala-300 px-4 flex items-center justify-between md:hidden">
          <span className="font-brand font-bold text-saffron-500 text-lg">HMP Admin</span>
          <div className="flex items-center gap-2">
            <ThemeToggle className="text-masala-400 dark:text-masala-700" />
            <Link href="/" className="text-xs text-masala-400 dark:text-masala-600 hover:text-masala-200 transition-colors">
              ← Store
            </Link>
          </div>
        </header>

        {/* Mobile navigation strip */}
        <AdminMobileNav />

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
