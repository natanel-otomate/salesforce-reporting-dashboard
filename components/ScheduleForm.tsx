'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type Frequency = 'daily' | 'weekly' | 'monthly'

interface ScheduleFormProps {
  reportId: string
  onSaved?: () => void
}

interface ScheduleFormState {
  frequency: Frequency
  deliveryHour: number
  timezone: string
  recipientEmails: string[]
  emailInput: string
  loading: boolean
  saving: boolean
  error: string | null
  success: string | null
}

const FREQUENCIES: { value: Frequency; label: string; description: string }[] = [
  { value: 'daily', label: 'Daily', description: 'Delivered every day at your chosen time' },
  { value: 'weekly', label: 'Weekly', description: 'Delivered every Monday at your chosen time' },
  { value: 'monthly', label: 'Monthly', description: 'Delivered on the 1st of each month' },
]

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: i === 0
    ? '12:00 AM'
    : i < 12
    ? `${i}:00 AM`
    : i === 12
    ? '12:00 PM'
    : `${i - 12}:00 PM`,
}))

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Amsterdam',
  'Europe/Madrid',
  'Europe/Rome',
  'Europe/Stockholm',
  'Europe/Warsaw',
  'Europe/Istanbul',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Dhaka',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Perth',
  'Pacific/Auckland',
  'America/Sao_Paulo',
  'America/Buenos_Aires',
  'America/Bogota',
  'America/Lima',
  'America/Mexico_City',
  'America/Toronto',
  'America/Vancouver',
]

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export default function ScheduleForm({ reportId, onSaved }: ScheduleFormProps) {
  const supabase = createClient()

  const [state, setState] = useState<ScheduleFormState>({
    frequency: 'weekly',
    deliveryHour: 8,
    timezone: 'UTC',
    recipientEmails: [],
    emailInput: '',
    loading: true,
    saving: false,
    error: null,
    success: null,
  })

  useEffect(() => {
    async function loadSchedule() {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('report_id', reportId)
        .single()

      if (error && error.code !== 'PGRST116') {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load schedule. Please try again.',
        }))
        return
      }

      if (data) {
        setState(prev => ({
          ...prev,
          frequency: (data.frequency as Frequency) ?? 'weekly',
          deliveryHour: data.delivery_hour ?? 8,
          timezone: data.timezone ?? 'UTC',
          recipientEmails: (data.recipient_emails as string[]) ?? [],
          loading: false,
        }))
      } else {
        setState(prev => ({ ...prev, loading: false }))
      }
    }

    loadSchedule()
  }, [reportId])

  function setField<K extends keyof ScheduleFormState>(key: K, value: ScheduleFormState[K]) {
    setState(prev => ({ ...prev, [key]: value, error: null, success: null }))
  }

  function handleEmailInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addEmail()
    }
  }

  function addEmail() {
    const trimmed = state.emailInput.trim().replace(/,$/, '')
    if (!trimmed) return

    if (!isValidEmail(trimmed)) {
      setState(prev => ({ ...prev, error: `"${trimmed}" is not a valid email address.` }))
      return
    }

    if (state.recipientEmails.includes(trimmed)) {
      setState(prev => ({ ...prev, error: `"${trimmed}" is already in the list.`, emailInput: '' }))
      return
    }

    setState(prev => ({
      ...prev,
      recipientEmails: [...prev.recipientEmails, trimmed],
      emailInput: '',
      error: null,
    }))
  }

  function removeEmail(email: string) {
    setState(prev => ({
      ...prev,
      recipientEmails: prev.recipientEmails.filter(e => e !== email),
    }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (state.recipientEmails.length === 0) {
      setState(prev => ({ ...prev, error: 'At least one recipient email is required.' }))
      return
    }

    setState(prev => ({ ...prev, saving: true, error: null, success: null }))

    const payload = {
      report_id: reportId,
      frequency: state.frequency,
      delivery_hour: state.deliveryHour,
      timezone: state.timezone,
      recipient_emails: state.recipientEmails,
      updated_at: new Date().toISOString(),
    }

    const { data: existing } = await supabase
      .from('schedules')
      .select('id')
      .eq('report_id', reportId)
      .single()

    let dbError: { message: string } | null = null

    if (existing?.id) {
      const { error } = await supabase
        .from('schedules')
        .update(payload)
        .eq('id', existing.id)
      dbError = error
    } else {
      const { error } = await supabase
        .from('schedules')
        .insert({ ...payload, created_at: new Date().toISOString() })
      dbError = error
    }

    if (dbError) {
      setState(prev => ({
        ...prev,
        saving: false,
        error: dbError?.message ?? 'Failed to save schedule. Please try again.',
      }))
      return
    }

    setState(prev => ({
      ...prev,
      saving: false,
      success: 'Schedule saved successfully.',
    }))

    onSaved?.()
  }

  if (state.loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading schedule…</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Frequency */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-900">
          Delivery Frequency
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {FREQUENCIES.map(freq => (
            <button
              key={freq.value}
              type="button"
              onClick={() => setField('frequency', freq.value)}
              className={[
                'flex flex-col items-start gap-1 rounded-xl border-2 px-4 py-3 text-left transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                state.frequency === freq.value
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
              ].join(' ')}
            >
              <span
                className={[
                  'text-sm font-semibold',
                  state.frequency === freq.value ? 'text-blue-700' : 'text-gray-900',
                ].join(' ')}
              >
                {freq.label}
              </span>
              <span
                className={[
                  'text-xs leading-snug',
                  state.frequency === freq.value ? 'text-blue-600' : 'text-gray-500',
                ].join(' ')}
              >
                {freq.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Delivery Hour */}
      <div className="space-y-3">
        <label htmlFor="deliveryHour" className="block text-sm font-semibold text-gray-900">
          Delivery Time
        </label>
        <select
          id="deliveryHour"
          value={state.deliveryHour}
          onChange={e => setField('deliveryHour', Number(e.target.value))}
          className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:max-w-xs"
        >
          {HOURS.map(h => (
            <option key={h.value} value={h.value}>
              {h.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500">
          Reports are dispatched within a few minutes of the selected hour.
        </p>
      </div>

      {/* Timezone */}
      <div className="space-y-3">
        <label htmlFor="timezone" className="block text-sm font-semibold text-gray-900">
          Timezone
        </label>
        <select
          id="timezone"
          value={state.timezone}
          onChange={e => setField('timezone', e.target.value)}
          className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:max-w-sm"
        >
          {TIMEZONES.map(tz => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </div>

      {/* Recipient Emails */}
      <div className="space-y-3">
        <label htmlFor="emailInput" className="block text-sm font-semibold text-gray-900">
          Recipient Email Addresses
        </label>

        {/* Email tags */}
        {state.recipientEmails.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {state.recipientEmails.map(email => (
              <span
                key={email}
                className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800"
              >
                {email}
                <button
                  type="button"
                  onClick={() => removeEmail(email)}
                  aria-label={`Remove ${email}`}
                  className="flex items-center justify-center w-4 h-4 rounded-full text-blue-600 hover:bg-blue-200 hover:text-blue-900 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Email input row */}
        <div className="flex gap-2 sm:max-w-md">
          <input
            id="emailInput"
            type="text"
            value={state.emailInput}
            onChange={e => setField('emailInput', e.target.value)}
            onKeyDown={handleEmailInputKeyDown}
            onBlur={addEmail}
            placeholder="name@company.com"
            className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-describedby="email-hint"
          />
          <button
            type="button"
            onClick={addEmail}
            className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add
          </button>
        </div>
        <p id="email-hint" className="text-xs text-gray-500">
          Press <kbd className="rounded bg-gray-100 px-1 py-0.5 font-mono text-xs">Enter</kbd> or{' '}
          <kbd className="rounded bg-gray-100 px-1 py-0.5 font-mono text-xs">,</kbd> to add each address.
          These recipients do not need a Monday.com account.
        </p>
      </div>

      {/* Error / Success */}
      {state.error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 shrink-0 text-red-500">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          <span>{state.error}</span>
        </div>
      )}

      {state.success && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 shrink-0 text-green-500">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
          </svg>
          <span>{state.success}</span>
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={state.saving}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state.saving && (
            <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          )}
          {state.saving ? 'Saving…' : 'Save Schedule'}
        </button>

        {state.saving && (
          <p className="text-xs text-gray-500">Persisting your schedule configuration…</p>
        )}
      </div>
    </form>
  )
}