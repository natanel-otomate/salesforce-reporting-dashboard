'use client';

import { useState, useEffect, FormEvent } from 'react';
import { createBrowserClient } from '@/lib/supabase';

interface DigestScheduleConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly';
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  time_of_day: string; // HH:MM format
}

interface DigestScheduleFormProps {
  userId: string;
}

const DAYS_OF_WEEK = [
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
];

export default function DigestScheduleForm({ userId }: DigestScheduleFormProps) {
  const [config, setConfig] = useState<DigestScheduleConfig>({
    enabled: false,
    frequency: 'weekly',
    day_of_week: 1,
    time_of_day: '08:00',
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const supabase = createBrowserClient();

  useEffect(() => {
    async function fetchDigestConfig() {
      setLoading(true);
      setErrorMessage(null);

      try {
        const { data, error } = await supabase
          .from('digest_schedule')
          .select('enabled, frequency, day_of_week, time_of_day')
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 = no rows found, which is expected for new users
          throw error;
        }

        if (data) {
          setConfig({
            enabled: data.enabled ?? false,
            frequency: data.frequency ?? 'weekly',
            day_of_week: data.day_of_week ?? 1,
            time_of_day: data.time_of_day ?? '08:00',
          });
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load digest configuration.';
        setErrorMessage(message);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchDigestConfig();
    }
  }, [userId]);

  const handleToggleEnabled = () => {
    setConfig((prev) => ({ ...prev, enabled: !prev.enabled }));
  };

  const handleFrequencyChange = (frequency: 'daily' | 'weekly') => {
    setConfig((prev) => ({ ...prev, frequency }));
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setConfig((prev) => ({ ...prev, day_of_week: parseInt(e.target.value, 10) }));
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig((prev) => ({ ...prev, time_of_day: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const payload = {
        user_id: userId,
        enabled: config.enabled,
        frequency: config.frequency,
        day_of_week: config.frequency === 'weekly' ? config.day_of_week : null,
        time_of_day: config.time_of_day,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('digest_schedule')
        .upsert(payload, { onConflict: 'user_id' });

      if (error) {
        throw error;
      }

      setSuccessMessage('Digest schedule saved successfully.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save digest schedule.';
      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-500 text-sm">Loading digest settings...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Enable Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Email Digest</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Receive a summary of your board performance delivered to your inbox.
          </p>
        </div>
        <button
          type="button"
          onClick={handleToggleEnabled}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            config.enabled ? 'bg-blue-600' : 'bg-gray-300'
          }`}
          aria-pressed={config.enabled}
          aria-label="Toggle email digest"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
              config.enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Conditional Settings — only shown when enabled */}
      {config.enabled && (
        <div className="space-y-5 pl-1">
          {/* Frequency Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleFrequencyChange('daily')}
                className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                  config.frequency === 'daily'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Daily
              </button>
              <button
                type="button"
                onClick={() => handleFrequencyChange('weekly')}
                className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                  config.frequency === 'weekly'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Weekly
              </button>
            </div>
          </div>

          {/* Day of Week — only shown for weekly */}
          {config.frequency === 'weekly' && (
            <div>
              <label
                htmlFor="day_of_week"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Day of Week
              </label>
              <select
                id="day_of_week"
                value={config.day_of_week}
                onChange={handleDayChange}
                className="block w-full max-w-xs rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {DAYS_OF_WEEK.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Time of Day */}
          <div>
            <label
              htmlFor="time_of_day"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Time of Day{' '}
              <span className="text-xs text-gray-400 font-normal">(your local timezone)</span>
            </label>
            <input
              id="time_of_day"
              type="time"
              value={config.time_of_day}
              onChange={handleTimeChange}
              className="block w-full max-w-xs rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Preview */}
          <div className="rounded-md bg-blue-50 border border-blue-100 px-4 py-3">
            <p className="text-xs text-blue-700">
              <span className="font-semibold">Schedule preview: </span>
              {config.frequency === 'daily'
                ? `Every day at ${config.time_of_day}`
                : `Every ${DAYS_OF_WEEK.find((d) => d.value === config.day_of_week)?.label ?? ''} at ${config.time_of_day}`}
            </p>
          </div>
        </div>
      )}

      {/* Feedback Messages */}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-md bg-green-50 border border-green-200 px-4 py-3">
          <svg
            className="h-4 w-4 text-green-500 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-4 py-3">
          <svg
            className="h-4 w-4 text-red-500 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-1">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving && (
            <svg
              className="animate-spin h-4 w-4 text-white"
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
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
          )}
          {saving ? 'Saving...' : 'Save Digest Schedule'}
        </button>
      </div>
    </form>
  );
}