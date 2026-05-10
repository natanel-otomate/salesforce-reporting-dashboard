import { Board, Item, Workspace } from '@/types';

const MONDAY_API_URL = 'https://api.monday.com/v2';

interface MondayGraphQLResponse<T> {
  data: T;
  errors?: Array<{ message: string; locations?: unknown }>;
  account_id?: number;
}

interface WorkspacesData {
  workspaces: Array<{
    id: string;
    name: string;
    kind: string;
    description: string | null;
  }>;
}

interface BoardsData {
  boards: Array<{
    id: string;
    name: string;
    description: string | null;
    state: string;
    workspace: {
      id: string;
      name: string;
    } | null;
    items_count: number;
    groups: Array<{
      id: string;
      title: string;
    }>;
    columns: Array<{
      id: string;
      title: string;
      type: string;
    }>;
  }>;
}

interface ItemsData {
  boards: Array<{
    items_page: {
      cursor: string | null;
      items: Array<{
        id: string;
        name: string;
        state: string;
        created_at: string;
        updated_at: string;
        group: {
          id: string;
          title: string;
        };
        column_values: Array<{
          id: string;
          type: string;
          text: string;
          value: string | null;
        }>;
      }>;
    };
  }>;
}

async function mondayRequest<T>(
  token: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const response = await fetch(MONDAY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
      'API-Version': '2024-01',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(
      `Monday.com API request failed: ${response.status} ${response.statusText}`
    );
  }

  const json: MondayGraphQLResponse<T> = await response.json();

  if (json.errors && json.errors.length > 0) {
    const messages = json.errors.map((e) => e.message).join('; ');
    throw new Error(`Monday.com GraphQL errors: ${messages}`);
  }

  return json.data;
}

