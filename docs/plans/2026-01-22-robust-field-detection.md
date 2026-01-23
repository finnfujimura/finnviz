# Robust Field Detection Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve field type detection to accurately classify data according to Vega-Lite specifications, with special handling for numeric IDs and stricter date validation.

**Architecture:** Replace the current loose detection logic with a multi-stage classifier that checks field names for patterns (IDs, codes), validates dates strictly without Date.parse(), and distinguishes quantitative numbers from categorical numbers using statistical heuristics.

**Tech Stack:** TypeScript, Vitest (testing), existing React/Vega-Lite stack

---

## Task 1: Set Up Vitest Testing Framework

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/utils/__tests__/fieldDetection.test.ts`

**Step 1: Install Vitest dependencies**

```bash
npm install -D vitest @vitest/ui
```

Expected: Dependencies installed successfully

**Step 2: Add test script to package.json**

Modify `package.json` to add test scripts in the "scripts" section:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest --coverage"
}
```

**Step 3: Create Vitest configuration**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
```

**Step 4: Create test file structure**

Create `src/utils/__tests__/fieldDetection.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { detectFieldType, detectAllFields } from '../fieldDetection';

describe('fieldDetection', () => {
  describe('detectFieldType', () => {
    it('should be defined', () => {
      expect(detectFieldType).toBeDefined();
    });
  });
});
```

**Step 5: Run tests to verify setup**

```bash
npm test
```

Expected: Tests pass with "1 passed"

**Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/utils/__tests__/fieldDetection.test.ts
git commit -m "test: add Vitest testing framework"
```

---

## Task 2: Write Tests for Temporal Field Detection

**Files:**
- Modify: `src/utils/__tests__/fieldDetection.test.ts`

**Step 1: Add failing tests for temporal detection**

Add to `src/utils/__tests__/fieldDetection.test.ts`:

```typescript
describe('detectFieldType - temporal', () => {
  it('should detect ISO date strings as temporal', () => {
    const values = ['2023-01-15', '2023-02-20', '2023-03-10'];
    expect(detectFieldType(values)).toBe('temporal');
  });

  it('should detect ISO datetime strings as temporal', () => {
    const values = ['2023-01-15T10:30:00', '2023-02-20T14:45:00'];
    expect(detectFieldType(values)).toBe('temporal');
  });

  it('should detect MM/DD/YYYY format as temporal', () => {
    const values = ['01/15/2023', '02/20/2023', '03/10/2023'];
    expect(detectFieldType(values)).toBe('temporal');
  });

  it('should NOT detect numeric IDs as temporal (common bug)', () => {
    const values = [1001, 1002, 1003, 1004, 1005];
    expect(detectFieldType(values)).not.toBe('temporal');
  });

  it('should NOT detect year-like numbers as temporal', () => {
    const values = [2020, 2021, 2022, 2023, 2024];
    expect(detectFieldType(values)).not.toBe('temporal');
  });

  it('should require 80% of values to match date patterns', () => {
    const values = ['2023-01-15', '2023-02-20', 'not-a-date', 'also-not'];
    expect(detectFieldType(values)).not.toBe('temporal');
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npm test fieldDetection.test.ts
```

Expected: Multiple failures - some tests may pass accidentally, but numeric ID test should fail

**Step 3: Commit failing tests**

```bash
git add src/utils/__tests__/fieldDetection.test.ts
git commit -m "test: add temporal field detection test cases"
```

---

## Task 3: Write Tests for Nominal Field Detection (IDs)

**Files:**
- Modify: `src/utils/__tests__/fieldDetection.test.ts`

**Step 1: Add tests for ID field detection**

Add to `src/utils/__tests__/fieldDetection.test.ts`:

