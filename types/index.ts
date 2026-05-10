export type MondayBoard = {
  id: string;
  name: string;
  columns: MondayColumn[];
};

export type MondayColumn = {
  id: string;
  title: string;
  type: string;
};

export type ColumnMapping = {
  columnId: string;
  columnTitle: string;
  columnType: string;
  aggregation: "sum" | "average" | "count" | "min" | "max";
  label: string;
};

export type BoardConfig = {
  boardId: string;
  boardName: string;
  columnMappings: ColumnMapping[];
};

export type ReportSchedule = {
  frequency: "daily" | "weekly" | "monthly";
  dayOfWeek?: number;
  dayOfMonth?: number;
  hour: number;
  timezone: string;
};

export type ReportConfiguration = {
  id: string;
  userId: string;
  name: string;
  boardConfigs: BoardConfig[];
  schedule: ReportSchedule;
  recipients: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastSentAt: string | null;
};

export type ReportBoardMetric = {
  boardId: string;
  boardName: string;
  metrics: {
    label: string;
    columnId: string;
    columnTitle: string;
    aggregation: ColumnMapping["aggregation"];
    value: number | string;
  }[];
};

export type ReportSnapshot = {
  id: string;
  reportConfigurationId: string;
  generatedAt: string;
  boardMetrics: ReportBoardMetric[];
  recipientCount: number;
};

export type DeliveryLog = {
  id: string;
  reportConfigurationId: string;
  reportSnapshotId: string;
  deliveredAt: string;
  status: "success" | "failure" | "pending";
  errorMessage: string | null;
  recipients: string[];
  snapshot: ReportSnapshot | null;
};

export type CreateReportConfigurationInput = {
  name: string;
  boardConfigs: BoardConfig[];
  schedule: ReportSchedule;
  recipients: string[];
};

export type UpdateReportActiveStateInput = {
  reportId: string;
  isActive: boolean;
};