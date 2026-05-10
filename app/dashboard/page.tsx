'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type Report = Database['public']['Tables']['reports']['Row']

type ReportWithNextSend = Report & {
  next_send_at: string | null
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  paused: 'bg-amber-100 text-amber-800 border border-amber-200',
  draft: 'bg-slate-100 text-slate-700 border border-slate-200',
  error: 'bg-red-100 text-red-800 border border-red-200',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  paused: 'Paused',
  draft: 'Draft',
  error: 'Error',
}

function formatNextSend(dateStr: string | null): string {
  if (!dateStr) return 'Not scheduled'
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffMins = Math.round(diffMs / 60000)
  if (diffMins < 0) return 'Overdue'
  if (diffMins < 60) return `In ${diffMins}m`
  const diffHours = Math.round(diffMins / 60)
  if (diffHours < 24) return `In ${diffHours}h`
  const diffDays = Math.round(diffHours / 24)
  return `In ${diffDays}d`
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  const [reports, setReports] = useState<ReportWithNextSend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    async function initialize() {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session) {
        router.push('/login')
        return
      }

      setUserEmail(session.user.email ?? null)
      await fetchReports(session.user.id)
    }

    initialize()
  }, [])

  async function fetchReports(userId: string) {
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError('Failed to load reports. Please try again.')
      setLoading(false)
      return
    }

    setReports((data as ReportWithNextSend[]) ?? [])
    setLoading(false)
  }

  async function handleTogglePause(report: ReportWithNextSend) {
    setActionLoading(report.id)
    const newStatus = report.status === 'active' ? 'paused' : 'active'

    const { error: updateError } = await supabase
      .from('reports')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', report.id)

    if (updateError) {
      setError('Failed to update report status.')
    } else {
      setReports((prev) =>
        prev.map((r) => (r.id === report.id ? { ...r, status: newStatus } : r))
      )
    }
    setActionLoading(null)
  }

  async function handleDelete(reportId: string) {
    setActionLoading(reportId)

    const { error: deleteError } = await supabase
      .from('reports')
      .delete()
      .eq('id', reportId)

    if (deleteError) {
      setError('Failed to delete report.')
    } else {
      setReports((prev) => prev.filter((r) => r.id !== reportId))
    }

    setDeleteConfirm(null)
    setActionLoading(null)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const activeCount = reports.filter((r) => r.status === 'active').length
  const pausedCount = reports.filter((r) => r.status === 'paused').length
  const draftCount = reports.filter((r) => r.status === 'draft').length

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">
                WorkPulse
              </span>
            </div>

            <div className="flex items-center gap-4">
              {userEmail && (
                <span className="hidden sm:block text-sm text-slate-500 truncate max-w-[200px]">
                  {userEmail}
                </span>
              )}
              <button
                onClick={handleSignOut}
                className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title + CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your scheduled Monday.com workspace reports
            </p>
          </div>
          <Link
            href="/dashboard/reports/new"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Report
          </Link>
        </div>

        {/* Stats Row */}
        {!loading && reports.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Active
              </p>
              <p className="text-3xl font-bold text-emerald-600 mt-1">
                {activeCount}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Paused
              </p>
              <p className="text-3xl font-bold text-amber-500 mt-1">
                {pausedCount}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Draft
              </p>
              <p className="text-3xl font-bold text-slate-400 mt-1">
                {draftCount}
              </p>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3">
            <svg
              className="w-5 h-5 mt-0.5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
            <p className="text-sm font-medium">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="h-5 bg-slate-200 rounded w-1/3" />
                    <div className="h-4 bg-slate-100 rounded w-1/2" />
                  </div>
                  <div className="h-8 w-20 bg-slate-100 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && reports.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 py-20 px-8 text-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg
                className="w-8 h-8 text-indigo-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              No reports yet
            </h2>
            <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
              Create your first report to start automating Monday.com workspace
              summaries delivered straight to your inbox.
            </p>
            <Link
              href="/dashboard/reports/new"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create your first report
            </Link>
          </div>
        )}

        {/* Reports List */}
        {!loading && reports.length > 0 && (
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors"
              >
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Report Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Link
                          href={`/dashboard/reports/${report.id}`}
                          className="text-base font-semibold text-slate-900 hover:text-indigo-600 transition-colors truncate"
                        >
                          {report.name}
                        </Link>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            STATUS_COLORS[report.status] ??
                            STATUS_COLORS['draft']
                          }`}
                        >
                          {STATUS_LABELS[report.status] ?? report.status}
                        </span>
                      </div>

                      {report.description && (
                        <p className="text-sm text-slate-500 mt-1 line-clamp-1">
                          {report.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                        {/* Next Send */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="font-medium text-slate-700">
                            Next:
                          </span>{' '}
                          <span
                            className={
                              report.next_send_at &&
                              new Date(report.next_send_at) < new Date()
                                ? 'text-red-500 font-medium'
                                : ''
                            }
                          >
                            {formatNextSend(report.next_send_at)}
                          </span>
                          {report.next_send_at && (
                            <span className="text-slate-400">
                              ({formatDate(report.next_send_at)})
                            </span>
                          )}
                        </div>

                        {/* Frequency */}
                        {report.frequency && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                            <span className="capitalize">{report.frequency}</span>
                          </div>
                        )}

                        {/* Recipients */}
                        {report.recipient_emails &&
                          Array.isArray(report.recipient_emails) &&
                          report.recipient_emails.length > 0 && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                />
                              </svg>
                              <span>
                                {report.recipient_emails.length}{' '}
                                {report.recipient_emails.length === 1
                                  ? 'recipient'
                                  : 'recipients'}
                              </span>
                            </div>
                          )}

                        {/* Created */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <span>Created {formatDate(report.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* View/Edit */}
                      <Link
                        href={`/dashboard/reports/${report.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        View
                      </Link>

                      {/* Pause/Resume — only for active or paused */}
                      {(report.status === 'active' ||
                        report.status === 'paused') && (
                        <button
                          onClick={() => handleTogglePause(report)}
                          disabled={actionLoading === report.id}
                          className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            report.status === 'active'
                              ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
                              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                          }`}
                        >
                          {actionLoading === report.id ? (
                            <svg
                              className="w-3.5 h-3.5 animate-spin"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v8H4z"
                              />
                            </svg>
                          ) : report.status === 'active' ? (
                            <>
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M10 9v6m4-6v6"
                                />
                              </svg>
                              Pause
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                />
                              </svg>
                              Resume
                            </>
                          )}
                        </button>
                      )}

                      {/* Delete */}
                      {deleteConfirm === report.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(report.id)}
                            disabled={actionLoading === report.id}
                            className="text-xs font-medium text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg border border-red-500 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === report.id ? 'Deleting…' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(report.id)}
                          disabled={actionLoading === report.id}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}