'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase';
import { toggleReportActiveState } from '@/lib/actions';
import type { ReportConfiguration } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createBrowserClient();

  const [reports, setReports] = useState<ReportConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/auth');
        return;
      }

      setUserEmail(session.user.email ?? null);
      await fetchReports(session.user.id);
    }

    init();
  }, []);

  async function fetchReports(userId: string) {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('report_configurations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError('Failed to load report configurations.');
    } else {
      setReports((data as ReportConfiguration[]) ?? []);
    }

    setLoading(false);
  }

  async function handleToggle(report: ReportConfiguration) {
    setTogglingId(report.id);
    try {
      await toggleReportActiveState(report.id, !report.is_active);
      setReports((prev) =>
        prev.map((r) =>
          r.id === report.id ? { ...r, is_active: !r.is_active } : r
        )
      );
    } catch {
      setError('Failed to update report status.');
    } finally {
      setTogglingId(null);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace('/auth');
  }

  function formatSchedule(schedule: ReportConfiguration['schedule']): string {
    if (!schedule) return '—';
    const { frequency, day_of_week, time } = schedule as {
      frequency?: string;
      day_of_week?: string;
      time?: string;
    };
    const parts: string[] = [];
    if (frequency) parts.push(frequency.charAt(0).toUpperCase() + frequency.slice(1));
    if (day_of_week) parts.push(`on ${day_of_week}`);
    if (time) parts.push(`at ${time}`);
    return parts.length > 0 ? parts.join(' ') : '—';
  }

  function formatLastSent(lastSent: string | null | undefined): string {
    if (!lastSent) return 'Never';
    const date = new Date(lastSent);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-indigo-600 tracking-tight">SyncBridge</span>
            <span className="hidden sm:inline text-gray-400 text-sm font-medium">Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            {userEmail && (
              <span className="hidden sm:block text-sm text-gray-500 truncate max-w-xs">
                {userEmail}
              </span>
            )}
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-600 hover:text-red-600 font-medium transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page title + new report button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Report Configurations</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your automated cross-board executive reports.
            </p>
          </div>
          <Link
            href="/dashboard/reports/new"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Report
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-red-500 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <svg
              className="animate-spin h-8 w-8 text-indigo-500"
              xmlns="http://www.w3.org/2000/svg"
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
            <span className="ml-3 text-gray-500 text-sm">Loading reports…</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && reports.length === 0 && !error && (
          <div className="text-center py-24 bg-white rounded-xl border border-dashed border-gray-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mx-auto h-12 w-12 text-gray-300 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 17v-2a4 4 0 014-4h0a4 4 0 014 4v2M9 17H5a2 2 0 01-2-2v-1a4 4 0 014-4h.5M15 17h4a2 2 0 002-2v-1a4 4 0 00-4-4h-.5M12 7a4 4 0 110-8 4 4 0 010 8z"
              />
            </svg>
            <h2 className="text-lg font-semibold text-gray-700 mb-1">No reports yet</h2>
            <p className="text-sm text-gray-400 mb-6">
              Create your first report to start automating executive summaries.
            </p>
            <Link
              href="/dashboard/reports/new"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Create Report
            </Link>
          </div>
        )}

        {/* Reports table */}
        {!loading && reports.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Report Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Boards
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Schedule
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Last Sent
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {reports.map((report) => {
                    const boardCount = Array.isArray(report.board_ids)
                      ? report.board_ids.length
                      : 0;
                    const isToggling = togglingId === report.id;

                    return (
                      <tr
                        key={report.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {/* Name */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/dashboard/${report.id}`}
                            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
                          >
                            {report.name}
                          </Link>
                        </td>

                        {/* Board count */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-sm text-gray-700">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 10h18M3 6h18M3 14h18M3 18h18"
                              />
                            </svg>
                            {boardCount} {boardCount === 1 ? 'board' : 'boards'}
                          </span>
                        </td>

                        {/* Schedule */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-700">
                            {formatSchedule(report.schedule)}
                          </span>
                        </td>

                        {/* Last sent */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`text-sm ${
                              report.last_sent_at ? 'text-gray-700' : 'text-gray-400 italic'
                            }`}
                          >
                            {formatLastSent(report.last_sent_at)}
                          </span>
                        </td>

                        {/* Status badge */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {report.is_active ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                              <span className="h-1.5 w-1.5 rounded-full bg-gray-400 inline-block" />
                              Paused
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-3">
                            <Link
                              href={`/dashboard/${report.id}`}
                              className="text-xs font-medium text-gray-600 hover:text-indigo-600 transition-colors"
                            >
                              View
                            </Link>
                            <button
                              onClick={() => handleToggle(report)}
                              disabled={isToggling}
                              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                report.is_active
                                  ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                                  : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                              }`}
                            >
                              {isToggling ? (
                                <>
                                  <svg
                                    className="animate-spin h-3 w-3"
                                    xmlns="http://www.w3.org/2000/svg"
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
                                  Updating…
                                </>
                              ) : report.is_active ? (
                                <>
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-3 w-3"
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
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-3 w-3"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M14.752 11.168l-6.518-3.76A1 1 0 007 8.308v7.384a1 1 0 001.234.97l6.518-1.88a1 1 0 00.748-.97v-1.644a1 1 0 00-.748-.97z"
                                    />
                                  </svg>
                                  Resume
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table footer summary */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {reports.length} {reports.length === 1 ? 'report' : 'reports'} total
              </span>
              <span className="text-xs text-gray-400">
                {reports.filter((r) => r.is_active).length} active ·{' '}
                {reports.filter((r) => !r.is_active).length} paused
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}