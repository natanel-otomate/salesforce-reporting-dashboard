'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import BoardSelector from '@/components/BoardSelector';
import { saveReportConfiguration } from '@/lib/actions';
import type { MondayBoard, ReportBoardMetric } from '@/types';

type AggregationRule = {
  boardId: string;
  boardName: string;
  columnId: string;
  columnName: string;
  aggregation: 'sum' | 'average' | 'count' | 'min' | 'max';
  label: string;
};

type ScheduleFrequency = 'daily' | 'weekly' | 'monthly';

type FormState = {
  reportName: string;
  selectedBoards: MondayBoard[];
  aggregationRules: AggregationRule[];
  scheduleFrequency: ScheduleFrequency;
  scheduleDayOfWeek: number;
  scheduleDayOfMonth: number;
  scheduleHour: number;
  recipients: string[];
  recipientInput: string;
};

const STEPS = [
  { id: 1, label: 'Name & Boards' },
  { id: 2, label: 'Column Mapping' },
  { id: 3, label: 'Aggregation Rules' },
  { id: 4, label: 'Schedule' },
  { id: 5, label: 'Recipients' },
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const AGGREGATION_OPTIONS: { value: AggregationRule['aggregation']; label: string }[] = [
  { value: 'sum', label: 'Sum' },
  { value: 'average', label: 'Average' },
  { value: 'count', label: 'Count' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' },
];

export default function NewReportPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [mondayToken, setMondayToken] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    reportName: '',
    selectedBoards: [],
    aggregationRules: [],
    scheduleFrequency: 'weekly',
    scheduleDayOfWeek: 1,
    scheduleDayOfMonth: 1,
    scheduleHour: 8,
    recipients: [],
    recipientInput: '',
  });

  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace('/auth');
        return;
      }
      setUserId(data.user.id);

      supabase
        .from('user_integrations')
        .select('monday_access_token')
        .eq('user_id', data.user.id)
        .single()
        .then(({ data: integration }) => {
          if (integration?.monday_access_token) {
            setMondayToken(integration.monday_access_token);
          }
        });
    });
  }, [router]);

  const updateForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleBoardsSelected = (boards: MondayBoard[]) => {
    updateForm('selectedBoards', boards);
    const existingRuleKeys = new Set(
      form.aggregationRules.map((r) => `${r.boardId}__${r.columnId}`)
    );
    const newRules = form.aggregationRules.filter((r) =>
      boards.some((b) => b.id === r.boardId)
    );
    updateForm('aggregationRules', newRules);
  };

  const addAggregationRule = () => {
    if (form.selectedBoards.length === 0) return;
    const firstBoard = form.selectedBoards[0];
    const firstColumn = firstBoard.columns?.[0];
    const newRule: AggregationRule = {
      boardId: firstBoard.id,
      boardName: firstBoard.name,
      columnId: firstColumn?.id ?? '',
      columnName: firstColumn?.title ?? '',
      aggregation: 'sum',
      label: firstColumn ? `${firstBoard.name} — ${firstColumn.title} Sum` : '',
    };
    updateForm('aggregationRules', [...form.aggregationRules, newRule]);
  };

  const updateAggregationRule = (
    index: number,
    field: keyof AggregationRule,
    value: string
  ) => {
    const updated = form.aggregationRules.map((rule, i) => {
      if (i !== index) return rule;
      const updatedRule = { ...rule, [field]: value };
      if (field === 'boardId') {
        const board = form.selectedBoards.find((b) => b.id === value);
        if (board) {
          updatedRule.boardName = board.name;
          const firstCol = board.columns?.[0];
          updatedRule.columnId = firstCol?.id ?? '';
          updatedRule.columnName = firstCol?.title ?? '';
          updatedRule.label = firstCol
            ? `${board.name} — ${firstCol.title} ${updatedRule.aggregation}`
            : '';
        }
      }
      if (field === 'columnId') {
        const board = form.selectedBoards.find((b) => b.id === updatedRule.boardId);
        const col = board?.columns?.find((c) => c.id === value);
        if (col) {
          updatedRule.columnName = col.title;
          updatedRule.label = `${updatedRule.boardName} — ${col.title} ${updatedRule.aggregation}`;
        }
      }
      if (field === 'aggregation') {
        updatedRule.label = `${updatedRule.boardName} — ${updatedRule.columnName} ${value}`;
      }
      return updatedRule;
    });
    updateForm('aggregationRules', updated);
  };

  const removeAggregationRule = (index: number) => {
    updateForm(
      'aggregationRules',
      form.aggregationRules.filter((_, i) => i !== index)
    );
  };

  const addRecipient = () => {
    const email = form.recipientInput.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return;
    if (form.recipients.includes(email)) return;
    updateForm('recipients', [...form.recipients, email]);
    updateForm('recipientInput', '');
  };

  const removeRecipient = (email: string) => {
    updateForm(
      'recipients',
      form.recipients.filter((r) => r !== email)
    );
  };

  const validateStep = (step: number): string | null => {
    switch (step) {
      case 1:
        if (!form.reportName.trim()) return 'Report name is required.';
        if (form.selectedBoards.length === 0) return 'Select at least one board.';
        return null;
      case 2:
        return null;
      case 3:
        if (form.aggregationRules.length === 0) return 'Add at least one aggregation rule.';
        for (const rule of form.aggregationRules) {
          if (!rule.columnId) return 'All rules must have a column selected.';
          if (!rule.label.trim()) return 'All rules must have a label.';
        }
        return null;
      case 4:
        return null;
      case 5:
        if (form.recipients.length === 0) return 'Add at least one recipient.';
        return null;
      default:
        return null;
    }
  };

  const handleNext = () => {
    const error = validateStep(currentStep);
    if (error) {
      setSubmitError(error);
      return;
    }
    setSubmitError(null);
    setCurrentStep((s) => Math.min(s + 1, STEPS.length));
  };

  const handleBack = () => {
    setSubmitError(null);
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    const error = validateStep(5);
    if (error) {
      setSubmitError(error);
      return;
    }
    if (!userId) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const metrics: ReportBoardMetric[] = form.aggregationRules.map((rule, index) => ({
        id: `metric_${index}`,
        report_id: '',
        board_id: rule.boardId,
        board_name: rule.boardName,
        column_id: rule.columnId,
        column_name: rule.columnName,
        aggregation_type: rule.aggregation,
        display_label: rule.label,
        sort_order: index,
      }));

      await saveReportConfiguration({
        name: form.reportName,
        user_id: userId,
        board_ids: form.selectedBoards.map((b) => b.id),
        metrics,
        schedule_frequency: form.scheduleFrequency,
        schedule_day_of_week:
          form.scheduleFrequency === 'weekly' ? form.scheduleDayOfWeek : null,
        schedule_day_of_month:
          form.scheduleFrequency === 'monthly' ? form.scheduleDayOfMonth : null,
        schedule_hour: form.scheduleHour,
        recipients: form.recipients,
        is_active: true,
      });

      router.push('/dashboard');
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Create New Report</h1>
          <p className="text-gray-500 text-sm">
            Set up an automated cross-board report delivered on your schedule.
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center mb-10">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
                    currentStep === step.id
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : currentStep > step.id
                      ? 'bg-indigo-100 border-indigo-400 text-indigo-700'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {currentStep > step.id ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.id
                  )}
                </div>
                <span
                  className={`mt-1 text-xs font-medium whitespace-nowrap ${
                    currentStep === step.id
                      ? 'text-indigo-700'
                      : currentStep > step.id
                      ? 'text-indigo-500'
                      : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 mb-4 transition-colors ${
                    currentStep > step.id ? 'bg-indigo-400' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Step 1: Name & Boards */}
          {currentStep === 1 && (
            <div className="p-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-1">Name Your Report</h2>
              <p className="text-gray-500 text-sm mb-6">Give your report a clear name and select the Monday.com boards to include.</p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Report Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.reportName}
                  onChange={(e) => updateForm('reportName', e.target.value)}
                  placeholder="e.g. Weekly Exec Summary"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Select Boards <span className="text-red-500">*</span>
                </label>
                {mondayToken ? (
                  <BoardSelector
                    accessToken={mondayToken}
                    selectedBoards={form.selectedBoards}
                    onBoardsChange={handleBoardsSelected}
                  />
                ) : (
                  <div className="border border-amber-200 bg-amber-50 rounded-lg p-4 text-sm text-amber-700">
                    <span className="font-medium">Monday.com not connected.</span> Please connect your Monday.com account in settings before creating a report.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Column Mapping */}
          {currentStep === 2 && (
            <div className="p-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-1">Column Mapping</h2>
              <p className="text-gray-500 text-sm mb-6">Review the columns available on each selected board. You will configure which to aggregate in the next step.</p>

              {form.selectedBoards.length === 0 ? (
                <p className="text-gray-400 text-sm">No boards selected.</p>
              ) : (
                <div className="space-y-6">
                  {form.selectedBoards.map((board) => (
                    <div key={board.id} className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span className="text-sm font-semibold text-gray-800">{board.name}</span>
                        <span className="ml-auto text-xs text-gray-400">{board.columns?.length ?? 0} columns</span>
                      </div>
                      {board.columns && board.columns.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                          {board.columns.map((col) => (
                            <div key={col.id} className="flex items-center justify-between px-4 py-2.5">
                              <span className="text-sm text-gray-700">{col.title}</span>
                              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{col.type}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="px-4 py-3 text-sm text-gray-400">No columns found.</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Aggregation Rules */}
          {currentStep === 3 && (
            <div className="p-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-1">Aggregation Rules</h2>
              <p className="text-gray-500 text-sm mb-6">Define which metrics to compute from each board's columns. These will appear as rows in your report.</p>

              {form.aggregationRules.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl mb-4">
                  <p className="text-gray-400 text-sm mb-3">No rules added yet.</p>
                  <button
                    type="button"
                    onClick={addAggregationRule}
                    className="text-sm text-indigo-600 font-medium hover:text-indigo-800 transition"
                  >
                    + Add your first rule
                  </button>
                </div>
              ) : (
                <div className="space-y-4 mb-4">
                  {form.aggregationRules.map((rule, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Rule {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeAggregationRule(index)}
                          className="text-xs text-red-500 hover:text-red-700 font-medium transition"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Board</label>
                          <select
                            value={rule.boardId}
                            onChange={(e) => updateAggregationRule(index, 'boardId', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                          >
                            {form.selectedBoards.map((b) => (
                              <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Column</label>
                          <select
                            value={rule.columnId}
                            onChange={(e) => updateAggregationRule(index, 'columnId', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                          >
                            {(form.selectedBoards.find((b) => b.id === rule.boardId)?.columns ?? []).map((col) => (
                              <option key={col.id} value={col.id}>{col.title}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Aggregation</label>
                          <select
                            value={rule.aggregation}
                            onChange={(e) => updateAggregationRule(index, 'aggregation', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                          >
                            {AGGREGATION_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Display Label</label>
                          <input
                            type="text"
                            value={rule.label}
                            onChange={(e) => updateAggregationRule(index, 'label', e.target.value)}
                            placeholder="e.g. Total Revenue"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {form.aggregationRules.length > 0 && (
                <button
                  type="button"
                  onClick={addAggregationRule}
                  className="flex items-center gap-1.5 text-sm text-indigo-600 font-medium hover:text-indigo-800 transition"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add another rule
                </button>
              )}
            </div>
          )}

          {/* Step 4: Schedule */}
          {currentStep === 4 && (
            <div className="p-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-1">Schedule</h2>
              <p className="text-gray-500 text-sm mb-6">Choose how often and when this report should be automatically generated and delivered.</p>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                  <div className="flex gap-3">
                    {(['daily', 'weekly', 'monthly'] as ScheduleFrequency[]).map((freq) => (
                      <button
                        key={freq}
                        type="button"
                        onClick={() => updateForm('scheduleFrequency', freq)}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition capitalize ${
                          form.scheduleFrequency === freq
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'bg-white border-gray-300 text-gray-600 hover:border-indigo-400 hover:text-indigo-600'
                        }`}
                      >
                        {freq}
                      </button>
                    ))}
                  </div>
                </div>

                {form.scheduleFrequency === 'weekly' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Day of Week</label>
                    <select
                      value={form.scheduleDayOfWeek}
                      onChange={(e) => updateForm('scheduleDayOfWeek', Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    >
                      {DAYS_OF_WEEK.map((day) => (
                        <option key={day.value} value={day.value}>{day.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {form.scheduleFrequency === 'monthly' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Day of Month</label>
                    <select
                      value={form.scheduleDayOfMonth}
                      onChange={(e) => updateForm('scheduleDayOfMonth', Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    >
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Send Time (UTC)</label>
                  <select
                    value={form.scheduleHour}
                    onChange={(e) => updateForm('scheduleHour', Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  >
                    {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                      <option key={hour} value={hour}>
                        {hour.toString().padStart(2, '0')}:00 UTC
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                  <p className="text-sm text-indigo-700">
                    <span className="font-semibold">Schedule preview: </span>
                    {form.scheduleFrequency === 'daily' && `Every day at ${form.scheduleHour.toString().padStart(2, '0')}:00 UTC`}
                    {form.scheduleFrequency === 'weekly' && `Every ${DAYS_OF_WEEK[form.scheduleDayOfWeek].label} at ${form.scheduleHour.toString().padStart(2, '0')}:00 UTC`}
                    {form.scheduleFrequency === 'monthly' && `Day ${form.scheduleDayOfMonth} of every month at ${form.scheduleHour.toString().padStart(2, '0')}:00 UTC`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Recipients */}
          {currentStep === 5 && (
            <div className="p-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-1">Recipients</h2>
              <p className="text-gray-500 text-sm mb-6">Add the email addresses that should receive this report on each delivery.</p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Add Email Address</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={form.recipientInput}
                    onChange={(e) => updateForm('recipientInput', e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addRecipient();
                      }
                    }}
                    placeholder="name@company.com"
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={addRecipient}
                    className="px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
                  >
                    Add
                  </button>
                </div>
              </div>

              {form.recipients.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No recipients added yet.</p>
              ) : (
                <ul className="space-y-2">
                  {form.recipients.map((email) => (
                    <li
                      key={email}
                      className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-semibold uppercase">
                          {email[0]}
                        </div>
                        <span className="text-sm text-gray-800">{email}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRecipient(email)}
                        className="text-gray-400 hover:text-red-500 transition"
                        aria-label={`Remove ${email}`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox