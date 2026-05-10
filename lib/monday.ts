lib/monday.ts
import { MondayBoard } from "@/types";

const MONDAY_API_URL = "https://api.monday.com/v2";

interface MondayColumn {
  id: string;
  title: string;
  type: string;
}

interface MondayColumnValue {
  id: string;
  text: string;
  value: string;
}

interface MondayItem {
  id: string;
  name: string;
  column_values: MondayColumnValue[];
}

interface MondayBoardRaw {
  id: string;
  name: string;
  columns: MondayColumn[];
  items_page: {
    items: MondayItem[];
  };
}

interface GraphQLResponse<T> {
  data: T;
  errors?: { message: string }[];
}

async function mondayQuery<T>(
  token: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const response = await fetch(MONDAY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
      "API-Version": "2023-10",
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Monday.com API request failed with status ${response.status}`);
  }

  const json: GraphQLResponse<T> = await response.json();

  if (json.errors && json.errors.length > 0) {
    throw new Error(`Monday.com GraphQL error: ${json.errors.map((e) => e.message).join(", ")}`);
  }

  return json.data;
}

export async function fetchBoards(token: string): Promise<MondayBoard[]> {
  const query = `
    query {
      boards(limit: 50, order_by: created_at) {
        id
        name
        columns {
          id
          title
          type
        }
      }
    }
  `;

  const data = await mondayQuery<{ boards: { id: string; name: string; columns: MondayColumn[] }[] }>(
    token,
    query
  );

  return data.boards.map((board) => ({
    id: board.id,
    name: board.name,
    columns: board.columns.map((col) => ({
      id: col.id,
      title: col.title,
      type: col.type,
    })),
  }));
}

export async function fetchBoardById(
  token: string,
  boardId: string
): Promise<MondayBoardRaw | null> {
  const query = `
    query($boardId: [ID!]) {
      boards(ids: $boardId) {
        id
        name
        columns {
          id
          title
          type
        }
        items_page(limit: 500) {
          items {
            id
            name
            column_values {
              id
              text
              value
            }
          }
        }
      }
    }
  `;

  const data = await mondayQuery<{ boards: MondayBoardRaw[] }>(token, query, {
    boardId: [boardId],
  });

  if (!data.boards || data.boards.length === 0) {
    return null;
  }

  return data.boards[0];
}

export type AggregationType = "sum" | "average" | "count" | "min" | "max";

export interface ColumnAggregationRule {
  columnId: string;
  columnTitle: string;
  aggregation: AggregationType;
}

export interface BoardAggregationResult {
  boardId: string;
  boardName: string;
  metrics: Record<string, number | string>;
  itemCount: number;
}

function parseNumeric(text: string): number | null {
  if (!text || text.trim() === "") return null;
  const cleaned = text.replace(/[^0-9.\-]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

function aggregateValues(values: number[], aggregation: AggregationType): number {
  if (values.length === 0) return 0;

  switch (aggregation) {
    case "sum":
      return values.reduce((acc, val) => acc + val, 0);
    case "average":
      return values.reduce((acc, val) => acc + val, 0) / values.length;
    case "count":
      return values.length;
    case "min":
      return Math.min(...values);
    case "max":
      return Math.max(...values);
    default:
      return 0;
  }
}

export async function aggregateBoardData(
  token: string,
  boardId: string,
  rules: ColumnAggregationRule[]
): Promise<BoardAggregationResult | null> {
  const board = await fetchBoardById(token, boardId);

  if (!board) return null;

  const items = board.items_page?.items ?? [];
  const metrics: Record<string, number | string> = {};

  for (const rule of rules) {
    if (rule.aggregation === "count") {
      metrics[rule.columnTitle] = items.length;
      continue;
    }

    const numericValues: number[] = [];

    for (const item of items) {
      const colValue = item.column_values.find((cv) => cv.id === rule.columnId);
      if (colValue) {
        const numeric = parseNumeric(colValue.text);
        if (numeric !== null) {
          numericValues.push(numeric);
        }
      }
    }

    const result = aggregateValues(numericValues, rule.aggregation);
    metrics[rule.columnTitle] =
      rule.aggregation === "average"
        ? Math.round(result * 100) / 100
        : result;
  }

  return {
    boardId: board.id,
    boardName: board.name,
    metrics,
    itemCount: items.length,
  };
}

export async function aggregateMultipleBoards(
  token: string,
  boardIds: string[],
  rulesByBoard: Record<string, ColumnAggregationRule[]>
): Promise<BoardAggregationResult[]> {
  const results: BoardAggregationResult[] = [];

  for (const boardId of boardIds) {
    const rules = rulesByBoard[boardId] ?? [];
    try {
      const result = await aggregateBoardData(token, boardId, rules);
      if (result) {
        results.push(result);
      }
    } catch (error) {
      console.error(`Failed to aggregate board ${boardId}:`, error);
    }
  }

  return results;
}

export async function fetchBoardColumns(
  token: string,
  boardId: string
): Promise<MondayColumn[]> {
  const query = `
    query($boardId: [ID!]) {
      boards(ids: $boardId) {
        columns {
          id
          title
          type
        }
      }
    }
  `;

  const data = await mondayQuery<{ boards: { columns: MondayColumn[] }[] }>(
    token,
    query,
    { boardId: [boardId] }
  );

  if (!data.boards || data.boards.length === 0) return [];

  return data.boards[0].columns;
}