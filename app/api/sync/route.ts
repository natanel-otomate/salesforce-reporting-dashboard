app/api/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import {
  fetchWorkspaces,
  fetchBoardsByWorkspace,
  fetchItemsByBoard,
} from "@/lib/monday";
import type { Board, Item, SyncLog } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = createServerClient();

  // Authenticate the request — expect Authorization: Bearer <supabase_access_token>
  const authHeader = req.headers.get("authorization") ?? "";
  const accessToken = authHeader.replace("Bearer ", "").trim();

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(accessToken);

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch the user's Monday.com token from the profiles table
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("monday_token")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.monday_token) {
    return NextResponse.json(
      { error: "Monday.com token not configured" },
      { status: 400 }
    );
  }

  const mondayToken: string = profile.monday_token;

  const syncStartedAt = new Date().toISOString();
  let syncStatus: "success" | "error" = "success";
  let syncError: string | null = null;
  let boardsSynced = 0;
  let itemsSynced = 0;

  try {
    // 1. Fetch all workspaces
    const workspaces = await fetchWorkspaces(mondayToken);

    for (const workspace of workspaces) {
      // 2. Upsert workspace
      const { error: wsError } = await supabase.from("workspaces").upsert(
        {
          id: workspace.id,
          user_id: user.id,
          name: workspace.name,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

      if (wsError) {
        console.error(`Workspace upsert error for ${workspace.id}:`, wsError);
        continue;
      }

      // 3. Fetch boards for this workspace
      const boards = await fetchBoardsByWorkspace(mondayToken, workspace.id);

      for (const board of boards) {
        // 4. Fetch items for this board
        let items: Item[] = [];
        try {
          items = await fetchItemsByBoard(mondayToken, board.id);
        } catch (itemErr) {
          console.error(`Failed to fetch items for board ${board.id}:`, itemErr);
        }

        const totalItems = items.length;
        const completedItems = items.filter(
          (item) => item.status?.toLowerCase() === "done" ||
            item.status?.toLowerCase() === "complete" ||
            item.status?.toLowerCase() === "completed"
        ).length;
        const overdueItems = items.filter((item) => {
          if (!item.due_date) return false;
          const due = new Date(item.due_date);
          const now = new Date();
          const isDone =
            item.status?.toLowerCase() === "done" ||
            item.status?.toLowerCase() === "complete" ||
            item.status?.toLowerCase() === "completed";
          return !isDone && due < now;
        }).length;

        // 5. Upsert board
        const boardRow = {
          id: board.id,
          user_id: user.id,
          workspace_id: workspace.id,
          name: board.name,
          total_items: totalItems,
          completed_items: completedItems,
          overdue_items: overdueItems,
          updated_at: new Date().toISOString(),
        };

        const { error: boardError } = await supabase
          .from("boards")
          .upsert(boardRow, { onConflict: "id" });

        if (boardError) {
          console.error(`Board upsert error for ${board.id}:`, boardError);
          continue;
        }

        boardsSynced += 1;

        // 6. Upsert items
        if (items.length > 0) {
          const itemRows = items.map((item) => ({
            id: item.id,
            board_id: board.id,
            user_id: user.id,
            name: item.name,
            status: item.status ?? null,
            due_date: item.due_date ?? null,
            assignee: item.assignee ?? null,
            updated_at: new Date().toISOString(),
          }));

          const { error: itemsError } = await supabase
            .from("items")
            .upsert(itemRows, { onConflict: "id" });

          if (itemsError) {
            console.error(`Items upsert error for board ${board.id}:`, itemsError);
          } else {
            itemsSynced += items.length;
          }
        }
      }
    }
  } catch (err: unknown) {
    syncStatus = "error";
    syncError =
      err instanceof Error ? err.message : "Unknown error during sync";
    console.error("Sync failed:", syncError);
  }

  // 7. Write sync log
  const syncLog: Omit<SyncLog, "id"> = {
    user_id: user.id,
    status: syncStatus,
    error_message: syncError,
    boards_synced: boardsSynced,
    items_synced: itemsSynced,
    started_at: syncStartedAt,
    finished_at: new Date().toISOString(),
  };

  const { error: logError } = await supabase.from("sync_logs").insert(syncLog);

  if (logError) {
    console.error("Failed to write sync log:", logError);
  }

  if (syncStatus === "error") {
    return NextResponse.json(
      {
        success: false,
        error: syncError,
        boards_synced: boardsSynced,
        items_synced: itemsSynced,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    boards_synced: boardsSynced,
    items_synced: itemsSynced,
    synced_at: syncLog.finished_at,
  });
}