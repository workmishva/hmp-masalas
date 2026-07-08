'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Users, Trash2, X, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

interface User {
  _id: string
  name: string
  email: string
  phone: string
  address?: string
  createdAt: string
}

function DeleteModal({
  user,
  deleting,
  onConfirm,
  onCancel,
}: {
  user: User
  deleting: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-masala-100 rounded-2xl shadow-card-hover border border-masala-200 w-full max-w-md p-6">
        <button
          onClick={onCancel}
          disabled={deleting}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-masala-400 hover:text-masala-700 hover:bg-masala-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-chili-100 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-chili-600" />
        </div>

        <h2 className="font-heading text-lg font-bold text-masala-900 mb-1">Delete Customer?</h2>
        <p className="text-sm text-masala-600 mb-4">
          You are about to permanently delete{' '}
          <strong className="text-masala-900">{user.name}</strong>{' '}
          <span className="text-masala-500">({user.email})</span>.
        </p>

        <div className="bg-chili-100/60 border border-chili-200 rounded-xl p-4 mb-5 space-y-1.5">
          <p className="text-xs font-semibold text-chili-700 mb-2">WHAT WILL BE DELETED:</p>
          <p className="text-xs text-chili-700 flex items-start gap-1.5"><span className="text-chili-500 mt-px">✗</span> Profile and account data</p>
          <p className="text-xs text-chili-700 flex items-start gap-1.5"><span className="text-chili-500 mt-px">✗</span> Saved address and personal details</p>
          <p className="text-xs text-chili-700 flex items-start gap-1.5"><span className="text-chili-500 mt-px">✗</span> Cart and pending checkout</p>
          <p className="text-xs text-chili-700 flex items-start gap-1.5"><span className="text-chili-500 mt-px">✗</span> All reviews submitted by this customer</p>
          <div className="border-t border-chili-200 pt-2 mt-2">
            <p className="text-xs text-masala-600 flex items-start gap-1.5">
              <span className="text-cardamom-600 mt-px">✓</span>
              <span>Order history is <strong>kept</strong> for revenue records — orders will show as &ldquo;Deleted User&rdquo; in admin.</span>
            </p>
          </div>
        </div>

        <p className="text-xs text-masala-500 mb-5">
          <strong className="text-masala-700">This cannot be undone.</strong> The customer&apos;s login will stop working immediately.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 h-10 border border-masala-200 rounded-xl text-sm font-medium text-masala-700 hover:bg-masala-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 h-10 bg-chili-600 text-white rounded-xl text-sm font-semibold hover:bg-chili-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {deleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete Permanently
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminUsersPage() {
  const [users, setUsers]               = useState<User[]>([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [pendingDelete, setPendingDelete] = useState<User | null>(null)
  const [deleting, setDeleting]         = useState(false)

  useEffect(() => {
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then(({ data }) => { if (data) setUsers(data) })
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false))
  }, [])

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      const res  = await fetch(`/api/admin/users/${pendingDelete._id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to delete user')
        return
      }
      setUsers((prev) => prev.filter((u) => u._id !== pendingDelete._id))
      toast.success(`${pendingDelete.name} has been deleted.`)
      setPendingDelete(null)
    } catch {
      toast.error('Failed to delete user')
    } finally {
      setDeleting(false)
    }
  }

  const filtered = users.filter((u) =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.phone.includes(search)
  )

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-9 w-36 skeleton rounded-xl" />
        <div className="h-11 skeleton rounded-xl" />
        {[1,2,3,4,5].map(i => <div key={i} className="h-14 skeleton rounded-2xl" />)}
      </div>
    )
  }

  return (
    <>
      {pendingDelete && (
        <DeleteModal
          user={pendingDelete}
          deleting={deleting}
          onConfirm={handleDeleteConfirm}
          onCancel={() => !deleting && setPendingDelete(null)}
        />
      )}

      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold text-masala-900">Customers</h1>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-masala-200 bg-white dark:bg-masala-100 text-sm font-medium text-masala-700 hover:bg-masala-50 dark:hover:bg-masala-200 transition-colors"
            >
              ← Back to Store
            </Link>
            <span className="text-sm text-masala-500">{users.length} registered</span>
          </div>
        </div>

        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or phone..."
          className="w-full h-11 px-4 border border-masala-200 rounded-xl text-masala-900 text-sm placeholder:text-masala-400 focus:outline-none focus:ring-2 focus:ring-saffron-400"
        />

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-masala-400">
            <Users className="w-12 h-12 mb-3" />
            <p className="text-sm">No customers found</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-masala-100 border border-masala-200 rounded-2xl shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-masala-100 bg-masala-50 dark:bg-masala-200/60">
                    <th className="text-left px-5 py-3 font-semibold text-masala-600 text-xs uppercase tracking-wider">Name</th>
                    <th className="text-left px-5 py-3 font-semibold text-masala-600 text-xs uppercase tracking-wider">Email</th>
                    <th className="text-left px-5 py-3 font-semibold text-masala-600 text-xs uppercase tracking-wider">Phone</th>
                    <th className="text-left px-5 py-3 font-semibold text-masala-600 text-xs uppercase tracking-wider">Joined</th>
                    <th className="px-5 py-3" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-masala-100">
                  {filtered.map((user) => (
                    <tr key={user._id} className="hover:bg-masala-50 dark:hover:bg-masala-200/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-saffron-100 text-saffron-700 flex items-center justify-center text-xs font-bold shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-masala-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-masala-600">{user.email}</td>
                      <td className="px-5 py-3.5 text-masala-600">{user.phone}</td>
                      <td className="px-5 py-3.5 text-masala-500">{format(new Date(user.createdAt), 'dd MMM yyyy')}</td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => setPendingDelete(user)}
                          className="p-1.5 rounded-lg text-masala-400 hover:text-chili-600 hover:bg-chili-100 transition-colors"
                          aria-label={`Delete ${user.name}`}
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
