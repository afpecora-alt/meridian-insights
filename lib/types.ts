export type Deal = {
  deal_id: string;
  company_name: string;
  industry: string;
  rep_name: string;
  lead_source: string;
  product_line: string;
  deal_stage: string;
  deal_value: number;
  /** ISO date, yyyy-mm-dd */
  created_date: string;
  /** ISO date, yyyy-mm-dd */
  close_date: string;
  days_in_stage: number;
  last_activity_days_ago: number;
  probability_pct: number;
  competitor_mentioned: string;
  num_stakeholders: number;
  next_action: string;
};

export type Dataset = {
  name: string;
  uploadedAt: string;
  deals: Deal[];
};

export type Snapshot = Dataset & {
  id: string;
  createdAt: string;
};

export const REQUIRED_COLUMNS = [
  "deal_id",
  "company_name",
  "industry",
  "rep_name",
  "lead_source",
  "product_line",
  "deal_stage",
  "deal_value",
  "created_date",
  "close_date",
  "days_in_stage",
  "last_activity_days_ago",
  "probability_pct",
  "competitor_mentioned",
  "num_stakeholders",
  "next_action",
] as const;
