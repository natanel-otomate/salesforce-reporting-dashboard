'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import type { Database } from '@/types/database';

type Report = Database['public']['Tables']['reports']['Row'];

interface ReportCardProps {
  report: Report;
  onDeleted?: (id: string) => void;
  onStatusChanged?: (id: string, paused: boolean) => void;
}

type ActionState = 'idle' | 'pausing' | 'deleting';

function StatusBadge({ status }: { status: string }) {
  const normalized = status?.toLowerCase() ?? 'unknown';

  const variantClasses: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-800 ring-emerald-600/20',
    paused: 'bg-amber-100 text-amber-800 ring-amber-600/20',
    error: 'bg-red-100 text-red-800 ring-red-600/20',
    pending: 'bg-blue-100 text-blue-800 ring-blue-600/20',
    unknown: 'bg-gray-100 text-gray-800 ring-gray-600/20',
  };

  const classes = variantClasses[normalized] ?? variantClasses['unknown'];
  const label = normalized.charAt(0).toUpperCase() + normalized.slice(1);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${classes}`}
    >
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
          normalized === 'active'
            ? 'bg-emerald-500'
            : normalized === 'paused'
            ? 'bg-amber-500'
            : normalized === 'error'
            ? 'bg-red-500'
            : normalized === 'pending'
            ? 'bg-blue-500'
            : 'bg-gray-500'
        }`}
      />
      {label}
    </span>
  );
}

function formatNextSend(nextSendAt: string | null): string {
  if (!nextSendAt) return 'Not scheduled';

  const date = new Date(nextSendAt);
  if (isNaN(date.getTime())) return 'Invalid date';

  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60_000);
  const diffHours = Math.round(diffMs / 3_600_000);
  const diffDays = Math.round(diffMs / 86_400_000);

  if (diffMs < 0) {
    const absMins = Math.abs(diffMins);
    if (absMins < 60) return `${absMins}m ago`;
    const absHours = Math.abs(diffHours);
    if (absHours < 24) return `${absHours}h ago`;
    return `${Math.abs(diffDays)}d ago`;
  }

  if (diffMins < 1) return 'In less than a minute';
  if (diffMins < 60) return `In ${diffMins}m`;
  if (diffHours < 24) return `In ${diffHours}h`;
  if (diffDays === 1) return 'Tomorrow';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    hour: '2-digit',
    minute: '2-digit',
  });
}

function FrequencyPill({ frequency }: { frequency: string | null }) {
  if (!frequency) return null;

  const icons: Record<string, string> = {
    daily: '📅',
    weekly: '📆',
    monthly: '🗓️',
    hourly: '⏰',
  };

  const icon = icons[frequency?.toLowerCase()] ?? '🔄';

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
      <span aria-hidden="true">{icon}</span>
      {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
    </span>
  );
}

export default function ReportCard({
  report,
  onDeleted,
  onStatusChanged,
}: ReportCardProps) {
  const router = useRouter();
  const [actionState, setActionState] = useState<ActionState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const supabase = createClient();

  const isPaused = report.status === 'paused';
  const isActive = report.status === 'active';
  const canTogglePause = isActive || isPaused;

  async function handleTogglePause() {
    if (actionState !== 'idle') return;
    setActionState('pausing');
    setError(null);

    const newStatus = isPaused ? 'active' : 'paused';

    const { error: updateError } = await supabase
      .from('reports')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', report.id);

    if (updateError) {
      setError(updateError.message);
      setActionState('idle');
      return;
    }

    onStatusChanged?.(report.id, newStatus === 'paused');
    setActionState('idle');
    router.refresh();
  }

  async function handleDelete() {
    if (actionState !== 'idle') return;
    setActionState('deleting');
    setError(null);

    const { error: deleteError } = await supabase
      .from('reports')
      .delete()
      .eq('id', report.id);

    if (deleteError) {
      setError(deleteError.message);
      setActionState('idle');
      setShowDeleteConfirm(false);
      return;
    }

    onDeleted?.(report.id);
    router.refresh();
  }

  function handleCardClick(e: React.MouseEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    router.push(`/dashboard/reports/${report.id}`);
  }

  const isLoading = actionState !== 'idle';

  return (
    <div
      role="article"
      aria-label={`Report: ${report.name}`}
      onClick={handleCardClick}
      className="group relative flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-indigo-300 hover:shadow-md cursor-pointer focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2"
    >
      {/* Top row: name + status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="truncate text-base font-semibold leading-tight text-gray-900 group-hover:text-indigo-700 transition-colors duration-150">
            {report.name}
          </h3>
          {report.description && (
            <p className="line-clamp-2 text-xs text-gray-500 leading-relaxed">
              {report.description}
            </p>
          )}
        </div>
        <div className="shrink-0 pt-0.5">
          <StatusBadge status={report.status ?? 'unknown'} />
        </div>
      </div>

      {/* Meta row: frequency + next send */}
      <div className="flex flex-wrap items-center gap-3">
        {report.frequency && (
          <FrequencyPill frequency={report.frequency} />
        )}

        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <svg
            className="h-3.5 w-3.5 shrink-0 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>
            <span className="font-medium text-gray-700">Next send:</span>{' '}
            {formatNextSend(report.next_send_at ?? null)}
          </span>
        </div>

        {report.recipient_emails && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <svg
              className="h-3.5 w-3.5 shrink-0 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <span>
              {Array.isArray(report.recipient_emails)
                ? `${report.recipient_emails.length} recipient${
                    report.recipient_emails.length !== 1 ? 's' : ''
                  }`
                : '1 recipient'}
            </span>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-inset ring-red-200"
        >
          <svg
            className="h-4 w-4 shrink-0 text-red-500"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {/* Delete confirmation inline */}
      {showDeleteConfirm && (
        <div
          role="alertdialog"
          aria-modal="false"
          aria-label="Confirm deletion"
          className="flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 p-3"
        >
          <p className="text-xs font-medium text-red-800">
            Delete &ldquo;{report.name}&rdquo;? This cannot be undone.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionState === 'deleting' ? (
                <>
                  <svg
                    className="h-3 w-3 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
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
                  Deleting…
                </>
              ) : (
                'Yes, delete'
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isLoading}
              className="inline-flex items-center rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 transition-colors duration-150 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!showDeleteConfirm && (
        <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-100">
          {canTogglePause && (
            <button
              type="button"
              onClick={handleTogglePause}
              disabled={isLoading}
              aria-label={isPaused ? 'Resume report' : 'Pause report'}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold shadow-sm ring-1 ring-inset transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                isPaused
                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 hover:bg-emerald-100 focus-visible:outline-emerald-600'
                  : 'bg-amber-50 text-amber-700 ring-amber-600/20 hover:bg-amber-100 focus-visible:outline-amber-600'
              }`}
            >
              {actionState === 'pausing' ? (
                <>
                  <svg
                    className="h-3 w-3 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
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
                  {isPaused ? 'Resuming…' : 'Pausing…'}
                </>
              ) : isPaused ? (
                <>
                  <svg
                    className="h-3 w-3"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  Resume
                </>
              ) : (
                <>
                  <svg
                    className="h-3 w-3"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                  Pause
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isLoading}
            aria-label={`Delete report ${report.name}`}
            className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-200 transition-colors duration-150 hover:bg-red-50 hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className="h-3 w-3"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
            </svg>
            Delete
          </button>

          <button
            type="button"
            onClick={() => router.push(`/dashboard/reports/${report.id}`)}
            aria-label={`View details for ${report.name}`}
            className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
          >
            View
            <svg
              className="h-3 w-3"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}