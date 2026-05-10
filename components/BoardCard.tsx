'use client';

import React from 'react';
import { Board } from '@/types';

interface BoardCardProps {
  board: Board;
}

function getCompletionColor(percentage: number): string {
  if (percentage >= 75) return 'text-green-600';
  if (percentage >= 40) return 'text-yellow-600';
  return 'text-red-600';
}

function getProgressBarColor(percentage: number): string {
  if (percentage >= 75) return 'bg-green-500';
  if (percentage >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
}

export default function BoardCard({ board }: BoardCardProps) {
  const totalItems = board.total_items ?? 0;
  const completedItems = board.completed_items ?? 0;
  const overdueItems = board.overdue_items ?? 0;

  const completionPercentage =
    totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const colorClass = getCompletionColor(completionPercentage);
  const progressBarColor = getProgressBarColor(completionPercentage);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col gap-4 hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3
            className="text-base font-semibold text-gray-900 truncate"
            title={board.name}
          >
            {board.name}
          </h3>
          {board.workspace_id && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">
              Workspace ID: {board.workspace_id}
            </p>
          )}
        </div>
        <span
          className={`text-xl font-bold tabular-nums shrink-0 ${colorClass}`}
        >
          {completionPercentage}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${progressBarColor}`}
          style={{ width: `${completionPercentage}%` }}
          role="progressbar"
          aria-valuenow={completionPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${completionPercentage}% complete`}
        />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2">
        {/* Total Items */}
        <div className="flex flex-col items-center bg-gray-50 rounded-lg py-2 px-1">
          <span className="text-lg font-bold text-gray-800 tabular-nums">
            {totalItems}
          </span>
          <span className="text-xs text-gray-500 mt-0.5 text-center leading-tight">
            Total Items
          </span>
        </div>

        {/* Completed */}
        <div className="flex flex-col items-center bg-green-50 rounded-lg py-2 px-1">
          <span className="text-lg font-bold text-green-700 tabular-nums">
            {completedItems}
          </span>
          <span className="text-xs text-green-600 mt-0.5 text-center leading-tight">
            Completed
          </span>
        </div>

        {/* Overdue */}
        <div
          className={`flex flex-col items-center rounded-lg py-2 px-1 ${
            overdueItems > 0 ? 'bg-red-50' : 'bg-gray-50'
          }`}
        >
          <span
            className={`text-lg font-bold tabular-nums ${
              overdueItems > 0 ? 'text-red-600' : 'text-gray-400'
            }`}
          >
            {overdueItems}
          </span>
          <span
            className={`text-xs mt-0.5 text-center leading-tight ${
              overdueItems > 0 ? 'text-red-500' : 'text-gray-400'
            }`}
          >
            Overdue
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
        <span className="text-xs text-gray-400">
          {board.last_synced_at
            ? `Synced ${new Date(board.last_synced_at).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}`
            : 'Never synced'}
        </span>
        {overdueItems > 0 && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
            <svg
              className="w-3 h-3"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {overdueItems} overdue
          </span>
        )}
      </div>
    </div>
  );
}