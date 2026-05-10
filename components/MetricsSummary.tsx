'use client';

import type { Board } from '@/types';

interface MetricsSummaryProps {
  boards: Board[];
}

interface AggregateMetrics {
  totalProjects: number;
  overallCompletionRate: number;
  totalOverdueItems: number;
}

function computeAggregateMetrics(boards: Board[]): AggregateMetrics {
  const totalProjects = boards.length;

  const totalItems = boards.reduce((sum, board) => sum + (board.total_items ?? 0), 0);
  const completedItems = boards.reduce((sum, board) => sum + (board.completed_items ?? 0), 0);
  const totalOverdueItems = boards.reduce((sum, board) => sum + (board.overdue_items ?? 0), 0);

  const overallCompletionRate =
    totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return { totalProjects, overallCompletionRate, totalOverdueItems };
}

interface MetricCardProps {
  label: string;
  value: string | number;
  subLabel?: string;
  accentClass: string;
  iconPath: string;
}

function MetricCard({ label, value, subLabel, accentClass, iconPath }: MetricCardProps) {
  return (
    <div className="flex items-center gap-4 bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5 flex-1 min-w-0">
      <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${accentClass}`}>
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
        </svg>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 truncate">{label}</p>
        <p className="text-3xl font-bold text-gray-900 leading-tight">{value}</p>
        {subLabel && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{subLabel}</p>
        )}
      </div>
    </div>
  );
}

export default function MetricsSummary({ boards }: MetricsSummaryProps) {
  const { totalProjects, overallCompletionRate, totalOverdueItems } =
    computeAggregateMetrics(boards);

  const completionColor =
    overallCompletionRate >= 75
      ? 'text-emerald-600'
      : overallCompletionRate >= 40
      ? 'text-yellow-600'
      : 'text-red-600';

  const overdueColor =
    totalOverdueItems === 0
      ? 'text-emerald-600'
      : totalOverdueItems <= 5
      ? 'text-yellow-600'
      : 'text-red-600';

  return (
    <section aria-label="Aggregate metrics" className="w-full">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Total Projects */}
        <MetricCard
          label="Total Projects"
          value={totalProjects}
          subLabel={totalProjects === 1 ? '1 board synced' : `${totalProjects} boards synced`}
          accentClass="bg-indigo-50 text-indigo-600"
          iconPath="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm0 0l9 6 9-6"
        />

        {/* Overall Completion Rate */}
        <div className="flex items-center gap-4 bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5 flex-1 min-w-0">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 truncate">
              Overall Completion
            </p>
            <div className="flex items-baseline gap-2">
              <p className={`text-3xl font-bold leading-tight ${completionColor}`}>
                {overallCompletionRate}%
              </p>
            </div>
            <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  overallCompletionRate >= 75
                    ? 'bg-emerald-500'
                    : overallCompletionRate >= 40
                    ? 'bg-yellow-400'
                    : 'bg-red-400'
                }`}
                style={{ width: `${overallCompletionRate}%` }}
                role="progressbar"
                aria-valuenow={overallCompletionRate}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Overall completion rate: ${overallCompletionRate}%`}
              />
            </div>
          </div>
        </div>

        {/* Total Overdue Items */}
        <div className="flex items-center gap-4 bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5 flex-1 min-w-0">
          <div
            className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
              totalOverdueItems === 0
                ? 'bg-emerald-50 text-emerald-600'
                : totalOverdueItems <= 5
                ? 'bg-yellow-50 text-yellow-600'
                : 'bg-red-50 text-red-600'
            }`}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 truncate">
              Overdue Items
            </p>
            <p className={`text-3xl font-bold leading-tight ${overdueColor}`}>
              {totalOverdueItems}
            </p>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {totalOverdueItems === 0
                ? 'All items on track'
                : totalOverdueItems === 1
                ? '1 item needs attention'
                : `${totalOverdueItems} items need attention`}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}