```typescript
describe('detectFieldType - nominal (IDs and categories)', () => {
  it('should detect string categories as nominal', () => {
    const values = ['Red', 'Blue', 'Green', 'Yellow'];
    expect(detectFieldType(values)).toBe('nominal');
  });

  it('should detect numeric IDs as nominal when sequential', () => {
    const values = [1001, 1002, 1003, 1004, 1005];
    expect(detectFieldType(values)).toBe('nominal');
  });

  it('should detect large integers as nominal (likely IDs)', () => {
    const values = [123456789, 123456790, 123456791];
    expect(detectFieldType(values)).toBe('nominal');
  });

  it('should handle mixed string IDs', () => {
    const values = ['CUST-001', 'CUST-002', 'CUST-003'];
    expect(detectFieldType(values)).toBe('nominal');
  });

  it('should detect high-cardinality unique values as nominal', () => {
    const values = Array.from({ length: 100 }, (_, i) => `ID-${i}`);
    expect(detectFieldType(values)).toBe('nominal');
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npm test fieldDetection.test.ts
```

Expected: Tests fail - current logic classifies numeric IDs as ordinal or quantitative

**Step 3: Commit failing tests**

```bash
git add src/utils/__tests__/fieldDetection.test.ts
git commit -m "test: add nominal/ID field detection test cases"
```

---

## Task 4: Write Tests for Quantitative Field Detection

**Files:**
- Modify: `src/utils/__tests__/fieldDetection.test.ts`

**Step 1: Add tests for quantitative detection**

Add to `src/utils/__tests__/fieldDetection.test.ts`:

```typescript
describe('detectFieldType - quantitative', () => {
  it('should detect continuous measurements as quantitative', () => {
    const values = [12.5, 18.3, 22.7, 15.9, 20.1];
    expect(detectFieldType(values)).toBe('quantitative');
  });

  it('should detect sales amounts as quantitative', () => {
    const values = [1523.45, 2847.22, 1032.88, 4521.00];
    expect(detectFieldType(values)).toBe('quantitative');
  });

  it('should detect large range integers as quantitative', () => {
    const values = [100, 500, 1200, 3400, 8900];
    expect(detectFieldType(values)).toBe('quantitative');
  });

  it('should handle high cardinality with varied values', () => {
    const values = Array.from({ length: 50 }, (_, i) => i * 7.3 + Math.random() * 10);
    expect(detectFieldType(values)).toBe('quantitative');
  });
});
```

**Step 2: Run tests**

```bash
npm test fieldDetection.test.ts
```

Expected: Some may pass, but distinction from ordinal/nominal needs work

**Step 3: Commit failing tests**

```bash
git add src/utils/__tests__/fieldDetection.test.ts
git commit -m "test: add quantitative field detection test cases"
```

---

## Task 5: Write Tests for Ordinal Field Detection

**Files:**
- Modify: `src/utils/__tests__/fieldDetection.test.ts`

**Step 1: Add tests for ordinal detection**

Add to `src/utils/__tests__/fieldDetection.test.ts`:

```typescript
describe('detectFieldType - ordinal', () => {
  it('should detect rating scales as ordinal', () => {
    const values = [1, 2, 3, 4, 5, 3, 4, 2, 5, 1];
    expect(detectFieldType(values)).toBe('ordinal');
  });

  it('should detect size categories as ordinal', () => {
    const values = ['Small', 'Medium', 'Large', 'Small', 'Medium'];
    expect(detectFieldType(values)).toBe('ordinal');
  });

  it('should detect priority levels as ordinal', () => {
    const values = ['Low', 'Medium', 'High', 'Critical'];
    expect(detectFieldType(values)).toBe('ordinal');
  });

  it('should detect small integer ranges as ordinal', () => {
    const values = [1, 2, 3, 1, 2, 3, 2, 1, 3];
    expect(detectFieldType(values)).toBe('ordinal');
  });
});
```

**Step 2: Run tests**

```bash
npm test fieldDetection.test.ts
```

Expected: Some tests may pass with current threshold logic

**Step 3: Commit failing tests**

