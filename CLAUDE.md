# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

1. **Data loading**: `AppContext.tsx` loads `cars.json` on mount and runs field detection
2. **Field detection**: `fieldDetection.ts` analyzes data to infer field types (quantitative, nominal, ordinal, temporal)
3. **Drag-and-drop**: `FieldPill` components are draggable; `EncodingShelf` components are drop targets
4. **Spec building**: When encodings change, `vegaSpecBuilder.ts` generates a Vega-Lite spec
5. **Rendering**: `ChartView` uses `vega-embed` to render the spec

### State Management

All app state lives in `AppContext.tsx` using `useReducer`. Key state:
- `data`: Raw JSON records
- `fields`: Detected field metadata (name, type, uniqueCount)
- `encodings`: Map of channel → field (e.g., `{ x: field, y: field, color: field }`)

Actions: `ASSIGN_FIELD`, `REMOVE_FIELD`, `CLEAR_ALL`, `TOGGLE_FIELD_TYPE`

### Key Types (`src/types/index.ts`)

- `FieldType`: `'quantitative' | 'nominal' | 'ordinal' | 'temporal'`
- `EncodingChannel`: `'x' | 'y' | 'color' | 'size' | 'shape' | 'row' | 'column'`
- `DetectedField`: `{ name, type, uniqueCount }`
- `EncodingState`: Partial record mapping channels to fields

### Vega-Lite Spec Building (`vegaSpecBuilder.ts`)

- `inferMark()`: Auto-selects mark type (point/bar/line/rect) based on field types on x/y
- `buildChannelEncoding()`: Creates encoding object with field name and type
- `buildVegaSpec()`: Assembles complete Vega-Lite TopLevelSpec

### Component Structure

```
App.tsx
├── AppProvider (context)
└── AppContent
    ├── FieldList (left sidebar)
    │   └── FieldPill (draggable field chips)
    ├── EncodingPanel (middle sidebar)
    │   └── EncodingShelf (drop zones for x/y/color/size/shape/row/column)
    └── ChartView (main area, renders Vega chart)
```

### Styling

Uses CSS custom properties defined in global styles. Key color variables:
- `--color-quantitative`, `--color-nominal`, `--color-ordinal`, `--color-temporal` for field type colors
- Inline styles throughout (no CSS modules or styled-components)
