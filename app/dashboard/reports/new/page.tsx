'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BoardConfig {
  boardId: string
  boardName: string
  workspaceName: string
  apiToken: string
  selectedColumns: string[]
}

interface ScheduleSettings {
  frequency: 'daily' | 'weekly' | 'monthly'
  dayOfWeek?: number // 0-6, used when frequency === 'weekly'
  dayOfMonth?: number // 1-31, used when frequency === 'monthly'
  timeOfDay: string // HH:MM
  timezone: string
}

interface Recipient {
  id: string
  email: string
  name: string
}

interface FormState {
  reportName: string
  boardConfigs: BoardConfig[]
  schedule: ScheduleSettings
  recipients: Recipient[]
}

interface MondayBoard {
  id: string
  name: string
  workspace?: { name: string }
  columns?: Array<{ id: string; title: string; type: string }>
}

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Australia/Sydney',
  'UTC',
]

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const STEP_LABELS = ['Board Connector', 'Schedule Settings', 'Recipients', 'Review & Save']

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 right-0 top-4 h-0.5 bg-gray-200 z-0" />
        <div
          className="absolute left-0 top-4 h-0.5 bg-indigo-600 z-0 transition-all duration-500"
          style={{ width: `${((currentStep) / (totalSteps - 1)) * 100}%` }}
        />
        {STEP_LABELS.map((label, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep
          return (
            <div key={label} className="flex flex-col items-center z-10">
              <div
                className={[
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors duration-300',
                  isCompleted
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : isCurrent
                    ? 'bg-white border-indigo-600 text-indigo-600'
                    : 'bg-white border-gray-300 text-gray-400',
                ].join(' ')}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={[
                  'mt-2 text-xs font-medium whitespace-nowrap',
                  isCurrent ? 'text-indigo-600' : isCompleted ? 'text-indigo-500' : 'text-gray-400',
                ].join(' ')}
              >
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 1: Board Connector ───────────────────────────────────────────────────

function BoardConnectorStep({
  boardConfigs,
  onUpdate,
}: {
  boardConfigs: BoardConfig[]
  onUpdate: (configs: BoardConfig[]) => void
}) {
  const [apiToken, setApiToken] = useState('')
  const [fetchedBoards, setFetchedBoards] = useState<MondayBoard[]>([])
  const [loadingBoards, setLoadingBoards] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [pendingBoard, setPendingBoard] = useState<MondayBoard | null>(null)
  const [loadingColumns, setLoadingColumns] = useState(false)
  const [columnError, setColumnError] = useState<string | null>(null)
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])

  async function fetchBoards() {
    if (!apiToken.trim()) {
      setFetchError('Please enter a Monday.com API token.')
      return
    }
    setLoadingBoards(true)
    setFetchError(null)
    setFetchedBoards([])

    try {
      const query = `{ boards(limit: 50) { id name workspace { name } } }`
      const response = await fetch('https://api.monday.com/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: apiToken.trim(),
        },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const json = await response.json()

      if (json.errors?.length) {
        throw new Error(json.errors[0].message)
      }

      setFetchedBoards(json.data?.boards ?? [])
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to fetch boards.')
    } finally {
      setLoadingBoards(false)
    }
  }

  async function selectBoard(board: MondayBoard) {
    setLoadingColumns(true)
    setColumnError(null)
    setPendingBoard(board)
    setSelectedColumns([])

    try {
      const query = `{ boards(ids: [${board.id}]) { columns { id title type } } }`
      const response = await fetch('https://api.monday.com/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: apiToken.trim(),
        },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const json = await response.json()

      if (json.errors?.length) throw new Error(json.errors[0].message)

      const columns: Array<{ id: string; title: string; type: string }> =
        json.data?.boards?.[0]?.columns ?? []

      setPendingBoard({ ...board, columns })
    } catch (err) {
      setColumnError(err instanceof Error ? err.message : 'Failed to fetch columns.')
    } finally {
      setLoadingColumns(false)
    }
  }

  function toggleColumn(colId: string) {
    setSelectedColumns((prev) =>
      prev.includes(colId) ? prev.filter((c) => c !== colId) : [...prev, colId]
    )
  }

  function addBoardConfig() {
    if (!pendingBoard) return
    const alreadyAdded = boardConfigs.some((c) => c.boardId === pendingBoard.id)
    if (alreadyAdded) return

    const newConfig: BoardConfig = {
      boardId: pendingBoard.id,
      boardName: pendingBoard.name,
      workspaceName: pendingBoard.workspace?.name ?? 'Default',
      apiToken: apiToken.trim(),
      selectedColumns,
    }
    onUpdate([...boardConfigs, newConfig])
    setPendingBoard(null)
    setSelectedColumns([])
  }

  function removeBoardConfig(boardId: string) {
    onUpdate(boardConfigs.filter((c) => c.boardId !== boardId))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Connect a Monday.com Board</h2>
        <p className="mt-1 text-sm text-gray-500">
          Enter your Monday.com API token to fetch available boards. You can add multiple boards from
          different workspaces.
        </p>
      </div>

      {/* Token Input */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Monday.com API Token
        </label>
        <div className="flex gap-2">
          <input
            type="password"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchBoards()}
            placeholder="eyJhbGciOiJIUzI1NiJ9..."
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={fetchBoards}
            disabled={loadingBoards}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loadingBoards ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Fetching...
              </>
            ) : (
              'Fetch Boards'
            )}
          </button>
        </div>
        {fetchError && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {fetchError}
          </p>
        )}
      </div>

      {/* Board List */}
      {fetchedBoards.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            {fetchedBoards.length} board{fetchedBoards.length !== 1 ? 's' : ''} found — click to configure
          </p>
          <div className="max-h-56 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
            {fetchedBoards.map((board) => {
              const alreadyAdded = boardConfigs.some((c) => c.boardId === board.id)
              const isSelected = pendingBoard?.id === board.id
              return (
                <button
                  key={board.id}
                  type="button"
                  disabled={alreadyAdded}
                  onClick={() => selectBoard(board)}
                  className={[
                    'w-full flex items-center justify-between px-4 py-3 text-left text-sm transition-colors',
                    alreadyAdded
                      ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      : isSelected
                      ? 'bg-indigo-50 text-indigo-900'
                      : 'bg-white hover:bg-gray-50 text-gray-900',
                  ].join(' ')}
                >
                  <span className="font-medium truncate">{board.name}</span>
                  <span className="ml-4 text-xs text-gray-400 whitespace-nowrap">
                    {alreadyAdded ? 'Added' : board.workspace?.name ?? 'Default Workspace'}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Column Selector */}
      {pendingBoard && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-indigo-900">
              Configure: {pendingBoard.name}
            </h3>
            <span className="text-xs text-indigo-600">
              Workspace: {pendingBoard.workspace?.name ?? 'Default'}
            </span>
          </div>

          {loadingColumns ? (
            <div className="flex items-center gap-2 text-sm text-indigo-700">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading columns...
            </div>
          ) : columnError ? (
            <p className="text-sm text-red-600">{columnError}</p>
          ) : (
            <>
              <p className="text-xs text-indigo-700">
                Select the columns to include in this report (select at least one):
              </p>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {(pendingBoard.columns ?? []).map((col) => (
                  <label
                    key={col.id}
                    className="flex items-center gap-2 rounded-md bg-white border border-indigo-200 px-3 py-2 cursor-pointer hover:bg-indigo-50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedColumns.includes(col.id)}
                      onChange={() => toggleColumn(col.id)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-gray-800 truncate">{col.title}</span>
                    <span className="ml-auto text-xs text-gray-400">{col.type}</span>
                  </label>
                ))}
              </div>
              <button
                type="button"
                onClick={addBoardConfig}
                disabled={selectedColumns.length === 0}
                className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Board to Report
              </button>
            </>
          )}
        </div>
      )}

      {/* Added Boards */}
      {boardConfigs.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Added boards ({boardConfigs.length}):
          </p>
          <div className="space-y-2">
            {boardConfigs.map((config) => (
              <div
                key={config.boardId}
                className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-green-900">{config.boardName}</p>
                  <p className="text-xs text-green-700">
                    {config.workspaceName} · {config.selectedColumns.length} column
                    {config.selectedColumns.length !== 1 ? 's' : ''} selected
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeBoardConfig(config.boardId)}
                  className="text-green-600 hover:text-red-600 transition-colors"
                  aria-label="Remove board"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Step 2: Schedule Settings ─────────────────────────────────────────────────

function ScheduleSettingsStep({
  schedule,
  onUpdate,
}: {
  schedule: ScheduleSettings
  onUpdate: (s: ScheduleSettings) => void
}) {
  function set<K extends keyof ScheduleSettings>(key: K, value: ScheduleSettings[K]) {
    onUpdate({ ...schedule, [key]: value })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Schedule Settings</h2>
        <p className="mt-1 text-sm text-gray-500">
          Choose how frequently this report should be generated and delivered.
        </p>
      </div>

      {/* Frequency */}
      <fieldset>
        <legend className="text-sm font-medium text-gray-700 mb-2">Delivery Frequency</legend>
        <div className="grid grid-cols-3 gap-3">
          {(['daily', 'weekly', 'monthly'] as const).map((freq) => (
            <label
              key={freq}
              className={[
                'flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-colors',
                schedule.frequency === freq
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 bg-white hover:border-indigo-300',
              ].join(' ')}
            >
              <input
                type="radio"
                name="frequency"
                value={freq}
                checked={schedule.frequency === freq}
                onChange={() => set('frequency', freq)}
                className="sr-only"
              />
              <span className="text-2xl mb-1">
                {freq === 'daily' ? '📅' : freq === 'weekly' ? '📆' : '🗓️'}
              </span>
              <span className="text-sm font-semibold text-gray-900 capitalize">{freq}</span>
              <span className="text-xs text-gray-500 mt-0.5 text-center">
                {freq === 'daily'
                  ? 'Every day'
                  : freq === 'weekly'
                  ? 'Once a week'
                  : 'Once a month'}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Day of Week (weekly) */}
      {schedule.frequency === 'weekly' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Day of Week</label>
          <div className="grid grid-cols-7 gap-1">
            {DAYS_OF_WEEK.map((day, index) => (
              <button
                key={day}
                type="button"
                onClick={() => set('dayOfWeek', index)}
                className={[
                  'rounded-md py-2 text-xs font-medium transition-colors',
                  schedule.dayOfWeek === index
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-indigo-100',
                ].join(' ')}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Day of Month (monthly) */}
      {schedule.frequency === 'monthly' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Day of Month</label>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => set('dayOfMonth', day)}
                className={[
                  'rounded-md py-2 text-xs font-medium transition-colors',
                  schedule.dayOfMonth === day
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-indigo-100',
                ].join(' ')}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Time of Day */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="timeOfDay" className="block text-sm font-medium text-gray-700 mb-1">
            Time of Day
          </label>
          <input
            id="timeOfDay"
            type="time"
            value={schedule.timeOfDay}
            onChange={(e) => set('timeOfDay', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
            Timezone
          </label>
          <select
            id="timezone"
            value={schedule.timezone}
            onChange={(e) => set('timezone', e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3">
        <p className="text-sm font-medium text-indigo-900">
          📬 Delivery summary:
        </p>
        <p className="text-sm text-indigo-700 mt-1">
          {schedule.frequency === 'daily' && (
            <>Every day at {schedule.timeOfDay} ({schedule.timezone})</>
          )}
          {schedule.frequency === 'weekly' && (
            <>
              Every {DAYS_OF_WEEK[schedule.dayOfWeek ?? 1]} at {schedule.timeOfDay} ({schedule.timezone})
            </>
          )}
          {schedule.frequency === 'monthly' && (
            <>
              On day {schedule.dayOfMonth ?? 1} of each month at {schedule.timeOfDay} ({schedule.timezone})
            </>
          )}
        </p>
      </div>
    </div>
  )
}

// ─── Step 3: Recipients ────────────────────────────────────────────────────────

function RecipientsStep({
  recipients,
  onUpdate,
}: {
  recipients: Recipient[]
  onUpdate: (r: Recipient[]) => void
}) {
  const [emailInput, setEmailInput] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [inputError, setInputError] = useState<string | null>(null)

  function validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  function addRecipient() {
    const email = emailInput.trim().toLowerCase()
    const name = nameInput.trim()

    if (!email) {
      setInputError('Email is required.')
      return
    }
    if (!validateEmail(email)) {
      setInputError('Please enter a valid email address.')
      return
    }
    if (recipients.some((r) => r.email === email)) {
      setInputError('This email is already in the list.')
      return
    }

    const newRecipient: Recipient = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      email,
      name: name || email,
    }

    onUpdate([...recipients, newRecipient])
    setEmailInput('')
    setNameInput('')
    setInputError(null)
  }

  function removeRecipient(id: string) {
    onUpdate(recipients.filter((r) => r.id !== id))
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addRecipient()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Report Recipients</h2>
        <p className="mt-1 text-sm text-gray-500">
          Add the email addresses that will receive this report. Recipients do not need a Monday.com
          account.
        </p>
      </div>

      {/* Add Recipient Form */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="recipientName" className="block text-xs font-medium text-gray-700 mb-1">
              Name (optional)
            </label>
            <input
              id="recipientName"
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Jane Smith"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="recipientEmail" className="block text-xs font-medium text-gray-700 mb-1">
              Email address <span className="text-red-500">*</span>
            </label>
            <input
              id="recipientEmail"
              type="email"
              value={emailInput}
              onChange={(e) => {
                setEmailInput(e.target.value)
                setInputError(null)
              }}
              onKeyDown={handleKeyDown}
              placeholder="jane@company.com"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
        {inputError && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {inputError}
          </p>
        )}
        <button
          type="button"
          onClick={addRecipient}
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Recipient
        </button>
      </div>

      {/* Recipients List */}
      {recipients.length > 0 ? (
        <div className="space-y-2">
          <p className