```bash
git add src/utils/__tests__/fieldDetection.test.ts
git commit -m "test: add ordinal field detection test cases"
```

---

## Task 6: Write Tests for Edge Cases

**Files:**
- Modify: `src/utils/__tests__/fieldDetection.test.ts`

**Step 1: Add edge case tests**

Add to `src/utils/__tests__/fieldDetection.test.ts`:

```typescript
describe('detectFieldType - edge cases', () => {
  it('should handle empty arrays', () => {
    expect(detectFieldType([])).toBe('nominal');
  });

  it('should handle all null values', () => {
    const values = [null, null, null];
    expect(detectFieldType(values)).toBe('nominal');
  });

  it('should handle mixed nulls and values', () => {
    const values = [null, 'A', null, 'B', 'C'];
    expect(detectFieldType(values)).toBe('nominal');
  });

  it('should handle single value', () => {
    expect(detectFieldType([42])).toBe('quantitative');
  });

  it('should sample large datasets efficiently', () => {
    const values = Array.from({ length: 10000 }, (_, i) => i);
    const result = detectFieldType(values);
    expect(['quantitative', 'nominal']).toContain(result);
  });
});
```

**Step 2: Run tests**

```bash
npm test fieldDetection.test.ts
```

Expected: Some edge cases may fail

**Step 3: Commit failing tests**

```bash
git add src/utils/__tests__/fieldDetection.test.ts
git commit -m "test: add edge case tests for field detection"
```

---

## Task 7: Implement Strict Temporal Detection

**Files:**
- Modify: `src/utils/fieldDetection.ts`

**Step 1: Replace isTemporalField with stricter implementation**

Replace the `isTemporalField` function in `src/utils/fieldDetection.ts`:

```typescript
const DATE_PATTERNS = [
  /^\d{4}-\d{2}-\d{2}$/,                    // YYYY-MM-DD
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,  // ISO 8601 datetime
  /^\d{1,2}\/\d{1,2}\/\d{2,4}$/,            // MM/DD/YYYY or M/D/YY
  /^\d{1,2}-\d{1,2}-\d{2,4}$/,              // MM-DD-YYYY
];

function isTemporalField(values: unknown[]): boolean {
  const stringValues = values.filter((v): v is string => typeof v === 'string');

  // Temporal fields must be strings (not numbers that look like years)
  if (stringValues.length < values.length * 0.8) return false;

  const dateMatches = stringValues.filter((v) => {
    // STRICT: Only match explicit date patterns, no Date.parse()
    return DATE_PATTERNS.some((pattern) => pattern.test(v));
  });

  return dateMatches.length >= stringValues.length * 0.8;
}
```

**Step 2: Run temporal tests**

```bash
npm test -- -t "temporal"
```

Expected: Temporal tests should pass, numeric ID tests should not detect as temporal

**Step 3: Commit**

```bash
git add src/utils/fieldDetection.ts
git commit -m "feat: implement strict temporal field detection"
```

---

## Task 8: Implement ID Detection Heuristics

**Files:**
- Modify: `src/utils/fieldDetection.ts`

**Step 1: Add helper functions for ID detection**

Add before `detectFieldType` function in `src/utils/fieldDetection.ts`:

```typescript
// Common ID field name patterns
const ID_NAME_PATTERNS = [
  /^id$/i,
  /_id$/i,
  /^.*_id$/i,
  /^.*id$/i,
  /code$/i,
  /^key$/i,
  /^.*_key$/i,
];

function hasIdFieldName(fieldName: string): boolean {
  return ID_NAME_PATTERNS.some((pattern) => pattern.test(fieldName));
}

function looksLikeId(values: unknown[]): boolean {
  const numericValues = values.filter((v): v is number => typeof v === 'number');
  if (numericValues.length !== values.length) return false;

  // Check if all integers
  const allIntegers = numericValues.every((v) => Number.isInteger(v));
  if (!allIntegers) return false;

  // Check if values are very large (likely IDs, not meaningful quantities)
  const avgValue = numericValues.reduce((sum, v) => sum + v, 0) / numericValues.length;
  if (avgValue > 1000) return true;

  // Check if values are sequential or nearly sequential (ID pattern)
  const sorted = [...numericValues].sort((a, b) => a - b);
  let gaps = 0;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] === 1) gaps++;
  }
  const sequentialRatio = gaps / (sorted.length - 1);
  if (sequentialRatio > 0.7) return true;

  return false;
}
```

