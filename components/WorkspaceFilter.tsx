'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Workspace, Board } from '@/types';

interface WorkspaceFilterProps {
  workspaces: Workspace[];
  boards: Board[];
  onFilterChange: (filteredBoards: Board[]) => void;
}

export default function WorkspaceFilter({
  workspaces,
  boards,
  onFilterChange,
}: WorkspaceFilterProps) {
  const [selectedWorkspaceIds, setSelectedWorkspaceIds] = useState<Set<string>>(
    new Set(workspaces.map((w) => w.id))
  );
  const [isOpen, setIsOpen] = useState(false);

  const applyFilter = useCallback(
    (selectedIds: Set<string>) => {
      if (selectedIds.size === 0 || selectedIds.size === workspaces.length) {
        onFilterChange(boards);
      } else {
        const filtered = boards.filter(
          (board) =>
            board.workspace_id !== null &&
            board.workspace_id !== undefined &&
            selectedIds.has(String(board.workspace_id))
        );
        onFilterChange(filtered);
      }
    },
    [boards, workspaces.length, onFilterChange]
  );

  useEffect(() => {
    setSelectedWorkspaceIds(new Set(workspaces.map((w) => w.id)));
  }, [workspaces]);

  useEffect(() => {
    applyFilter(selectedWorkspaceIds);
  }, [selectedWorkspaceIds, applyFilter]);

  const toggleWorkspace = (workspaceId: string) => {
    setSelectedWorkspaceIds((prev) => {
      const next = new Set(prev);
      if (next.has(workspaceId)) {
        next.delete(workspaceId);
      } else {
        next.add(workspaceId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedWorkspaceIds(new Set(workspaces.map((w) => w.id)));
  };

  const clearAll = () => {
    setSelectedWorkspaceIds(new Set());
  };

  const allSelected = selectedWorkspaceIds.size === workspaces.length;
  const noneSelected = selectedWorkspaceIds.size === 0;
  const someSelected =
    selectedWorkspaceIds.size > 0 &&
    selectedWorkspaceIds.size < workspaces.length;

  const getButtonLabel = () => {
    if (allSelected || noneSelected) {
      return 'All Workspaces';
    }
    if (selectedWorkspaceIds.size === 1) {
      const id = Array.from(selectedWorkspaceIds)[0];
      const workspace = workspaces.find((w) => w.id === id);
      return workspace ? workspace.name : '1 Workspace';
    }
    return `${selectedWorkspaceIds.size} Workspaces`;
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-150"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <svg
          className="h-4 w-4 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
          />
        </svg>
        <span>{getButtonLabel()}</span>
        {someSelected && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
            {selectedWorkspaceIds.size}
          </span>
        )}
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute left-0 z-20 mt-2 w-72 origin-top-left rounded-xl border border-gray-200 bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <span className="text-sm font-semibold text-gray-800">
                Filter by Workspace
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={selectAll}
                  disabled={allSelected}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:cursor-not-allowed disabled:opacity-40 transition-colors duration-150"
                >
                  All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={clearAll}
                  disabled={noneSelected}
                  className="text-xs font-medium text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 transition-colors duration-150"
                >
                  Clear
                </button>
              </div>
            </div>

            {workspaces.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400">
                No workspaces available
              </div>
            ) : (
              <ul
                role="listbox"
                aria-multiselectable="true"
                className="max-h-64 overflow-y-auto py-2"
              >
                {workspaces.map((workspace) => {
                  const isSelected = selectedWorkspaceIds.has(workspace.id);
                  const boardCount = boards.filter(
                    (b) => String(b.workspace_id) === workspace.id
                  ).length;

                  return (
                    <li key={workspace.id} role="option" aria-selected={isSelected}>
                      <button
                        type="button"
                        onClick={() => toggleWorkspace(workspace.id)}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100 hover:bg-gray-50 ${
                          isSelected ? 'bg-indigo-50' : ''
                        }`}
                      >
                        <span
                          className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors duration-150 ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-600'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {isSelected && (
                            <svg
                              className="h-3 w-3 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={3}
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4.5 12.75l6 6 9-13.5"
                              />
                            </svg>
                          )}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span
                            className={`block truncate text-sm font-medium ${
                              isSelected ? 'text-indigo-700' : 'text-gray-700'
                            }`}
                          >
                            {workspace.name}
                          </span>
                        </span>
                        <span
                          className={`ml-auto flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                            isSelected
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {boardCount} {boardCount === 1 ? 'board' : 'boards'}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="border-t border-gray-100 px-4 py-3">
              <p className="text-xs text-gray-400">
                {noneSelected
                  ? 'No workspaces selected — showing no boards'
                  : allSelected
                  ? `Showing all ${boards.length} boards`
                  : `Showing boards from ${selectedWorkspaceIds.size} of ${workspaces.length} workspaces`}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}