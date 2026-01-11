export type FieldType = 'quantitative' | 'nominal' | 'ordinal' | 'temporal';

export type AggregateType = 'sum' | 'mean' | 'median' | 'min' | 'max' | 'count' | 'distinct' | null;

export type TimeUnit = 'year' | 'quarter' | 'month' | 'week' | 'day' | 'yearmonth' | 'yearmonthdate' | null;

export type MarkType = 'auto' | 'bar' | 'line' | 'point' | 'area' | 'rect' | 'circle' | 'tick';

export type SortOrder = 'ascending' | 'descending' | '-x' | '-y' | 'x' | 'y' | null;

export type ViewMode = 'chart' | 'table';

// Filter types
export type FilterType = 'range' | 'selection' | 'date-range';

export interface RangeFilterValue {
  min: number | null;
  max: number | null;
}

export interface SelectionFilterValue {
  selected: string[];
  available: string[];
}

export interface DateRangeFilterValue {
  min: string | null;
  max: string | null;
}

export type FilterValue = RangeFilterValue | SelectionFilterValue | DateRangeFilterValue;

export interface FilterConfig {
  fieldName: string;
  fieldType: FieldType;
  filterType: FilterType;
  value: FilterValue;
}

export interface DetectedField {
  name: string;
  type: FieldType;
  uniqueCount: number;
}

export interface EncodingFieldConfig {
  field: DetectedField;
  aggregate: AggregateType;
  timeUnit: TimeUnit;
  sort: SortOrder;
}

export type EncodingChannel = 'x' | 'y' | 'color' | 'size' | 'shape' | 'row' | 'column';

export type EncodingState = {
  [K in EncodingChannel]?: EncodingFieldConfig;
};

export interface AppState {
  data: Record<string, unknown>[];
  fields: DetectedField[];
  encodings: EncodingState;
  filters: FilterConfig[];
  markType: MarkType;
  chartTitle: string | null; // null means auto-generate
  isLoading: boolean;
  error: string | null;
  projects: ProjectMetadata[];
  currentProjectId: string | null;
  viewMode: ViewMode;
}

export interface ProjectMetadata {
  id: string;
  name: string;
  updatedAt: number;
}

export interface SavedProject extends ProjectMetadata {
  encodings: EncodingState;
  filters: FilterConfig[];
  markType: MarkType;
  chartTitle: string | null;
}

export type AppAction =
  | { type: 'SET_DATA'; payload: Record<string, unknown>[] }
  | { type: 'SET_FIELDS'; payload: DetectedField[] }
  | { type: 'ASSIGN_FIELD'; channel: EncodingChannel; field: DetectedField }
  | { type: 'REMOVE_FIELD'; channel: EncodingChannel }
  | { type: 'SET_AGGREGATE'; channel: EncodingChannel; aggregate: AggregateType }
  | { type: 'SET_TIME_UNIT'; channel: EncodingChannel; timeUnit: TimeUnit }
  | { type: 'CLEAR_ALL' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'TOGGLE_FIELD_TYPE'; fieldName: string }
  | { type: 'RESET_FOR_NEW_DATA' }
  | { type: 'SET_MARK_TYPE'; markType: MarkType }
  | { type: 'SET_CHART_TITLE'; title: string | null }
  | { type: 'SET_SORT'; channel: EncodingChannel; sort: SortOrder }
  | { type: 'ADD_FILTER'; filter: FilterConfig }
  | { type: 'UPDATE_FILTER'; fieldName: string; value: FilterValue }
  | { type: 'REMOVE_FILTER'; fieldName: string }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'SAVE_PROJECT'; name: string; id: string; projects: ProjectMetadata[] }
  | { type: 'LOAD_PROJECT'; project: SavedProject }
  | { type: 'DELETE_PROJECT'; id: string }
  | { type: 'SET_PROJECTS'; projects: ProjectMetadata[] }
  | { type: 'SET_VIEW_MODE'; mode: ViewMode };

// File upload types
export interface FileUploadResult {
  data: Record<string, unknown>[];
  fileName: string;
  rowCount: number;
  fieldCount: number;
}

export type FileParseErrorType = 'PARSE_ERROR' | 'INVALID_FORMAT' | 'EMPTY_FILE' | 'TOO_LARGE';

export interface FileParseError {
  type: FileParseErrorType;
  message: string;
  details?: string;
}

export type SupportedFileType = 'csv' | 'json' | 'xlsx' | 'xls';