**Step 2: Update detectFieldType signature to accept field name**

Modify `detectFieldType` signature and update `detectAllFields`:

```typescript
export function detectFieldType(values: unknown[], fieldName?: string): FieldType {
  const nonNullValues = values.filter((v) => v !== null && v !== undefined && v !== '');

  if (nonNullValues.length === 0) return 'nominal';

  const sample = nonNullValues.slice(0, 100);
  const uniqueValues = new Set(sample);
  const uniqueCount = uniqueValues.size;

  // Check for temporal fields first
  if (isTemporalField(sample)) {
    return 'temporal';
  }

  const numericValues = sample.filter(
    (v) => typeof v === 'number' || (typeof v === 'string' && !isNaN(Number(v)))
  );
  const isNumeric = numericValues.length === sample.length;

  if (isNumeric) {
    // Check if field name suggests it's an ID
    if (fieldName && hasIdFieldName(fieldName)) {
      return 'nominal';
    }

    // Check if values look like IDs
    if (looksLikeId(sample)) {
      return 'nominal';
    }

    // Distinguish ordinal from quantitative
    if (uniqueCount <= CATEGORICAL_THRESHOLD) {
      return 'ordinal';
    }
    return 'quantitative';
  }

  return 'nominal';
}

export function detectAllFields(data: Record<string, unknown>[]): DetectedField[] {
  if (data.length === 0) return [];

  const fieldNames = Object.keys(data[0]);

  return fieldNames.map((name) => {
    const values = data.map((row) => row[name]);
    const type = detectFieldType(values, name);
    const uniqueCount = new Set(values.filter((v) => v != null)).size;

    return {
      name,
      type,
      uniqueCount,
    };
  });
}
```

**Step 3: Run all tests**

```bash
npm test fieldDetection.test.ts
```

Expected: Most tests should pass now

**Step 4: Commit**

```bash
git add src/utils/fieldDetection.ts
git commit -m "feat: add ID detection heuristics for nominal classification"
```

---

## Task 9: Fix Remaining Test Failures

**Files:**
- Modify: `src/utils/fieldDetection.ts`
- Modify: `src/utils/__tests__/fieldDetection.test.ts`

**Step 1: Run tests and identify failures**

```bash
npm test fieldDetection.test.ts
```

Expected: Review output for any remaining failures

**Step 2: Adjust detection logic as needed**

Based on test failures, fine-tune thresholds or logic. Common adjustments:

- Adjust `CATEGORICAL_THRESHOLD` if ordinal/quantitative distinction is wrong
- Add more ID name patterns if needed
- Adjust sequential ratio threshold in `looksLikeId`

**Step 3: Update tests if expectations were wrong**

If a test expectation doesn't align with Vega-Lite spec, update the test.

**Step 4: Re-run tests until all pass**

```bash
npm test fieldDetection.test.ts
```

Expected: All tests pass

**Step 5: Commit**

```bash
git add src/utils/fieldDetection.ts src/utils/__tests__/fieldDetection.test.ts
git commit -m "fix: tune field detection logic to pass all tests"
```

---

## Task 10: Add Integration Test with Real Data

**Files:**
- Modify: `src/utils/__tests__/fieldDetection.test.ts`

**Step 1: Add integration test with realistic dataset**

Add to `src/utils/__tests__/fieldDetection.test.ts`:

