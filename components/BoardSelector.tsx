'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database';

interface Workspace {
  id: string;
  name: string;
}

interface Board {
  id: string;
  name: string;
  workspaceId: string;
  workspaceName: string;
  columns: Column[];
}

interface Column {
  id: string;
  title: string;
  type: string;
}

interface SelectedBoard {
  boardId: string;
  boardName: string;
  workspaceId: string;
  workspaceName: string;
  selectedColumns: string[];
}

interface BoardSelectorProps {
  mondayToken: string;
  value: SelectedBoard[];
  onChange: (boards: SelectedBoard[]) => void;
  maxBoards?: number;
}

interface MondayBoard {
  id: string;
  name: string;
  workspace: {
    id: string;
    name: string;
  } | null;
  columns: {
    id: string;
    title: string;
    type: string;
  }[];
}

interface MondayWorkspace {
  id: string;
  name: string;
}

const MAX_BOARDS = 10;

async function fetchMondayBoards(token: string): Promise<Board[]> {
  const query = `
    query {
      boards(limit: 100, order_by: created_at) {
        id
        name
        workspace {
          id
          name
        }
        columns {
          id
          title
          type
        }
      }
    }
  `;

  const response = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`Monday.com API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (data.errors) {
    throw new Error(data.errors[0]?.message || 'Monday.com GraphQL error');
  }

  const boards: MondayBoard[] = data.data?.boards || [];

  return boards.map((board) => ({
    id: board.id,
    name: board.name,
    workspaceId: board.workspace?.id || 'main',
    workspaceName: board.workspace?.name || 'Main Workspace',
    columns: board.columns.map((col) => ({
      id: col.id,
      title: col.title,
      type: col.type,
    })),
  }));
}

function groupBoardsByWorkspace(boards: Board[]): Map<string, { workspace: Workspace; boards: Board[] }> {
  const map = new Map<string, { workspace: Workspace; boards: Board[] }>();

  for (const board of boards) {
    const key = board.workspaceId;
    if (!map.has(key)) {
      map.set(key, {
        workspace: { id: board.workspaceId, name: board.workspaceName },
        boards: [],
      });
    }
    map.get(key)!.boards.push(board);
  }

  return map;
}

function ColumnPicker({
  board,
  selectedColumns,
  onColumnToggle,
}: {
  board: Board;
  selectedColumns: string[];
  onColumnToggle: (columnId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const columnTypeIcon = (type: string): string => {
    const icons: Record<string, string> = {
      name: '📝',
      status: '🔵',
      date: '📅',
      person: '👤',
      text: '📄',
      numbers: '🔢',
      checkbox: '☑️',
      dropdown: '📋',
      timeline: '📊',
      file: '📎',
    };
    return icons[type] || '⬜';
  };

  return (
    <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
      >
        <span className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Columns</span>
          {selectedColumns.length > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {selectedColumns.length} selected
            </span>
          )}
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="p-3 bg-white grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
          {board.columns.length === 0 ? (
            <p className="col-span-2 text-xs text-gray-400 text-center py-2">No columns available</p>
          ) : (
            board.columns.map((column) => (
              <label
                key={column.id}
                className="flex items-center gap-2 p-1.5 rounded cursor-pointer hover:bg-gray-50 group"
              >
                <input
                  type="checkbox"
                  checked={selectedColumns.includes(column.id)}
                  onChange={() => onColumnToggle(column.id)}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                />
                <span className="text-xs text-gray-600 truncate group-hover:text-gray-900">
                  {columnTypeIcon(column.type)} {column.title}
                </span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function BoardCard({
  board,
  isSelected,
  selectedColumns,
  onBoardToggle,
  onColumnToggle,
  disabled,
}: {
  board: Board;
  isSelected: boolean;
  selectedColumns: string[];
  onBoardToggle: (board: Board) => void;
  onColumnToggle: (boardId: string, columnId: string) => void;
  disabled: boolean;
}) {
  return (
    <div
      className={`rounded-lg border-2 transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : disabled
          ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
          : 'border-gray-200 bg-white hover:border-gray-300 cursor-pointer'
      }`}
    >
      <div className="p-3">
        <label className={`flex items-start gap-3 ${disabled && !isSelected ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => !disabled || isSelected ? onBoardToggle(board) : undefined}
            disabled={disabled && !isSelected}
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 disabled:cursor-not-allowed"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{board.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{board.columns.length} columns</p>
          </div>
        </label>

        {isSelected && (
          <ColumnPicker
            board={board}
            selectedColumns={selectedColumns}
            onColumnToggle={(columnId) => onColumnToggle(board.id, columnId)}
          />
        )}
      </div>
    </div>
  );
}

