'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MessageCircle, Save, Settings2, AlertTriangle, Download, Trash2, X, Palette } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'

interface Settings {
  paymentEnabled: boolean
  whatsappVerificationEnabled: boolean
  whatsappNumber: string
  storeName: string
  darkModeEnabled: boolean
  lastResetAt?: string
}

function Toggle({
  label, description, checked, onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div>
        <p className="text-sm font-medium text-masala-900">{label}</p>
        <p className="text-xs text-masala-500 mt-0.5">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? 'bg-cardamom-500' : 'bg-masala-300'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </div>
  )
}

function ResetModal({ onConfirm, onCancel, resetting }: {
  onConfirm: () => void
  onCancel: () => void
  resetting: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-masala-100 rounded-2xl shadow-card-hover border border-masala-200 w-full max-w-md p-6">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-masala-400 hover:text-masala-700 hover:bg-masala-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-chili-100 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-chili-600" />
        </div>

        <h2 className="font-heading text-lg font-bold text-masala-900 mb-2">Reset Business Data</h2>

        <p className="text-sm text-masala-600 mb-4 leading-relaxed">
          This will permanently delete <strong>all verified orders</strong> from the database and reset the business period.
        </p>

        <div className="bg-chili-100/60 border border-chili-200 rounded-xl p-4 mb-5">
          <p className="text-xs font-semibold text-chili-700 mb-2">WHAT WILL HAPPEN:</p>
          <ul className="text-xs text-chili-600 space-y-1">
            <li>✓ A PDF report is generated and downloaded first</li>
            <li>✗ All verified orders are permanently deleted</li>
            <li>✓ Products, users, and settings are NOT touched</li>
            <li>✓ New reset timestamp is saved</li>
          </ul>
        </div>

        <p className="text-xs text-masala-500 mb-5">
          The PDF report will download automatically before any data is deleted.
          <strong className="text-masala-700"> This action cannot be undone.</strong>
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={resetting}
            className="flex-1 h-10 border border-masala-200 rounded-xl text-sm font-medium text-masala-700 hover:bg-masala-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={resetting}
            className="flex-1 h-10 bg-chili-600 text-white rounded-xl text-sm font-semibold hover:bg-chili-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {resetting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Resetting…
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Yes, Reset Data
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminSettingsPage() {
  const router = useRouter()
  const [settings, setSettings]     = useState<Settings | null>(null)
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [showReset, setShowReset]   = useState(false)
  const [resetting, setResetting]   = useState(false)

  useEffect(() => {
    fetch('/api/settings/flags')
      .then((r) => r.json())
      .then(({ data }) => { if (data) setSettings(data) })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    try {
      const res  = await fetch('/api/settings/flags', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(settings),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Failed to save'); return }
      toast.success('Settings saved!')
      router.refresh()
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    setResetting(true)
    try {
      const res = await fetch('/api/admin/reset', { method: 'POST' })
      if (!res.ok) {
        const d = await res.json()
        toast.error(d.error ?? 'Reset failed')
        return
      }
      // Trigger PDF download
      const blob     = await res.blob()
      const url      = URL.createObjectURL(blob)
      const a        = document.createElement('a')
      const filename = res.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] ?? 'hmp-reset-report.pdf'
      a.href     = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Business data reset successfully! PDF report downloaded.')
      setShowReset(false)
      // Refresh settings to show new lastResetAt
      const sr = await fetch('/api/settings/flags')
      const sd = await sr.json()
      if (sd.data) setSettings(sd.data)
    } catch {
      toast.error('Reset failed — please try again')
    } finally {
      setResetting(false)
    }
  }

  const handleExportExcel = () => {
    window.location.href = '/api/admin/export/excel'
    toast.success('Downloading Excel export…')
  }

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => prev ? { ...prev, [key]: value } : prev)
  }

  if (loading) {
    return (
      <div className="max-w-lg space-y-4">
        <div className="h-9 w-40 skeleton rounded-xl" />
        <div className="h-64 skeleton rounded-2xl" />
      </div>
    )
  }

  if (!settings) return null

  return (
    <div className="space-y-6">
      {showReset && (
        <ResetModal
          onConfirm={handleReset}
          onCancel={() => setShowReset(false)}
          resetting={resetting}
        />
      )}

      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-masala-900">Settings</h1>
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-masala-200 bg-white dark:bg-masala-100 text-sm font-medium text-masala-700 hover:bg-masala-50 dark:hover:bg-masala-200 transition-colors"
        >
          ← Back to Store
        </Link>
      </div>

      <div className="max-w-lg space-y-6">

        {/* WhatsApp */}
        <div className="bg-white dark:bg-masala-100 border border-masala-200 rounded-2xl p-5 shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-cardamom-100 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-cardamom-600" />
            </div>
            <h2 className="font-heading font-semibold text-masala-900">WhatsApp</h2>
          </div>

          <div className="divide-y divide-masala-100">
            <Toggle
              label="WhatsApp Verification"
              description="Require customers to verify orders via WhatsApp"
              checked={settings.whatsappVerificationEnabled}
              onChange={(v) => update('whatsappVerificationEnabled', v)}
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-masala-700 mb-1">WhatsApp Number</label>
            <input
              type="text"
              value={settings.whatsappNumber}
              onChange={(e) => update('whatsappNumber', e.target.value)}
              placeholder="e.g. 919876543210 (country code + number)"
              className="w-full h-11 px-4 border border-masala-200 rounded-xl text-masala-900 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400 bg-white dark:bg-masala-50"
            />
            <p className="text-xs text-masala-400 mt-1">Include country code without + (e.g. 91 for India)</p>
          </div>
        </div>

        {/* Store */}
        <div className="bg-white dark:bg-masala-100 border border-masala-200 rounded-2xl p-5 shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-saffron-100 rounded-lg flex items-center justify-center">
              <Settings2 className="w-4 h-4 text-saffron-600" />
            </div>
            <h2 className="font-heading font-semibold text-masala-900">Store</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-masala-700 mb-1">Store Name</label>
              <input
                type="text"
                value={settings.storeName}
                onChange={(e) => update('storeName', e.target.value)}
                className="w-full h-11 px-4 border border-masala-200 rounded-xl text-masala-900 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400 bg-white dark:bg-masala-50"
              />
            </div>

            <div className="divide-y divide-masala-100">
              <Toggle
                label="Payment Gateway"
                description="Enable online payment (currently stubbed — requires Razorpay integration)"
                checked={settings.paymentEnabled}
                onChange={(v) => update('paymentEnabled', v)}
              />
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-white dark:bg-masala-100 border border-masala-200 rounded-2xl p-5 shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-masala-100 rounded-lg flex items-center justify-center">
              <Palette className="w-4 h-4 text-masala-600" />
            </div>
            <h2 className="font-heading font-semibold text-masala-900">Appearance</h2>
          </div>

          <div className="divide-y divide-masala-100">
            <Toggle
              label="Allow Dark Mode for Customers"
              description="When ON, customers can switch between light and dark theme. When OFF, light mode is enforced and the toggle is hidden from the customer UI. Admins always retain dark mode access."
              checked={settings.darkModeEnabled}
              onChange={(v) => update('darkModeEnabled', v)}
            />
          </div>

          {!settings.darkModeEnabled && (
            <p className="mt-3 text-xs text-masala-400 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-saffron-400 shrink-0" />
              Light mode is currently enforced for all customers.
            </p>
          )}
        </div>

        <Button onClick={handleSave} loading={saving} className="gap-2">
          <Save className="w-4 h-4" />
          Save Settings
        </Button>

        {/* Data Export */}
        <div className="bg-white dark:bg-masala-100 border border-masala-200 rounded-2xl p-5 shadow-card">
          <h2 className="font-heading font-semibold text-masala-900 mb-1">Data Export</h2>
          <p className="text-sm text-masala-500 mb-4">Download all verified orders as an Excel spreadsheet.</p>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2.5 border border-masala-200 rounded-xl text-sm font-medium text-masala-700 hover:bg-masala-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Orders Excel
          </button>
        </div>

        {/* Reset Business Data */}
        <div className="bg-chili-100/40 border border-chili-200 rounded-2xl p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-8 h-8 bg-chili-100 rounded-lg flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-chili-600" />
            </div>
            <div>
              <h2 className="font-heading font-semibold text-chili-800">Reset Business Data</h2>
              <p className="text-xs text-chili-600 mt-0.5">
                Danger zone — generates a PDF report then permanently deletes all verified orders.
              </p>
            </div>
          </div>

          {settings.lastResetAt && (
            <p className="text-xs text-masala-500 mb-3">
              Last reset: {format(new Date(settings.lastResetAt), 'dd MMM yyyy, HH:mm')}
            </p>
          )}

          <button
            onClick={() => setShowReset(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-chili-600 text-white rounded-xl text-sm font-semibold hover:bg-chili-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Reset Business Data
          </button>
        </div>
      </div>
    </div>
  )
}
