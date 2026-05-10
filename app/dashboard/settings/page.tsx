'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import DigestScheduleForm from '@/components/DigestScheduleForm'
import type { User } from '@/types'

interface SyncSettings {
  sync_interval_minutes: number
  monday_token: string
}

interface DigestSettings {
  enabled: boolean
  frequency: 'daily' | 'weekly'
  day_of_week: number
  time_of_day: string
}

export default function SettingsPage() {
  const supabase = createBrowserClient()

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [syncSettings, setSyncSettings] = useState<SyncSettings>({
    sync_interval_minutes: 60,
    monday_token: '',
  })

  const [digestSettings, setDigestSettings] = useState<DigestSettings>({
    enabled: false,
    frequency: 'weekly',
    day_of_week: 1,
    time_of_day: '08:00',
  })

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          window.location.href = '/'
          return
        }

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (userError) throw userError

        if (userData) {
          setUser(userData as User)
          setSyncSettings({
            sync_interval_minutes: userData.sync_interval_minutes ?? 60,
            monday_token: userData.monday_token ?? '',
          })
          setDigestSettings({
            enabled: userData.digest_enabled ?? false,
            frequency: userData.digest_frequency ?? 'weekly',
            day_of_week: userData.digest_day_of_week ?? 1,
            time_of_day: userData.digest_time_of_day ?? '08:00',
          })
        }
      } catch (err) {
        console.error('Failed to load settings:', err)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  const handleSaveSyncSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    setSaveMessage(null)

    try {
      const { error } = await supabase
        .from('users')
        .update({
          sync_interval_minutes: syncSettings.sync_interval_minutes,
          monday_token: syncSettings.monday_token,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      setSaveMessage({ type: 'success', text: 'Sync settings saved successfully.' })
    } catch (err) {
      console.error('Failed to save sync settings:', err)
      setSaveMessage({ type: 'error', text: 'Failed to save settings. Please try again.' })
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMessage(null), 4000)
    }
  }

  const handleManualSync = async () => {
    setSyncing(true)
    setSyncMessage(null)

    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error ?? 'Sync failed')
      }

      setSyncMessage({ type: 'success', text: `Sync complete. ${data.boards_synced ?? 0} boards updated.` })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Manual sync failed. Please try again.'
      setSyncMessage({ type: 'error', text: message })
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncMessage(null), 5000)
    }
  }

  const handleDigestSave = async (settings: DigestSettings) => {
    if (!user) return

    const { error } = await supabase
      .from('users')
      .update({
        digest_enabled: settings.enabled,
        digest_frequency: settings.frequency,
        digest_day_of_week: settings.day_of_week,
        digest_time_of_day: settings.time_of_day,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) throw error

    setDigestSettings(settings)
  }

  const intervalOptions = [
    { label: '15 minutes', value: 15 },
    { label: '30 minutes', value: 30 },
    { label: '1 hour', value: 60 },
    { label: '2 hours', value: 120 },
    { label: '4 hours', value: 240 },
    { label: '8 hours', value: 480 },
    { label: '24 hours', value: 1440 },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading settings…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a
              href="/dashboard"
              className="text-gray-500 hover:text-gray-700 text-sm font-medium flex items-center gap-1 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Dashboard
            </a>
            <span className="text-gray-300">/</span>
            <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
          </div>
          {user && (
            <p className="text-sm text-gray-500">{user.email}</p>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-10">

        {/* Monday.com Connection Section */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 11H7.83l4.88-4.88c.39-.39.39-1.03 0-1.42-.39-.39-1.02-.39-1.41 0l-6.59 6.59c-.39.39-.39 1.02 0 1.41l6.59 6.59c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L7.83 13H19c.55 0 1-.45 1-1s-.45-1-1-1z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Monday.com Connection</h2>
                <p className="text-sm text-gray-500">Configure your Monday.com API token to enable board syncing</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveSyncSettings} className="px-6 py-6 space-y-6">
            {/* Monday Token Field */}
            <div className="space-y-2">
              <label htmlFor="monday_token" className="block text-sm font-medium text-gray-700">
                Monday.com API Token
              </label>
              <p className="text-xs text-gray-500">
                Find your API token in Monday.com under{' '}
                <span className="font-medium">Profile → Developers → API</span>. This token is stored securely and used only for fetching your board data.
              </p>
              <div className="flex gap-3">
                <input
                  id="monday_token"
                  type="password"
                  value={syncSettings.monday_token}
                  onChange={(e) => setSyncSettings((prev) => ({ ...prev, monday_token: e.target.value }))}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono placeholder:font-sans placeholder:text-gray-400"
                />
                {syncSettings.monday_token && (
                  <span className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Connected
                  </span>
                )}
              </div>
            </div>

            {/* Sync Interval */}
            <div className="space-y-2">
              <label htmlFor="sync_interval" className="block text-sm font-medium text-gray-700">
                Auto-Sync Interval
              </label>
              <p className="text-xs text-gray-500">
                How frequently BoardPulse should automatically pull the latest data from Monday.com.
              </p>
              <select
                id="sync_interval"
                value={syncSettings.sync_interval_minutes}
                onChange={(e) =>
                  setSyncSettings((prev) => ({ ...prev, sync_interval_minutes: Number(e.target.value) }))
                }
                className="w-full sm:w-64 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {intervalOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Save Message */}
            {saveMessage && (
              <div
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium ${
                  saveMessage.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {saveMessage.type === 'success' ? (
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                {saveMessage.text}
              </div>
            )}

            <div className="flex items-center justify-end pt-2 border-t border-gray-100">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving…' : 'Save Connection Settings'}
              </button>
            </div>
          </form>
        </section>

        {/* Manual Sync Section */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Manual Sync</h2>
                <p className="text-sm text-gray-500">Trigger an immediate sync outside of your scheduled interval</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 space-y-4">
            <p className="text-sm text-gray-600">
              Use this to immediately pull the latest data from Monday.com without waiting for the next scheduled sync.
              This is useful after making significant changes to your boards.
            </p>

            {syncMessage && (
              <div
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium ${
                  syncMessage.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {syncMessage.type === 'success' ? (
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                {syncMessage.text}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Last sync: {user ? 'Check dashboard for sync status' : '—'}
              </p>
              <button
                type="button"
                onClick={handleManualSync}
                disabled={syncing || !syncSettings.monday_token}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {syncing ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Syncing…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Sync Now
                  </>
                )}
              </button>
            </div>

            {!syncSettings.monday_token && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                ⚠ Please configure and save your Monday.com API token above before running a manual sync.
              </p>
            )}
          </div>
        </section>

        {/* Email Digest Section */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Email Digest</h2>
                <p className="text-sm text-gray-500">Get a scheduled summary of your project metrics delivered to your inbox</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-6">
            <DigestScheduleForm
              initialSettings={digestSettings}
              userEmail={user?.email ?? ''}
              onSave={handleDigestSave}
            />
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-white rounded-xl border border-red-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-red-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-red-800">Danger Zone</h2>
                <p className="text-sm text-red-500">Irreversible actions — proceed with caution</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 space-y-4">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-sm font-medium text-gray-900">Sign Out</p>
                <p className="text-sm text-gray-500 mt-0.5">End your current session and return to the login page.</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await supabase.auth.signOut()
                  window.location.href = '/'
                }}
                className="flex-shrink-0 px-4 py-2 text-sm font-medium text-red-700 border border-red-300 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              >
                Sign Out
              </button>
            </div>

            <div className="border-t border-red-100 pt-4 flex items-start justify-between gap-6">
              <div>
                <p className="text-sm font-medium text-gray-900">Disconnect Monday.com</p>
                <p className="text-sm text-gray-500 mt-0.5">Remove your API token. Your existing synced data will remain but no new syncs will run.</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (!user) return
                  const confirmed = window.confirm('Remove your Monday.com API token? Existing data will not be deleted.')
                  if (!confirmed) return

                  const { error } = await supabase
                    .from('users')
                    .update({ monday_token: '', updated_at: new Date().toISOString() })
                    .eq('id', user.id)

                  if (!error) {
                    setSyncSettings((prev) => ({ ...prev, monday_token: '' }))
                  }
                }}
                className="flex-shrink-0 px-4 py-2 text-sm font-medium text-red-700 border border-red-300 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}