export default function BoardSelector({
  mondayToken,
  value,
  onChange,
  maxBoards = MAX_BOARDS,
}: BoardSelectorProps) {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeWorkspace, setActiveWorkspace] = useState<string | null>(null);
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(new Set());
  const searchInputRef = useRef<HTMLInputElement>(null);
  const hasFetched = useRef(false);

  const loadBoards = useCallback(async () => {
    if (!mondayToken || hasFetched.current) return;

    hasFetched.current = true;
    setLoading(true);
    setError(null);

    try {
      const fetchedBoards = await fetchMondayBoards(mondayToken);
      setBoards(fetchedBoards);

      const workspaceIds = [...new Set(fetchedBoards.map((b) => b.workspaceId))];
      setExpandedWorkspaces(new Set(workspaceIds));
      if (workspaceIds.length > 0) {
        setActiveWorkspace(workspaceIds[0]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load boards';
      setError(message);
      hasFetched.current = false;
    } finally {
      setLoading(false);
    }
  }, [mondayToken]);

  useEffect(() => {
    if (mondayToken) {
      loadBoards();
    }
  }, [mondayToken, loadBoards]);

  const groupedBoards = groupBoardsByWorkspace(boards);

  const filteredGroupedBoards = (() => {
    if (!searchQuery.trim()) return groupedBoards;

    const q = searchQuery.toLowerCase();
    const filtered = new Map<string, { workspace: Workspace; boards: Board[] }>();

    for (const [key, { workspace, boards: wBoards }] of groupedBoards) {
      const matchingBoards = wBoards.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.workspaceName.toLowerCase().includes(q)
      );
      if (matchingBoards.length > 0) {
        filtered.set(key, { workspace, boards: matchingBoards });
      }
    }

    return filtered;
  })();

  const selectedBoardIds = new Set(value.map((b) => b.boardId));
  const selectedCount = value.length;
  const atLimit = selectedCount >= maxBoards;

  const handleBoardToggle = useCallback(
    (board: Board) => {
      const alreadySelected = selectedBoardIds.has(board.id);

      if (alreadySelected) {
        onChange(value.filter((b) => b.boardId !== board.id));
      } else {
        if (selectedCount >= maxBoards) return;

        const newBoard: SelectedBoard = {
          boardId: board.id,
          boardName: board.name,
          workspaceId: board.workspaceId,
          workspaceName: board.workspaceName,
          selectedColumns: board.columns.map((c) => c.id),
        };
        onChange([...value, newBoard]);
      }
    },
    [value, onChange, selectedBoardIds, selectedCount, maxBoards]
  );

  const handleColumnToggle = useCallback(
    (boardId: string, columnId: string) => {
      onChange(
        value.map((b) => {
          if (b.boardId !== boardId) return b;
          const cols = b.selectedColumns.includes(columnId)
            ? b.selectedColumns.filter((c) => c !== columnId)
            : [...b.selectedColumns, columnId];
          return { ...b, selectedColumns: cols };
        })
      );
    },
    [value, onChange]
  );

  const toggleWorkspaceExpand = (workspaceId: string) => {
    setExpandedWorkspaces((prev) => {
      const next = new Set(prev);
      if (next.has(workspaceId)) {
        next.delete(workspaceId);
      } else {
        next.add(workspaceId);
      }
      return next;
    });
  };

  const handleRetry = () => {
    hasFetched.current = false;
    loadBoards();
  };

  const workspaceList = [...filteredGroupedBoards.entries()];

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Select Boards</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Choose up to {maxBoards} boards from any workspace
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
              atLimit
                ? 'bg-orange-100 text-orange-700'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {selectedCount}/{maxBoards} boards
          </span>
          {atLimit && (
            <span className="text-xs text-orange-600 font-medium">Limit reached</span>
          )}
        </div>
      </div>

      {/* Limit warning */}
      {atLimit && (
        <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
          <svg className="w-4 h-4 text-orange-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-xs text-orange-700">
            You&apos;ve reached the {maxBoards}-board limit. Deselect a board to add another.
          </p>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search boards or workspaces..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 bg-white"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading boards from Monday.com...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 px-6">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">Failed to load boards</p>
              <p className="text-xs text-gray-500 mt-1">{error}</p>
            </div>
            <button
              type="button"
              onClick={handleRetry}
              className="px-4 py-1.5 text-sm font-medium text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Try again
            </button>
          </div>
        ) : !mondayToken ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 px-6">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 text-center">
              Enter your Monday.com API token to load boards
            </p>
          </div>
        ) : workspaceList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 px-6">
            <p className="text-sm font-medium text-gray-700">
              {searchQuery ? 'No boards match your search' : 'No boards found'}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs text-blue-600 hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {workspaceList.map(([workspaceId, { workspace, boards: wBoards }]) => {
              const isExpanded = expandedWorkspaces.has(workspaceId);
              const selectedInWorkspace = wBoards.filter((b) => selectedBoardIds.has(b.id)).length;

              return (
                <div key={workspaceId}>
                  {/* Workspace header */}
                  <button
                    type="button"
                    onClick={() => toggleWorkspaceExpand(workspaceId)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-sm font-semibold text-gray-800">{workspace.name}</span>
                      <span className="text-xs text-gray-500">
                        ({wBoards.length} board{wBoards.length !== 1 ? 's' : ''})
                      </span>
                      {selectedInWorkspace > 0 && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-600 text-white">
                          {selectedInWorkspace} selected
                        </span>
                      )}
                    </div>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Board list */}
                  {isExpanded && (
                    <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {wBoards.map((board) => {
                        const isSelected = selectedBoardIds.has(board.id);
                        const selectedBoard = value.find((b) => b.boardId === board.id);
                        const selectedCols = selectedBoard?.selectedColumns || [];

                        return (
                          <BoardCard
                            key={board.id}
                            board={board}
                            isSelected={isSelected}
                            selectedColumns={selectedCols}
                            onBoardToggle={handleBoardToggle}
                            onColumnToggle={handleColumnToggle}
                            disabled={atLimit && !isSelected}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected boards summary */}
      {value.length > 0 && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Selected Boards Summary
          </h4>
          <div className="flex flex-col gap-2">
            {value.map((selectedBoard) => {
              const board = boards.find((b) => b.id === selectedBoard.boardId);
              return (
                <div
                  key={selectedBoard.boardId}
                  className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-3 py-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{selectedBoard.boardName}</p>
                    <p className="text-xs text-gray-500 truncate">{selectedBoard.workspaceName}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {selectedBoard.selectedColumns.length}/{board?.columns.length || 0} cols
                    </span>
                    <button
                      type="button"
                      onClick={() => onChange(value.filter((b) => b.boardId !== selectedBoard.boardId))}
                      className="w-5 h-5 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      aria-label={`Remove ${selectedBoard.boardName}`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}