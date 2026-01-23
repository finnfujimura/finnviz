# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Live Demo**: https://finnfujimura.github.io/finnviz-studio/

## Commands

```bash
npm install     # Install dependencies
npm run dev     # Start development server (Vite)
npm run build   # TypeScript compile + Vite build
npm run lint    # Run ESLint
npm run preview # Preview production build
```

## Architecture

This is a drag-and-drop data visualization tool (similar to Tableau) built with React, TypeScript, and Vega-Lite.

### Data Flow

1. **Data loading**: `AppContext.tsx` loads `superstore.json` on mount (or user uploads CSV/XLSX/XLS) and runs field detection
2. **Field detection**: `fieldDetection.ts` analyzes data to infer field types (quantitative, nominal, ordinal, temporal)
   - Quantitative: Numeric fields with >20 unique values
   - Ordinal: Numeric fields with ≤20 unique values
   - Temporal: Date fields (detected via patterns or `Date.parse`)
   - Nominal: String fields
3. **Drag-and-drop**: `FieldPill` components are draggable; `EncodingShelf` components are drop targets
4. **Spec building**: When encodings change, `vegaSpecBuilder.ts` generates a Vega-Lite spec
5. **Rendering**: `ChartView` uses `vega-embed` to render the spec

### State Management

All app state lives in `AppContext.tsx` using `useReducer`. Key state:
- `data`: Raw JSON records
- `fields`: Detected field metadata (name, type, uniqueCount)
- `charts`: Array of `ChartConfig` objects (supports multi-chart dashboards)
- `activeChartId`: Currently selected chart
- `filters`: Array of `FilterConfig` objects (applies globally to all charts)
- `viewMode`: 'chart' or 'table' view
- `projects`: Saved project metadata
- `currentProjectId`: Currently loaded project

Each `ChartConfig` contains:
- `id`: Unique identifier
- `encodings`: Map of channel → `EncodingFieldConfig` (includes field, aggregate, timeUnit, sort)
- `markType`: Current mark type ('auto' or explicit type)
- `chartTitle`: Custom title or null for auto-generation
- `colorScheme`: Selected color scheme

Key actions:
- `ASSIGN_FIELD`, `REMOVE_FIELD`: Add/remove field from encoding channel
- `SET_AGGREGATE`, `SET_TIME_UNIT`, `SET_SORT`: Modify encoding properties
- `ADD_FILTER`, `UPDATE_FILTER`, `REMOVE_FILTER`, `CLEAR_FILTERS`: Manage data filters
- `SET_MARK_TYPE`, `SET_CHART_TITLE`, `SET_COLOR_SCHEME`: Override defaults
- `TOGGLE_FIELD_TYPE`: Switch between ordinal/nominal
- `RESET_FOR_NEW_DATA`: Clear state when loading new dataset
- `ADD_CHART`, `REMOVE_CHART`, `SET_ACTIVE_CHART`, `DUPLICATE_CHART`: Manage multiple charts
- `SAVE_PROJECT`, `LOAD_PROJECT`, `DELETE_PROJECT`: Project persistence
- `SET_VIEW_MODE`: Toggle between chart and table view

### Key Types (`src/types/index.ts`)

- `FieldType`: `'quantitative' | 'nominal' | 'ordinal' | 'temporal'`
- `AggregateType`: `'sum' | 'mean' | 'median' | 'min' | 'max' | 'count' | 'distinct' | null`
- `TimeUnit`: `'year' | 'quarter' | 'month' | 'week' | 'day' | 'yearmonth' | 'yearmonthdate' | null`
- `MarkType`: `'auto' | 'bar' | 'line' | 'point' | 'area' | 'rect' | 'circle' | 'tick'`
- `SortOrder`: `'ascending' | 'descending' | '-x' | '-y' | 'x' | 'y' | null`
- `EncodingChannel`: `'x' | 'y' | 'color' | 'size' | 'shape' | 'row' | 'column'`
- `ColorScheme`: 14 available color schemes from 'default' to 'midnight'
- `ViewMode`: `'chart' | 'table'`
- `DetectedField`: `{ name, type, uniqueCount }`
- `EncodingFieldConfig`: `{ field, aggregate, timeUnit, sort }`
- `ChartConfig`: `{ id, encodings, markType, chartTitle, colorScheme }`
- `FilterConfig`: `{ fieldName, fieldType, filterType, value }`
  - Range filters (quantitative): `{ min, max }`
  - Selection filters (nominal/ordinal): `{ selected[], available[] }`
  - Date range filters (temporal): `{ min, max }` (dates as strings)

