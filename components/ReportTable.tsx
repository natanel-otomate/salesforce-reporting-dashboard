'use client';

import { ReportSnapshot } from '@/types';

interface ReportTableProps {
  snapshot: ReportSnapshot;
  title?: string;
  showTimestamp?: boolean;
}

interface MetricRow {
  boardName: string;
  metricLabel: string;
  value: string | number;
  columnType: string;
  aggregationType: string;
}

function formatValue(value: string | number, columnType: string, aggregationType: string): string {
  if (value === null || value === undefined || value === '') return '—';

  const num = typeof value === 'number' ? value : parseFloat(String(value));

  if (isNaN(num)) return String(value);

  if (columnType === 'numbers' || columnType === 'numeric') {
    if (aggregationType === 'avg') {
      return num.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
    }
    if (aggregationType === 'sum') {
      return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    }
    return num.toLocaleString('en-US');
  }

  if (columnType === 'status') {
    return String(value);
  }

  return num.toLocaleString('en-US');
}

function aggregationLabel(aggregationType: string): string {
  const labels: Record<string, string> = {
    sum: 'Sum',
    avg: 'Average',
    count: 'Count',
    min: 'Min',
    max: 'Max',
    count_distinct: 'Distinct Count',
  };
  return labels[aggregationType] ?? aggregationType;
}

function columnTypeLabel(columnType: string): string {
  const labels: Record<string, string> = {
    numbers: 'Number',
    numeric: 'Number',
    status: 'Status',
    text: 'Text',
    date: 'Date',
    timeline: 'Timeline',
    people: 'People',
    dropdown: 'Dropdown',
    checkbox: 'Checkbox',
  };
  return labels[columnType] ?? columnType;
}

function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  } catch {
    return isoString;
  }
}

export default function ReportTable({ snapshot, title, showTimestamp = true }: ReportTableProps) {
  const metrics = snapshot.metrics as MetricRow[] | undefined;

  if (!metrics || metrics.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-sm text-gray-500">No metric data available for this snapshot.</p>
      </div>
    );
  }

  const boardNames = Array.from(new Set(metrics.map((m) => m.boardName)));
  const groupedByBoard: Record<string, MetricRow[]> = {};
  for (const metric of metrics) {
    if (!groupedByBoard[metric.boardName]) {
      groupedByBoard[metric.boardName] = [];
    }
    groupedByBoard[metric.boardName].push(metric);
  }

  return (
    <div className="w-full space-y-6">
      {title && (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          {showTimestamp && snapshot.created_at && (
            <span className="text-xs text-gray-400">
              Generated {formatTimestamp(snapshot.created_at)}
            </span>
          )}
        </div>
      )}

      {!title && showTimestamp && snapshot.created_at && (
        <div className="flex justify-end">
          <span className="text-xs text-gray-400">
            Generated {formatTimestamp(snapshot.created_at)}
          </span>
        </div>
      )}

      {boardNames.length > 1 ? (
        <div className="space-y-6">
          {boardNames.map((boardName) => (
            <div key={boardName} className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
                <h3 className="text-sm font-semibold text-gray-700">{boardName}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-white">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Metric
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Aggregation
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Value
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {groupedByBoard[boardName].map((metric, idx) => (
                      <tr
                        key={`${metric.boardName}-${metric.metricLabel}-${idx}`}
                        className="transition-colors hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">{metric.metricLabel}</td>
                        <td className="px-4 py-3 text-gray-500">
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                            {columnTypeLabel(metric.columnType)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
                            {aggregationLabel(metric.aggregationType)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          {formatValue(metric.value, metric.columnType, metric.aggregationType)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Board
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Metric
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Aggregation
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {metrics.map((metric, idx) => (
                  <tr
                    key={`${metric.boardName}-${metric.metricLabel}-${idx}`}
                    className="transition-colors hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 text-gray-600">{metric.boardName}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{metric.metricLabel}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {columnTypeLabel(metric.columnType)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
                        {aggregationLabel(metric.aggregationType)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {formatValue(metric.value, metric.columnType, metric.aggregationType)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <span className="font-medium text-gray-600">Summary:</span>
          <span>{boardNames.length} board{boardNames.length !== 1 ? 's' : ''}</span>
          <span>·</span>
          <span>{metrics.length} metric{metrics.length !== 1 ? 's' : ''}</span>
          {snapshot.report_config_id && (
            <>
              <span>·</span>
              <span>Report ID: {snapshot.report_config_id}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}