```typescript
describe('detectAllFields - integration', () => {
  it('should correctly classify a realistic dataset', () => {
    const data = [
      { customer_id: 1001, order_date: '2023-01-15', amount: 125.50, status: 'Completed', rating: 5 },
      { customer_id: 1002, order_date: '2023-01-16', amount: 89.99, status: 'Pending', rating: 4 },
      { customer_id: 1003, order_date: '2023-01-17', amount: 210.00, status: 'Completed', rating: 5 },
      { customer_id: 1004, order_date: '2023-01-18', amount: 45.25, status: 'Cancelled', rating: 2 },
    ];

    const fields = detectAllFields(data);

    expect(fields.find(f => f.name === 'customer_id')?.type).toBe('nominal');
    expect(fields.find(f => f.name === 'order_date')?.type).toBe('temporal');
    expect(fields.find(f => f.name === 'amount')?.type).toBe('quantitative');
    expect(fields.find(f => f.name === 'status')?.type).toBe('nominal');
    expect(fields.find(f => f.name === 'rating')?.type).toBe('ordinal');
  });
});
```

**Step 2: Run integration test**

```bash
npm test -- -t "integration"
```

Expected: Integration test passes

**Step 3: Commit**

```bash
git add src/utils/__tests__/fieldDetection.test.ts
git commit -m "test: add integration test with realistic dataset"
```

---

## Task 11: Update Documentation

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Update field detection section in CLAUDE.md**

Update the "Field detection" section in `CLAUDE.md`:

```markdown
2. **Field detection**: `fieldDetection.ts` analyzes data to infer field types (quantitative, nominal, ordinal, temporal)
   - **Quantitative**: Numbers expressing magnitude (continuous measurements, amounts, etc.)
   - **Ordinal**: Ranked categorical data (ratings, size categories, priority levels)
   - **Temporal**: Date/time values matching strict ISO 8601 or common date patterns
   - **Nominal**: Categories and identifiers (text, or numbers detected as IDs)
   - **ID Detection**: Numeric fields are classified as nominal if:
     - Field name matches ID patterns (ends with `_id`, `id`, `code`, `key`)
     - Values are sequential integers or large ID-like numbers
     - High cardinality with unique values
   - **Strict Date Validation**: Only explicit date patterns are recognized (no loose Date.parse())
```

**Step 2: Commit documentation**

```bash
git add CLAUDE.md
git commit -m "docs: update field detection documentation"
```

---

## Task 12: Manual Testing

**Step 1: Start dev server**

```bash
npm run dev
```

**Step 2: Test with sample datasets**

1. Upload a CSV with customer IDs (numeric)
2. Upload a CSV with dates in different formats
3. Upload a CSV with ratings (1-5)
4. Verify field types are correctly detected

**Step 3: Test with existing superstore.json**

Open the app and verify that existing data still works correctly.

**Step 4: Document any issues**

If issues found, create additional test cases and fix.

---

## Task 13: Final Commit and Cleanup

**Step 1: Run full test suite**

```bash
npm test
```

Expected: All tests pass

**Step 2: Run linter**

```bash
npm run lint
```

Expected: No errors

**Step 3: Create final commit**

```bash
git add -A
git commit -m "feat: implement robust field detection with Vega-Lite alignment

- Add Vitest testing framework
- Implement strict temporal detection (no loose Date.parse)
- Add ID detection heuristics (field names + statistical analysis)
- Improve quantitative vs ordinal vs nominal classification
- Add comprehensive test coverage for all field types
- Update documentation with new detection rules"
```

---

## Success Criteria

- [ ] All tests pass with >90% coverage on fieldDetection.ts
- [ ] Numeric IDs are correctly classified as nominal
- [ ] Date fields are strictly validated
- [ ] Ordinal/quantitative distinction works for common cases
- [ ] No regressions on existing datasets
- [ ] Documentation updated
