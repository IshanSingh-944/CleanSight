export type NavItem = 'overview' | 'upload' | 'history' | 'settings';

export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export interface DatasetFile {
  file: File;
  name: string;
  size: number;
  type: string;
  extension: string;
  uploadProgress: number;
  status: UploadStatus;
  errorMessage?: string;
  approved: boolean;
}

export interface ColumnProfile {
  name: string;
  inferred_type: string;
  non_null_count: number;
  missing_count: number;
  missing_percentage: number;
  unique_count: number;
  min_val?: number | null;
  max_val?: number | null;
  mean_val?: number | null;
  median_val?: number | null;
  sample_values: any[];
  detected_issue_count: number;
}

export interface DatasetProfile {
  dataset_id: string;
  filename: string;
  row_count: number;
  column_count: number;
  file_size_bytes: number;
  file_extension: string;
  total_missing_cells: number;
  missing_percentage: number;
  duplicate_row_count: number;
  constant_columns: string[];
  columns: ColumnProfile[];
  issue_count: number;
  risk_summary: {
    Low: number;
    Medium: number;
    High: number;
  };
  profiling_status: string;
}

export interface Recommendation {
  action_id: string;
  issue_type: string;
  column?: string | null;
  risk_level: 'Low' | 'Medium' | 'High';
  title: string;
  description: string;
  evidence: string;
  affected_rows: number;
  affected_percentage: number;
  proposed_action: string;
  rationale: string;
  alternatives: string[];
  confidence?: number;
  requires_approval: boolean;
  execution_status: 'pending' | 'approved' | 'rejected' | 'investigation';
}

export type ReviewFilter = 'all' | 'Low' | 'Medium' | 'High' | 'pending' | 'approved' | 'rejected';
