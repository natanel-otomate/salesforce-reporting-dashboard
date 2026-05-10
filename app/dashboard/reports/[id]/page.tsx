import { createClient } from '@/lib/supabase/client'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Database } from '@/types/database'
import SnapshotViewer from '@/components/SnapshotViewer'

type Report = Database['public']['Tables']['reports']['Row']
type Delivery = Database['public']['Tables']['deliveries']['Row']

interface ReportWithDeliveries extends Report {
  deliveries: Delivery[]
}

async function getReport(id: string): Promise<ReportWithDeliveries | null> {
  const supabase = createClient()

  const { data: report, error: reportError } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .single()

  if (reportError || !report) {
    return null
  }

  const { data: deliveries, error: deliveriesError } = await supabase
    .from('deliveries')
    .select('*')
    .eq('report_id', id)
    .order('created_at', { ascending: false })

  if (deliveriesError) {
    return null
  }

  return {
    ...report,
    deliveries: deliveries ?? [],
  }
}

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    sent: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
  }
  const classes = colorMap[status] ?? 'bg-gray-100 text-gray-800'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${classes}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function ReportStatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-800',
    paused: 'bg-amber-100 text-amber-800',
    draft: 'bg-gray-100 text-gray-700',
    error: 'bg-red-100 text-red-800',
  }
  const classes = colorMap[status] ?? 'bg-gray-100 text-gray-800'
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${classes}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '—'
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(dateString))
}

function formatSchedule(schedule: string | null): string {
  if (!schedule) return 'Not scheduled'
  const map: Record<string, string> = {
    daily: 'Every day',
    weekly: 'Every week',
    monthly: 'Every month',
    '0 9 * * 1': 'Every Monday at 9:00 AM',
    '0 9 * * *': 'Every day at 9:00 AM',
    '0 9 1 * *': 'First of every month at 9:00 AM',
  }
  return map[schedule] ?? schedule
}

export default async function ReportDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const report = await getReport(params.id)

  if (!report) {
    notFound()
  }

  const successCount = report.deliveries.filter((d) => d.status === 'sent').length
  const failureCount = report.deliveries.filter((d) => d.status === 'failed').length
  const lastDelivery = report.deliveries[0] ?? null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center gap-2 text-sm text-gray-500">
            <Link href="/dashboard" className="hover:text-gray-700 transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <Link href="/dashboard/reports" className="hover:text-gray-700 transition-colors">
              Reports
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium truncate max-w-xs">{report.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Report Header Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900 truncate">{report.name}</h1>
                <ReportStatusBadge status={report.status ?? 'draft'} />
              </div>
              {report.description && (
                <p className="text-gray-500 text-sm mt-1 max-w-2xl">{report.description}</p>
              )}
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{formatSchedule(report.schedule)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Created {formatDate(report.created_at)}</span>
                </div>
                {report.next_run_at && (
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Next run: {formatDate(report.next_run_at)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <Link
                href={`/dashboard/reports/${report.id}/edit`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Report
              </Link>
              <button
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Run Now
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{report.deliveries.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Total Deliveries</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{successCount}</p>
              <p className="text-xs text-gray-500 mt-0.5">Successful</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">{failureCount}</p>
              <p className="text-xs text-gray-500 mt-0.5">Failed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {report.deliveries.length > 0
                  ? `${Math.round((successCount / report.deliveries.length) * 100)}%`
                  : '—'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Success Rate</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Delivery History Log */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">Delivery History</h2>
                <span className="text-sm text-gray-400">{report.deliveries.length} entries</span>
              </div>

              {report.deliveries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-900">No deliveries yet</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Deliveries will appear here once the report runs on its schedule.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {report.deliveries.map((delivery) => (
                    <DeliveryRow key={delivery.id} delivery={delivery} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Snapshot Viewer Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            {/* Latest Snapshot */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">Latest Snapshot</h2>
              </div>
              <div className="p-6">
                {lastDelivery ? (
                  <SnapshotViewer delivery={lastDelivery} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-900">No snapshot available</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Run the report to generate a preview snapshot.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Report Configuration */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">Configuration</h2>
              </div>
              <div className="p-6 space-y-4">
                <ConfigRow
                  label="Report ID"
                  value={<span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">{report.id}</span>}
                />
                <ConfigRow
                  label="Schedule"
                  value={formatSchedule(report.schedule)}
                />
                <ConfigRow
                  label="Status"
                  value={<ReportStatusBadge status={report.status ?? 'draft'} />}
                />
                <ConfigRow
                  label="Recipients"
                  value={
                    Array.isArray(report.recipients) && report.recipients.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {(report.recipients as string[]).map((email) => (
                          <span key={email} className="text-xs text-gray-600 truncate">{email}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">None configured</span>
                    )
                  }
                />
                {report.last_run_at && (
                  <ConfigRow
                    label="Last Run"
                    value={<span className="text-sm text-gray-600">{formatDate(report.last_run_at)}</span>}
                  />
                )}
                {report.next_run_at && (
                  <ConfigRow
                    label="Next Run"
                    value={<span className="text-sm text-gray-600">{formatDate(report.next_run_at)}</span>}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DeliveryRow({ delivery }: { delivery: Delivery }) {
  return (
    <div className="px-6 py-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            delivery.status === 'sent'
              ? 'bg-green-100'
              : delivery.status === 'failed'
              ? 'bg-red-100'
              : delivery.status === 'processing'
              ? 'bg-blue-100'
              : 'bg-yellow-100'
          }`}>
            {delivery.status === 'sent' ? (
              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : delivery.status === 'failed' ? (
              <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : delivery.status === 'processing' ? (
              <svg className="w-4 h-4 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={delivery.status} />
              {delivery.recipient_email && (
                <span className="text-sm text-gray-600 truncate">{delivery.recipient_email}</span>
              )}
            </div>
            {delivery.error_message && (
              <p className="text-xs text-red-600 mt-1 bg-red-50 rounded px-2 py-1 border border-red-100">
                {delivery.error_message}
              </p>
            )}
            {delivery.metadata && typeof delivery.metadata === 'object' && (
              <div className="flex flex-wrap gap-3 mt-1.5">
                {(delivery.metadata as Record<string, unknown>).board_count !== undefined && (
                  <span className="text-xs text-gray-500">
                    {String((delivery.metadata as Record<string, unknown>).board_count)} boards included
                  </span>
                )}
                {(delivery.metadata as Record<string, unknown>).item_count !== undefined && (
                  <span className="text-xs text-gray-500">
                    {String((delivery.metadata as Record<string, unknown>).item_count)} items
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-xs text-gray-400 whitespace-nowrap">
            {formatDate(delivery.created_at)}
          </p>
        </div>
      </div>
    </div>
  )
}

function ConfigRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-sm text-gray-500 flex-shrink-0 pt-0.5">{label}</span>
      <div className="text-right">{value}</div>
    </div>
  )
}