### Vega-Lite Spec Building (`vegaSpecBuilder.ts`)

- `inferMark()`: Auto-selects mark type based on field types:
  - Quant × Quant → `point`
  - Nominal/Ordinal × Quant → `bar`
  - Temporal × Quant → `line`
  - Nominal × Nominal → `rect`
- `buildChannelEncoding()`: Creates encoding with field, type, aggregate, timeUnit, sort
- `buildFilterTransforms()`: Converts `FilterConfig[]` to Vega-Lite filter expressions
- `generateChartTitle()`: Auto-generates titles like "Average Sales by Region"
- `buildThemeConfig()`: Applies color scheme configurations (14 different themes)
- `buildVegaSpec()`: Assembles complete Vega-Lite TopLevelSpec with data, transforms, encodings, theming

### Component Structure

```
App.tsx
├── AppProvider (context)
└── AppContent
    ├── Header (with ProjectManager and file upload)
    ├── FieldList (left sidebar - collapsible)
    │   └── FieldPill (draggable field chips)
    ├── EncodingPanel (middle sidebar - collapsible)
    │   ├── EncodingShelf (drop zones for x/y/color/size/shape/row/column)
    │   │   └── Controls for aggregate, timeUnit, sort (per encoding)
    │   ├── Mark type selector
    │   ├── Color scheme selector
    │   └── Chart management (add/duplicate/remove)
    ├── ChartView (main area)
    │   └── Renders Vega chart via vega-embed or DataTableView
    └── FilterPanel (when filters are active)
        └── FilterRow (range/selection filters per field)
            ├── RangeFilter (for quantitative fields)
            └── SelectionFilter (for nominal/ordinal fields)
```

### File Upload

The app supports uploading custom datasets:
- CSV files (parsed via PapaParse)
- JSON files (must be an array of objects)
- Excel files (.xlsx, .xls) via the xlsx library
- `fileParsers.ts` handles all parsing logic with 10MB file size limit and 100K row limit
- Parsed data is passed to `loadData()` which resets state and re-runs field detection

### Project Persistence (`persistence.ts`)

Uses `localStorage` for saving/loading projects:
- `saveProject()`: Saves chart configurations, filters, and metadata
- `getProject()`: Loads a saved project by ID
- `deleteProject()`: Removes a project
- `saveLastSession()`: Auto-saves current session
- `getLastSession()`: Restores last session on app load
- Storage keys: `finnviz_project_{id}`, `finnviz_projects_metadata`, `finnviz_last_session`

### Multi-Chart Support

The app supports creating multiple charts from the same dataset:
- Users can add, duplicate, and remove charts
- Each chart has independent encodings, mark type, title, and color scheme
- Filters are global and apply to all charts
- Active chart is tracked via `activeChartId`
- Chart actions default to operating on the active chart

### Styling

Uses CSS custom properties defined in global styles. Key color variables:
- `--color-quantitative`, `--color-nominal`, `--color-ordinal`, `--color-temporal` for field type colors
- `--color-bg-primary`, `--color-bg-secondary`, `--color-bg-tertiary` for backgrounds
- `--color-text-primary`, `--color-text-secondary`, `--color-text-muted` for text
- `--color-accent` for primary interactive elements
- Inline styles throughout (no CSS modules or styled-components)