export async function fetchWorkspaces(token: string): Promise<Workspace[]> {
  const query = `
    query GetWorkspaces {
      workspaces {
        id
        name
        kind
        description
      }
    }
  `;

  const data = await mondayRequest<WorkspacesData>(token, query);

  return data.workspaces.map((ws) => ({
    id: ws.id,
    name: ws.name,
    kind: ws.kind,
    description: ws.description ?? '',
    monday_workspace_id: ws.id,
    user_id: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
}

export async function fetchBoards(
  token: string,
  workspaceIds?: string[]
): Promise<
  Array<{
    monday_board_id: string;
    name: string;
    description: string;
    state: string;
    workspace_monday_id: string | null;
    workspace_name: string | null;
    items_count: number;
    columns: Array<{ id: string; title: string; type: string }>;
  }>
> {
  const query = `
    query GetBoards($workspaceIds: [ID]) {
      boards(workspace_ids: $workspaceIds, limit: 200, order_by: created_at) {
        id
        name
        description
        state
        workspace {
          id
          name
        }
        items_count
        groups {
          id
          title
        }
        columns {
          id
          title
          type
        }
      }
    }
  `;

  const variables: Record<string, unknown> = {};
  if (workspaceIds && workspaceIds.length > 0) {
    variables.workspaceIds = workspaceIds;
  }

  const data = await mondayRequest<BoardsData>(token, query, variables);

  return data.boards.map((board) => ({
    monday_board_id: board.id,
    name: board.name,
    description: board.description ?? '',
    state: board.state,
    workspace_monday_id: board.workspace?.id ?? null,
    workspace_name: board.workspace?.name ?? null,
    items_count: board.items_count,
    columns: board.columns,
  }));
}

interface RawItem {
  monday_item_id: string;
  monday_board_id: string;
  name: string;
  state: string;
  group_id: string;
  group_title: string;
  created_at: string;
  updated_at: string;
  column_values: Array<{
    id: string;
    type: string;
    text: string;
    value: string | null;
  }>;
  is_completed: boolean;
  is_overdue: boolean;
}

function isItemCompleted(
  columnValues: Array<{ id: string; type: string; text: string; value: string | null }>,
  state: string
): boolean {
  if (state === 'archived' || state === 'deleted') return false;

  for (const col of columnValues) {
    if (col.type === 'color' || col.type === 'status') {
      const text = col.text?.toLowerCase() ?? '';
      if (
        text === 'done' ||
        text === 'complete' ||
        text === 'completed' ||
        text === 'closed' ||
        text === 'finished'
      ) {
        return true;
      }
      try {
        if (col.value) {
          const parsed = JSON.parse(col.value);
          const index = parsed?.index;
          if (index === 1 || index === 'done') return true;
        }
      } catch {
        // ignore parse errors
      }
    }
  }
  return false;
}

function isItemOverdue(
  columnValues: Array<{ id: string; type: string; text: string; value: string | null }>,
  isCompleted: boolean
): boolean {
  if (isCompleted) return false;

  const now = new Date();

  for (const col of columnValues) {
    if (col.type === 'date' && col.text) {
      try {
        const dueDate = new Date(col.text);
        if (!isNaN(dueDate.getTime()) && dueDate < now) {
          return true;
        }
      } catch {
        // ignore parse errors
      }
    }
    if (col.type === 'timeline' && col.value) {
      try {
        const parsed = JSON.parse(col.value);
        if (parsed?.to) {
          const endDate = new Date(parsed.to);
          if (!isNaN(endDate.getTime()) && endDate < now) {
            return true;
          }
        }
      } catch {
        // ignore parse errors
      }
    }
  }
  return false;
}

export async function fetchItemsForBoard(
  token: string,
  boardId: string
): Promise<RawItem[]> {
  const query = `
    query GetBoardItems($boardId: ID!, $cursor: String) {
      boards(ids: [$boardId]) {
        items_page(limit: 500, cursor: $cursor) {
          cursor
          items {
            id
            name
            state
            created_at
            updated_at
            group {
              id
              title
            }
            column_values {
              id
              type
              text
              value
            }
          }
        }
      }
    }
  `;

  const allItems: RawItem[] = [];
  let cursor: string | null = null;
  let hasMore = true;

  while (hasMore) {
    const variables: Record<string, unknown> = { boardId };
    if (cursor) {
      variables.cursor = cursor;
    }

    const data = await mondayRequest<ItemsData>(token, query, variables);

    const boardData = data.boards[0];
    if (!boardData) break;

    const page = boardData.items_page;
    const items = page.items ?? [];

    for (const item of items) {
      const completed = isItemCompleted(item.column_values, item.state);
      const overdue = isItemOverdue(item.column_values, completed);

      allItems.push({
        monday_item_id: item.id,
        monday_board_id: boardId,
        name: item.name,
        state: item.state,
        group_id: item.group?.id ?? '',
        group_title: item.group?.title ?? '',
        created_at: item.created_at,
        updated_at: item.updated_at,
        column_values: item.column_values,
        is_completed: completed,
        is_overdue: overdue,
      });
    }

    cursor = page.cursor;
    hasMore = !!cursor && items.length > 0;
  }

  return allItems;
}

export async function fetchAllBoardsAndItems(
  token: string
): Promise<{
  boards: Awaited<ReturnType<typeof fetchBoards>>;
  itemsByBoard: Record<string, RawItem[]>;
}> {
  const boards = await fetchBoards(token);
  const itemsByBoard: Record<string, RawItem[]> = {};

  const activeBoards = boards.filter((b) => b.state === 'active');

  await Promise.allSettled(
    activeBoards.map(async (board) => {
      try {
        const items = await fetchItemsForBoard(token, board.monday_board_id);
        itemsByBoard[board.monday_board_id] = items;
      } catch (err) {
        console.error(
          `Failed to fetch items for board ${board.monday_board_id}:`,
          err
        );
        itemsByBoard[board.monday_board_id] = [];
      }
    })
  );

  return { boards, itemsByBoard };
}

export async function validateMondayToken(token: string): Promise<boolean> {
  const query = `
    query ValidateToken {
      me {
        id
        name
        email
      }
    }
  `;

  try {
    await mondayRequest<{ me: { id: string; name: string; email: string } }>(
      token,
      query
    );
    return true;
  } catch {
    return false;
  }
}

export async function fetchMondayUserInfo(
  token: string
): Promise<{ id: string; name: string; email: string } | null> {
  const query = `
    query GetMe {
      me {
        id
        name
        email
      }
    }
  `;

  try {
    const data = await mondayRequest<{
      me: { id: string; name: string; email: string };
    }>(token, query);
    return data.me;
  } catch {
    return null;
  }
}