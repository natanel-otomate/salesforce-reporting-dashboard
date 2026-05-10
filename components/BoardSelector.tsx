'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import type { MondayBoard } from '@/types';

interface ColumnMapping {
  columnId: string;
  columnTitle: string;
  columnType: string;
  aggregation: 'sum' | 'average' | 'count' | 'none';
  label: string;
}

interface BoardWithMappings {
  board: MondayBoard;
  columnMappings: ColumnMapping[];
}

interface BoardSelectorProps {
  accessToken: string;
  onSelectionChange: (selections: BoardWithMappings[]) => void;
  initialSelections?: BoardWithMappings[];
}

const MAX_BOARDS = 10;

const AGGREGATION_OPTIONS: { value: ColumnMapping['aggregation']; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'sum', label: 'Sum' },
  { value: 'average', label: 'Average' },
  { value: 'count', label: 'Count' },
];

export default function BoardSelector({
  accessToken,
  onSelectionChange,
  initialSelections = [],
}: BoardSelectorProps) {
  const [boards, setBoards] = useState<MondayBoard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBoards, setSelectedBoards] = useState<BoardWithMappings[]>(initialSelections);
  const [expandedBoardId, setExpandedBoardId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const supabase = createBrowserClient();

  const fetchBoards = useCallback(async () => {
    if (!accessToken) {
      setError('No access token provided. Please reconnect your Monday.com account.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const query = `
        query {
          boards(limit: 100, order_by: created_at) {
            id
            name
            description
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
          Authorization: accessToken,
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`Monday.com API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.errors && data.errors.length > 0) {
        throw new Error(data.errors[0].message || 'Failed to fetch boards from Monday.com');
      }

      const fetchedBoards: MondayBoard[] = (data.data?.boards ?? []).map((b: any) => ({
        id: b.id,
        name: b.name,
        description: b.description ?? '',
        columns: (b.columns ?? []).map((c: any) => ({
          id: c.id,
          title: c.title,
          type: c.type,
        })),
      }));

      setBoards(fetchedBoards);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch boards';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const isBoardSelected = (boardId: string): boolean =>
    selectedBoards.some((s) => s.board.id === boardId);

  const handleBoardToggle = (board: MondayBoard) => {
    if (isBoardSelected(board.id)) {
      const updated = selectedBoards.filter((s) => s.board.id !== board.id);
      setSelectedBoards(updated);
      onSelectionChange(updated);
      if (expandedBoardId === board.id) {
        setExpandedBoardId(null);
      }
    } else {
      if (selectedBoards.length >= MAX_BOARDS) {
        setError(`You can select a maximum of ${MAX_BOARDS} boards.`);
        return;
      }

      const defaultMappings: ColumnMapping[] = board.columns
        .filter((col) => ['numbers', 'numeric', 'formula', 'rating'].includes(col.type))
        .map((col) => ({
          columnId: col.id,
          columnTitle: col.title,
          columnType: col.type,
          aggregation: 'sum',
          label: col.title,
        }));

      const newEntry: BoardWithMappings = {
        board,
        columnMappings: defaultMappings,
      };

      const updated = [...selectedBoards, newEntry];
      setSelectedBoards(updated);
      onSelectionChange(updated);
      setExpandedBoardId(board.id);
      setError(null);
    }
  };

  const handleColumnMappingChange = (
    boardId: string,
    columnId: string,
    field: keyof ColumnMapping,
    value: string
  ) => {
    const updated = selectedBoards.map((s) => {
      if (s.board.id !== boardId) return s;

      const updatedMappings = s.columnMappings.map((m) => {
        if (m.columnId !== columnId) return m;
        return { ...m, [field]: value };
      });

      return { ...s, columnMappings: updatedMappings };
    });

    setSelectedBoards(updated);
    onSelectionChange(updated);
  };

  const handleAddColumnMapping = (boardId: string) => {
    const boardEntry = selectedBoards.find((s) => s.board.id === boardId);
    if (!boardEntry) return;

    const board = boards.find((b) => b.id === boardId);
    if (!board) return;

    const mappedColumnIds = new Set(boardEntry.columnMappings.map((m) => m.columnId));
    const availableColumns = board.columns.filter((col) => !mappedColumnIds.has(col.id));

    if (availableColumns.length === 0) return;

    const firstAvailable = availableColumns[0];
    const newMapping: ColumnMapping = {
      columnId: firstAvailable.id,
      columnTitle: firstAvailable.title,
      columnType: firstAvailable.type,
      aggregation: 'count',
      label: firstAvailable.title,
    };

    const updated = selectedBoards.map((s) => {
      if (s.board.id !== boardId) return s;
      return { ...s, columnMappings: [...s.columnMappings, newMapping] };
    });

    setSelectedBoards(updated);
    onSelectionChange(updated);
  };

  const handleRemoveColumnMapping = (boardId: string, columnId: string) => {
    const updated = selectedBoards.map((s) => {
      if (s.board.id !== boardId) return s;
      return {
        ...s,
        columnMappings: s.columnMappings.filter((m) => m.columnId !== columnId),
      };
    });

    setSelectedBoards(updated);
    onSelectionChange(updated);
  };

  const handleColumnSelect = (boardId: string, oldColumnId: string, newColumnId: string) => {
    const boardEntry = selectedBoards.find((s) => s.board.id === boardId);
    if (!boardEntry) return;

    const board = boards.find((b) => b.id === boardId);
    if (!board) return;

    const newColumn = board.columns.find((c) => c.id === newColumnId);
    if (!newColumn) return;

    const updated = selectedBoards.map((s) => {
      if (s.board.id !== boardId) return s;

      const updatedMappings = s.columnMappings.map((m) => {
        if (m.columnId !== oldColumnId) return m;
        return {
          ...m,
          columnId: newColumn.id,
          columnTitle: newColumn.title,
          columnType: newColumn.type,
          label: newColumn.title,
        };
      });

      return { ...s, columnMappings: updatedMappings };
    });

    setSelectedBoards(updated);
    onSelectionChange(updated);
  };

  const filteredBoards = boards.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedBoardEntry = (boardId: string): BoardWithMappings | undefined =>
    selectedBoards.find((s) => s.board.id === boardId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Select Boards</h2>
          <p className="text-sm text-gray-500 mt-1">
            Choose up to {MAX_BOARDS} Monday.com boards to include in your report.
          </p>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
          {selectedBoards.length} / {MAX_BOARDS} selected
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4">
          <div className="flex items-start gap-3">
            <svg
              className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <svg
              className="animate-spin h-8 w-8 text-indigo-600"
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
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <p className="text-sm text-gray-500">Fetching your Monday.com boards...</p>
          </div>
        </div>
      )}

      {/* Board list */}
      {!loading && boards.length > 0 && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                clipRule="evenodd"
              />
            </svg>
            <input
              type="text"
              placeholder="Search boards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Board cards */}
          <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white overflow-hidden">
            {filteredBoards.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                No boards match your search.
              </div>
            ) : (
              filteredBoards.map((board) => {
                const selected = isBoardSelected(board.id);
                const expanded = expandedBoardId === board.id && selected;
                const entry = selectedBoardEntry(board.id);

                return (
                  <div key={board.id} className="transition-colors">
                    {/* Board row */}
                    <div
                      className={`flex items-center gap-4 px-4 py-3 ${
                        selected ? 'bg-indigo-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => handleBoardToggle(board)}
                        className={`flex-shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                          selected
                            ? 'bg-indigo-600 border-indigo-600'
                            : 'border-gray-300 hover:border-indigo-400 bg-white'
                        } ${
                          !selected && selectedBoards.length >= MAX_BOARDS
                            ? 'opacity-40 cursor-not-allowed'
                            : 'cursor-pointer'
                        }`}
                        disabled={!selected && selectedBoards.length >= MAX_BOARDS}
                        aria-label={selected ? `Deselect ${board.name}` : `Select ${board.name}`}
                      >
                        {selected && (
                          <svg
                            className="h-3 w-3 text-white"
                            viewBox="0 0 12 12"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>

                      {/* Board info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{board.name}</p>
                        {board.description && (
                          <p className="text-xs text-gray-500 truncate">{board.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">
                          {board.columns.length} column{board.columns.length !== 1 ? 's' : ''}
                        </p>
                      </div>

                      {/* Expand/collapse button for selected boards */}
                      {selected && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedBoardId(expanded ? null : board.id)
                          }
                          className="flex-shrink-0 flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors px-2 py-1 rounded hover:bg-indigo-100"
                        >
                          <span>Map columns</span>
                          <svg
                            className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Column mapping panel */}
                    {expanded && entry && (
                      <div className="bg-white border-t border-indigo-100 px-4 py-4">
                        <div className="mb-3">
                          <h3 className="text-sm font-semibold text-gray-800">
                            Column Mappings
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Select which columns to include and how to aggregate their values.
                          </p>
                        </div>

                        {entry.columnMappings.length === 0 ? (
                          <p className="text-sm text-gray-400 italic mb-3">
                            No columns mapped yet. Add a column below.
                          </p>
                        ) : (
                          <div className="space-y-3 mb-4">
                            {entry.columnMappings.map((mapping) => {
                              const board = boards.find((b) => b.id === expandedBoardId);
                              const mappedIds = new Set(
                                entry.columnMappings
                                  .filter((m) => m.columnId !== mapping.columnId)
                                  .map((m) => m.columnId)
                              );

                              return (
                                <div
                                  key={mapping.columnId}
                                  className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-3 rounded-lg bg-gray-50 border border-gray-200"
                                >
                                  {/* Column select */}
                                  <div className="sm:col-span-1">
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                      Column
                                    </label>
                                    <select
                                      value={mapping.columnId}
                                      onChange={(e) =>
                                        handleColumnSelect(
                                          board?.id ?? '',
                                          mapping.columnId,
                                          e.target.value
                                        )
                                      }
                                      className="w-full rounded-md border border-gray-300 bg-white py-1.5 px-2 text-xs text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    >
                                      <option value={mapping.columnId}>
                                        {mapping.columnTitle}
                                      </option>
                                      {board?.columns
                                        .filter(
                                          (c) =>
                                            !mappedIds.has(c.id) && c.id !== mapping.columnId
                                        )
                                        .map((c) => (
                                          <option key={c.id} value={c.id}>
                                            {c.title}
                                          </option>
                                        ))}
                                    </select>
                                  </div>

                                  {/* Aggregation select */}
                                  <div className="sm:col-span-1">
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                      Aggregation
                                    </label>
                                    <select
                                      value={mapping.aggregation}
                                      onChange={(e) =>
                                        handleColumnMappingChange(
                                          board?.id ?? '',
                                          mapping.columnId,
                                          'aggregation',
                                          e.target.value
                                        )
                                      }
                                      className="w-full rounded-md border border-gray-300 bg-white py-1.5 px-2 text-xs text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    >
                                      {AGGREGATION_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                          {opt.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Label input */}
                                  <div className="sm:col-span-1">
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                      Display Label
                                    </label>
                                    <input
                                      type="text"
                                      value={mapping.label}
                                      onChange={(e) =>
                                        handleColumnMappingChange(
                                          board?.id ?? '',
                                          mapping.columnId,
                                          'label',
                                          e.target.value
                                        )
                                      }
                                      className="w-full rounded-md border border-gray-300 bg-white py-1.5 px-2 text-xs text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                      placeholder="e.g. Total Revenue"
                                    />
                                  </div>

                                  {/* Column type badge + remove */}
                                  <div className="sm:col-span-1 flex items-end justify-between gap-2">
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Type
                                      </label>
                                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                        {mapping.columnType}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleRemoveColumnMapping(board?.id ?? '', mapping.columnId)
                                      }
                                      className="flex-shrink-0 p-1.5 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                      aria-label="Remove column mapping"
                                    >
                                      <svg
                                        className="h-4 w-4"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Add column button */}
                        {(() => {
                          const boardData = boards.find((b) => b.id === expandedBoardId);
                          const mappedIds = new Set(entry.columnMappings.map((m) => m.columnId));
                          const hasAvailable =
                            boardData &&
                            boardData.columns.some((c) => !mappedIds.has(c.id));

                          return hasAvailable ? (
                            <button
                              type="button"
                              onClick={() => handleAddColumnMapping(expandedBoardId!)}
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors px-3 py-1.5 rounded-md border border-indigo-200 hover:bg-indigo-50"
                            >
                              <svg
                                className="h-3.5 w-3.5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                              </svg>
                              Add column
                            </button>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Empty state when no boards */}
      {!loading && !error && boards.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center">
          <svg
            className="mx-auto h-10 w-10 text-gray-300"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
            />
          </svg>
          <p className="mt-4 text-sm font-medium text-gray-900">No boards found</p>
          <p className="mt-1 text-sm text-gray-500">
            No Monday.com boards were found for your account.
          </p>
          <button
            type="button"
            onClick={fetchBoards}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M15.312 11.424a5.5 5.5 0 01-9.201 