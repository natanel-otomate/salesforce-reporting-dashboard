'use client';

import { useEffect, useState, useCallback } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import { Board, Workspace, SyncLog } from '@/types';
import BoardCard from '@/components/BoardCard';
import MetricsSummary from '@/components/MetricsSummary';
import WorkspaceFilter from '@/components/WorkspaceFilter';

export default function DashboardPage() {
  const supabase = createBrowserClient();

  const [boards, setBoards] = useState<Board[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceIds, setSelectedWorkspaceIds] = useState<string[]>([]);
  const [lastSync, setLastSync] = useState<SyncLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchData = useCallback(async (uid: string) => {
    const [boardsRes, workspacesRes, syncRes] = await Promise.all([
      supabase
        .from('boards')
        .select('*')
        .eq('user_id', uid)
        .order('name', { ascending: true }),
      supabase
        .from('workspaces')
        .select('*')
        .eq('user_id', uid)
        .order('name', { ascending: true }),
      supabase
        .from('sync_logs')
        .select('*')
        .eq('user_id', uid)
        .order('synced_at', { ascending: false })
        .limit(1),
    ]);

    if (boardsRes.data) setBoards(boardsRes.data as Board[]);
    if (workspacesRes.data) {
      const ws = workspacesRes.data as Workspace[];
      setWorkspaces(ws);
      if (selectedWorkspaceIds.length === 0) {
        setSelectedWorkspaceIds(ws.map((w) => w.id));
      }
    }
    if (syncRes.data && syncRes.data.length > 0) {
      setLastSync(syncRes.data[0] as SyncLog);
    }
  }, [supabase, selectedWorkspaceIds.length]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = '/';
        return;
      }

      setUserId(user.id);
      await fetchData(user.id);
      setLoading(false);
    };

    init();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      if (!res.ok) {
        const body = await res.json();
        setSyncError(body?.error ?? 'Sync failed. Please try again.');
      } else {
        if (userId) await fetchData(userId);
      }
    } catch {
      setSyncError('Network error during sync.');
    } finally {
      setSyncing(false);
    }
  };

  const filteredBoards = boards.filter((b) =>
    selectedWorkspaceIds.includes(b.workspace_id)
  );

  const formatSyncTime = (log: SyncLog | null): string => {
    if (!log) return 'Never';
    const date = new Date(log.synced_at);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">BP</span>
            </div>
            <span className="text-xl font-semibold text-white tracking-tight">
              BoardPulse
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="/dashboard/settings"
              className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-md hover:bg-gray-800"
            >
              Settings
            </a>
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-md hover:bg-gray-800"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page title + sync controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Executive Dashboard</h1>
            <p className="text-sm text-gray-400 mt-1">
              Aggregated view across all your Monday.com boards
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Sync status */}
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  lastSync ? 'bg-emerald-500' : 'bg-gray-600'
                }`}
              />
              <span>Last sync: {formatSyncTime(lastSync)}</span>
              {lastSync?.status === 'error' && (
                <span className="text-red-400 text-xs">(error)</span>
              )}
            </div>

            <button
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {syncing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Syncing…
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Sync Now
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sync error alert */}
        {syncError && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm px-4 py-3 rounded-lg flex items-center justify-between">
            <span>{syncError}</span>
            <button
              onClick={() => setSyncError(null)}
              className="text-red-400 hover:text-red-200 ml-4 text-lg leading-none"
            >
              ×
            </button>
          </div>
        )}

        {/* Metrics summary strip */}
        <MetricsSummary boards={filteredBoards} />

        {/* Workspace filter */}
        {workspaces.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">
              Filter by Workspace
            </h2>
            <WorkspaceFilter
              workspaces={workspaces}
              selectedIds={selectedWorkspaceIds}
              onChange={setSelectedWorkspaceIds}
            />
          </div>
        )}

        {/* Board grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              Boards{' '}
              <span className="text-gray-500 font-normal text-base">
                ({filteredBoards.length})
              </span>
            </h2>
          </div>

          {filteredBoards.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
              {boards.length === 0 ? (
                <>
                  <div className="w-14 h-14 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-7 h-7 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-300 font-medium mb-2">No boards yet</p>
                  <p className="text-gray-500 text-sm max-w-sm mx-auto">
                    Click <span className="text-indigo-400 font-medium">Sync Now</span> to
                    pull your Monday.com boards into BoardPulse.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-gray-300 font-medium mb-2">No boards match your filter</p>
                  <p className="text-gray-500 text-sm">
                    Try selecting additional workspaces above.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBoards.map((board) => (
                <BoardCard key={board.id} board={board} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="pt-4 border-t border-gray-800 text-center text-xs text-gray-600">
          BoardPulse — Every project. One view. Automatically.
        </footer>
      </main>
    </div>
  );
}