'use server';

import { createServerClient } from '@/lib/supabase';
import { fetchBoardAggregates } from '@/lib/monday';
import type {
  ReportConfiguration,
  ReportSnapshot,
  DeliveryLog,
} from '@/types';
import { revalidatePath } from 'next/cache';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SaveReportConfigInput {
  name: string;
  userId: string;
  boardIds: string[];
  columnMappings: ReportConfiguration['column_mappings'];
  aggregationRules: ReportConfiguration['aggregation_rules'];
  schedule: ReportConfiguration['schedule'];
  recipients: string[];
}

export interface ActionResult<T = null> {
  success: boolean;
  data?: T;
  error?: string;
}

// ---------------------------------------------------------------------------
// Save (create or update) a report configuration
// ---------------------------------------------------------------------------

export async function saveReportConfig(
  input: SaveReportConfigInput,
  existingId?: string
): Promise<ActionResult<ReportConfiguration>> {
  const supabase = createServerClient();

  const payload = {
    name: input.name,
    user_id: input.userId,
    board_ids: input.boardIds,
    column_mappings: input.columnMappings,
    aggregation_rules: input.aggregationRules,
    schedule: input.schedule,
    recipients: input.recipients,
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  let result;

  if (existingId) {
    result = await supabase
      .from('report_configurations')
      .update(payload)
      .eq('id', existingId)
      .eq('user_id', input.userId)
      .select()
      .single();
  } else {
    result = await supabase
      .from('report_configurations')
      .insert({ ...payload, created_at: new Date().toISOString() })
      .select()
      .single();
  }

  if (result.error) {
    console.error('[saveReportConfig] Supabase error:', result.error);
    return { success: false, error: result.error.message };
  }

  revalidatePath('/dashboard');

  return { success: true, data: result.data as ReportConfiguration };
}

// ---------------------------------------------------------------------------
// Delete a report configuration
// ---------------------------------------------------------------------------

export async function deleteReportConfig(
  reportId: string,
  userId: string
): Promise<ActionResult> {
  const supabase = createServerClient();

  const { error } = await supabase
    .from('report_configurations')
    .delete()
    .eq('id', reportId)
    .eq('user_id', userId);

  if (error) {
    console.error('[deleteReportConfig] Supabase error:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard');

  return { success: true };
}

// ---------------------------------------------------------------------------
// Toggle schedule active state (pause / resume)
// ---------------------------------------------------------------------------

export async function setScheduleActiveState(
  reportId: string,
  userId: string,
  isActive: boolean
): Promise<ActionResult<Pick<ReportConfiguration, 'id' | 'is_active'>>> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('report_configurations')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', reportId)
    .eq('user_id', userId)
    .select('id, is_active')
    .single();

  if (error) {
    console.error('[setScheduleActiveState] Supabase error:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard');

  return {
    success: true,
    data: data as Pick<ReportConfiguration, 'id' | 'is_active'>,
  };
}

// ---------------------------------------------------------------------------
// Trigger a manual preview: fetch live data, store snapshot, log delivery
// ---------------------------------------------------------------------------

export async function triggerManualPreview(
  reportId: string,
  userId: string
): Promise<ActionResult<ReportSnapshot>> {
  const supabase = createServerClient();

  // 1. Load the report configuration
  const { data: config, error: configError } = await supabase
    .from('report_configurations')
    .select('*')
    .eq('id', reportId)
    .eq('user_id', userId)
    .single();

  if (configError || !config) {
    return {
      success: false,
      error: configError?.message ?? 'Report configuration not found.',
    };
  }

  // 2. Retrieve the Monday.com OAuth token for this user
  const { data: tokenRow, error: tokenError } = await supabase
    .from('monday_tokens')
    .select('access_token')
    .eq('user_id', userId)
    .single();

  if (tokenError || !tokenRow?.access_token) {
    return {
      success: false,
      error: 'Monday.com access token not found. Please reconnect your account.',
    };
  }

  const accessToken: string = tokenRow.access_token;

  // 3. Fetch aggregated data from Monday.com for each board
  const boardMetrics = [];

  for (const boardId of config.board_ids as string[]) {
    try {
      const metrics = await fetchBoardAggregates(
        accessToken,
        boardId,
        config.column_mappings,
        config.aggregation_rules
      );
      boardMetrics.push(...metrics);
    } catch (err) {
      console.error(
        `[triggerManualPreview] Failed to fetch board ${boardId}:`,
        err
      );
      return {
        success: false,
        error: `Failed to fetch data for board ${boardId}. Please check your Monday.com connection.`,
      };
    }
  }

  // 4. Store the snapshot
  const snapshotPayload = {
    report_configuration_id: reportId,
    generated_at: new Date().toISOString(),
    metrics: boardMetrics,
    triggered_by: 'manual_preview',
  };

  const { data: snapshot, error: snapshotError } = await supabase
    .from('report_snapshots')
    .insert(snapshotPayload)
    .select()
    .single();

  if (snapshotError || !snapshot) {
    console.error('[triggerManualPreview] Snapshot insert error:', snapshotError);
    return {
      success: false,
      error: snapshotError?.message ?? 'Failed to save report snapshot.',
    };
  }

  // 5. Log the delivery attempt
  const deliveryPayload: Partial<DeliveryLog> = {
    report_configuration_id: reportId,
    snapshot_id: snapshot.id,
    sent_at: new Date().toISOString(),
    status: 'preview',
    recipients: config.recipients ?? [],
    error_message: null,
  };

  const { error: deliveryError } = await supabase
    .from('delivery_logs')
    .insert(deliveryPayload);

  if (deliveryError) {
    // Non-fatal — snapshot was saved, log the error but proceed
    console.warn('[triggerManualPreview] Delivery log insert error:', deliveryError);
  }

  revalidatePath(`/dashboard/${reportId}`);

  return { success: true, data: snapshot as ReportSnapshot };
}

// ---------------------------------------------------------------------------
// Fetch the most recent snapshot for a report
// ---------------------------------------------------------------------------

export async function getLatestSnapshot(
  reportId: string,
  userId: string
): Promise<ActionResult<ReportSnapshot>> {
  const supabase = createServerClient();

  // Verify ownership
  const { error: ownerError } = await supabase
    .from('report_configurations')
    .select('id')
    .eq('id', reportId)
    .eq('user_id', userId)
    .single();

  if (ownerError) {
    return { success: false, error: 'Report not found or access denied.' };
  }

  const { data, error } = await supabase
    .from('report_snapshots')
    .select('*')
    .eq('report_configuration_id', reportId)
    .order('generated_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('[getLatestSnapshot] Supabase error:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data: data as ReportSnapshot };
}

// ---------------------------------------------------------------------------
// Fetch delivery logs for a report (most recent N)
// ---------------------------------------------------------------------------

export async function getDeliveryLogs(
  reportId: string,
  userId: string,
  limit = 10
): Promise<ActionResult<DeliveryLog[]>> {
  const supabase = createServerClient();

  // Verify ownership
  const { error: ownerError } = await supabase
    .from('report_configurations')
    .select('id')
    .eq('id', reportId)
    .eq('user_id', userId)
    .single();

  if (ownerError) {
    return { success: false, error: 'Report not found or access denied.' };
  }

  const { data, error } = await supabase
    .from('delivery_logs')
    .select('*')
    .eq('report_configuration_id', reportId)
    .order('sent_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[getDeliveryLogs] Supabase error:', error);
    return { success: false, error: error.message };
  }

  return { success: true, data: data as DeliveryLog[] };
}

// ---------------------------------------------------------------------------
// Update report recipients
// ---------------------------------------------------------------------------

export async function updateReportRecipients(
  reportId: string,
  userId: string,
  recipients: string[]
): Promise<ActionResult> {
  const supabase = createServerClient();

  const { error } = await supabase
    .from('report_configurations')
    .update({ recipients, updated_at: new Date().toISOString() })
    .eq('id', reportId)
    .eq('user_id', userId);

  if (error) {
    console.error('[updateReportRecipients] Supabase error:', error);
    return { success: false, error: error.message };
  }

  revalidatePath(`/dashboard/${reportId}`);

  return { success: true };
}