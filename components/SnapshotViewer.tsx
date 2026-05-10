'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type ReportSnapshot = Database['public']['Tables']['report_snapshots']['Row'];
type Report = Database['public']['Tables']['reports']['Row'];

interface BoardData {
  id: string;
  name: string;
  items: ItemData[];
  groups?: GroupData[];
}

interface GroupData {
  id: string;
  title: string;
  color?: string;
}

interface ItemData {
  id: string;
  name: string;
  group?: string;
  groupTitle?: string;
  columnValues?: ColumnValue[];
  status?: string;
  owner?: string;
  dueDate?: string;
}

interface ColumnValue {
  id: string;
  title: string;
  text: string;
  type?: string;
}

interface SnapshotData {
  report_id: string;
  report_title: string;
  generated_at: string;
  recipient_email?: string;
  boards: BoardData[];
  summary?: {
    total_items: number;
    total_boards: number;
    completed_items?: number;
    overdue_items?: number;
  };
}

interface SnapshotViewerProps {
  snapshotId: string;
  reportId?: string;
}

type StatusColor =
  | 'green'
  | 'red'
  | 'yellow'
  | 'blue'
  | 'purple'
  | 'orange'
  | 'gray'
  | 'default';

const STATUS_COLOR_MAP: Record<StatusColor, string> = {
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  blue: 'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
  orange: 'bg-orange-100 text-orange-800',
  gray: 'bg-gray-100 text-gray-700',
  default: 'bg-gray-100 text-gray-700',
};

function resolveStatusColor(text: string): string {
  const lower = text.toLowerCase();
  if (['done', 'complete', 'completed', 'finished'].includes(lower)) {
    return STATUS_COLOR_MAP.green;
  }
  if (['stuck', 'blocked', 'failed', 'overdue'].includes(lower)) {
    return STATUS_COLOR_MAP.red;
  }
  if (['in progress', 'working on it', 'in review'].includes(lower)) {
    return STATUS_COLOR_MAP.yellow;
  }
  if (['not started', 'backlog', 'todo', 'to do'].includes(lower)) {
    return STATUS_COLOR_MAP.gray;
  }
  if (['waiting', 'pending', 'on hold'].includes(lower)) {
    return STATUS_COLOR_MAP.blue;
  }
  return STATUS_COLOR_MAP.default;
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function formatShortDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function isOverdue(dateStr: string): boolean {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;
    return date < new Date();
  } catch {
    return false;
  }
}

function SummaryCard({
  label,
  value,
  colorClass,
}: {
  label: string;
  value: number | string;
  colorClass: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-1 shadow-sm">
      <span className={`text-2xl font-bold ${colorClass}`}>{value}</span>
      <span className="text-sm text-gray-500 font-medium">{label}</span>
    </div>
  );
}

function ColumnBadge({ column }: { column: ColumnValue }) {
  if (!column.text || column.text.trim() === '') return null;

  const isStatus =
    column.type === 'status' ||
    column.title.toLowerCase().includes('status') ||
    column.title.toLowerCase().includes('stage');

  const isDate =
    column.type === 'date' ||
    column.title.toLowerCase().includes('date') ||
    column.title.toLowerCase().includes('deadline') ||
    column.title.toLowerCase().includes('due');

  const isPeople =
    column.type === 'people' ||
    column.type === 'person' ||
    column.title.toLowerCase().includes('owner') ||
    column.title.toLowerCase().includes('assigned') ||
    column.title.toLowerCase().includes('person');

  if (isStatus) {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${resolveStatusColor(column.text)}`}
      >
        {column.text}
      </span>
    );
  }

  if (isDate) {
    const overdue = isOverdue(column.text);
    return (
      <span
        className={`inline-flex items-center gap-1 text-xs font-medium ${overdue ? 'text-red-600' : 'text-gray-600'}`}
      >
        <svg
          className="w-3 h-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        {formatShortDate(column.text)}
        {overdue && (
          <span className="text-red-500 font-bold ml-1">· Overdue</span>
        )}
      </span>
    );
  }

  if (isPeople) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-600 font-medium">
        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
          {column.text.charAt(0).toUpperCase()}
        </span>
        {column.text}
      </span>
    );
  }

  return (
    <span className="text-xs text-gray-600">
      <span className="font-medium text-gray-400">{column.title}:</span>{' '}
      {column.text}
    </span>
  );
}

function ItemRow({ item }: { item: ItemData }) {
  const statusColumn = item.columnValues?.find(
    (c) =>
      c.type === 'status' ||
      c.title.toLowerCase().includes('status') ||
      c.title.toLowerCase().includes('stage'),
  );

  const dueDateColumn = item.columnValues?.find(
    (c) =>
      c.type === 'date' ||
      c.title.toLowerCase().includes('date') ||
      c.title.toLowerCase().includes('deadline') ||
      c.title.toLowerCase().includes('due'),
  );

  const ownerColumn = item.columnValues?.find(
    (c) =>
      c.type === 'people' ||
      c.type === 'person' ||
      c.title.toLowerCase().includes('owner') ||
      c.title.toLowerCase().includes('assigned'),
  );

  const otherColumns =
    item.columnValues?.filter(
      (c) =>
        c !== statusColumn &&
        c !== dueDateColumn &&
        c !== ownerColumn &&
        c.text &&
        c.text.trim() !== '',
    ) ?? [];

  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 py-3 border-b border-gray-100 last:border-b-0 group hover:bg-gray-50 px-2 rounded-lg transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate group-hover:text-indigo-700 transition-colors">
          {item.name}
        </p>
        {otherColumns.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {otherColumns.map((col) => (
              <ColumnBadge key={col.id} column={col} />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 shrink-0">
        {ownerColumn && ownerColumn.text && (
          <ColumnBadge column={ownerColumn} />
        )}
        {dueDateColumn && dueDateColumn.text && (
          <ColumnBadge column={dueDateColumn} />
        )}
        {statusColumn && statusColumn.text && (
          <ColumnBadge column={statusColumn} />
        )}
      </div>
    </div>
  );
}

function BoardSection({ board }: { board: BoardData }) {
  const [collapsed, setCollapsed] = useState(false);

  const groupedItems: Record<string, ItemData[]> = {};
  const ungrouped: ItemData[] = [];

  for (const item of board.items) {
    if (item.groupTitle) {
      if (!groupedItems[item.groupTitle]) {
        groupedItems[item.groupTitle] = [];
      }
      groupedItems[item.groupTitle].push(item);
    } else {
      ungrouped.push(item);
    }
  }

  const hasGroups = Object.keys(groupedItems).length > 0;

  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-50 to-white border-b border-gray-200 hover:from-indigo-100 transition-colors"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="text-base font-semibold text-gray-900">
              {board.name}
            </h3>
            <p className="text-xs text-gray-500">
              {board.items.length} item{board.items.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {!collapsed && (
        <div className="px-4 py-3">
          {board.items.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              No items in this board.
            </p>
          ) : hasGroups ? (
            <div className="space-y-4">
              {Object.entries(groupedItems).map(([groupTitle, items]) => (
                <div key={groupTitle}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-px flex-1 bg-gray-100" />
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2">
                      {groupTitle}
                    </span>
                    <div className="h-px flex-1 bg-gray-100" />
                  </div>
                  <div>
                    {items.map((item) => (
                      <ItemRow key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              ))}
              {ungrouped.map((item) => (
                <ItemRow key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div>
              {board.items.map((item) => (
                <ItemRow key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function SnapshotSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-pulse">
      <div className="h-10 bg-gray-200 rounded-xl w-2/3" />
      <div className="h-5 bg-gray-100 rounded w-1/3" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-xl" />
        ))}
      </div>
      {[...Array(2)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="h-16 bg-indigo-50" />
          <div className="p-4 space-y-3">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="h-10 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SnapshotViewer({
  snapshotId,
  reportId,
}: SnapshotViewerProps) {
  const supabase = createClient();

  const [snapshot, setSnapshot] = useState<ReportSnapshot | null>(null);
  const [snapshotData, setSnapshotData] = useState<SnapshotData | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSnapshot() {
      setLoading(true);
      setError(null);

      try {
        const { data: snapshotRow, error: snapshotError } = await supabase
          .from('report_snapshots')
          .select('*')
          .eq('id', snapshotId)
          .single();

        if (snapshotError || !snapshotRow) {
          setError('Snapshot not found or could not be loaded.');
          return;
        }

        setSnapshot(snapshotRow);

        const rawData = snapshotRow.snapshot_data as unknown;
        if (rawData && typeof rawData === 'object') {
          setSnapshotData(rawData as SnapshotData);
        } else {
          setError('Snapshot data is invalid or corrupt.');
          return;
        }

        const targetReportId = reportId ?? snapshotRow.report_id;
        if (targetReportId) {
          const { data: reportRow } = await supabase
            .from('reports')
            .select('*')
            .eq('id', targetReportId)
            .single();
          if (reportRow) setReport(reportRow);
        }
      } catch (err) {
        console.error('SnapshotViewer load error:', err);
        setError('An unexpected error occurred while loading the snapshot.');
      } finally {
        setLoading(false);
      }
    }

    loadSnapshot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshotId]);

  if (loading) return <SnapshotSkeleton />;

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
          <svg
            className="w-7 h-7 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-800">
          Could Not Load Snapshot
        </h2>
        <p className="text-sm text-gray-500 text-center max-w-sm">{error}</p>
      </div>
    );
  }

  if (!snapshotData) return null;

  const summary = snapshotData.summary;
  const generatedAt = snapshot?.created_at ?? snapshotData.generated_at;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
              Report Snapshot
            </span>
            {report?.schedule_frequency && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 capitalize">
                {report.schedule_frequency}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
            {snapshotData.report_title ||
              report?.title ||
              'Untitled Report'}
          </h1>
          {snapshotData.recipient_email && (
            <p className="text-sm text-gray-500 mt-1">
              Delivered to{' '}
              <span className="font-medium text-gray-700">
                {snapshotData.recipient_email}
              </span>
            </p>
          )}
        </div>

        <div className="shrink-0 text-right">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
            Generated
          </p>
          <p className="text-sm font-semibold text-gray-700 mt-0.5">
            {formatDate(generatedAt)}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <SummaryCard
            label="Total Boards"
            value={summary.total_boards}
            colorClass="text-indigo-600"
          />
          <SummaryCard
            label="Total Items"
            value={summary.total_items}
            colorClass="text-gray-800"
          />
          {typeof summary.completed_items === 'number' && (
            <SummaryCard
              label="Completed"
              value={summary.completed_items}
              colorClass="text-green-600"
            />
          )}
          {typeof summary.overdue_items === 'number' && (
            <SummaryCard
              label="Overdue"
              value={summary.overdue_items}
              colorClass={
                summary.overdue_items > 0 ? 'text-red-600' : 'text-gray-500'
              }
            />
          )}
        </div>
      )}

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Board Data
        </span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      {/* Boards */}
      {snapshotData.boards.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-7 h-7 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-700">
            No board data in this snapshot
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            This report snapshot does not contain any board data.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {snapshotData.boards.map((board) => (
            <BoardSection key={board.id} board={board} />
          ))}
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">W</span>
          </div>
          <span className="font-semibold text-gray-600">WorkPulse</span>
          <span>· Automated Report Snapshot</span>
        </div>
        <div className="flex items-center gap-4">
          {snapshot?.id && (
            <span>
              Snapshot ID:{' '}
              <span className="font-mono text-gray-500">
                {snapshot.id.slice(0, 8)}…
              </span>
            </span>
          )}
          <span>Read-only view</span>
        </div>
      </footer>
    </div>
  );
}