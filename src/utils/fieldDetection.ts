import type { FieldType, DetectedField } from '../types';

const CATEGORICAL_THRESHOLD = 20;

// Common ordinal string patterns (case-insensitive)
const ORDINAL_STRING_PATTERNS = [
  // Size categories
  /^(x{0,3}[sml]|small|medium|large|x+large)$/i,
  // Priority levels
  /^(low|medium|high|critical|urgent)$/i,
  // Quality levels
  /^(poor|fair|good|excellent|outstanding)$/i,
  // Agreement scales
  /^(strongly\s*disagree|disagree|neutral|agree|strongly\s*agree)$/i,
];

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

  // Check if values are sequential or nearly sequential (ID pattern)
  const sorted = [...numericValues].sort((a, b) => a - b);
  let gaps = 0;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] === 1) gaps++;
  }
  const sequentialRatio = gaps / (sorted.length - 1);
  if (sequentialRatio > 0.7) return true;

  // Check if values are very large AND sequential-ish (likely IDs, not meaningful quantities)
  const avgValue = numericValues.reduce((sum, v) => sum + v, 0) / numericValues.length;
  if (avgValue > 10000 && sequentialRatio > 0.3) return true;

  return false;
}

function isOrdinalString(values: unknown[]): boolean {
  const stringValues = values.filter((v): v is string => typeof v === 'string');
  if (stringValues.length !== values.length) return false;

  const uniqueValues = new Set(stringValues);

  // Need at least 2 unique ordinal values to be meaningful
  if (uniqueValues.size < 2) return false;

  // Check if values match common ordinal patterns
  const matchingValues = stringValues.filter((v) =>
    ORDINAL_STRING_PATTERNS.some((pattern) => pattern.test(v))
  );

  // If most values match ordinal patterns, classify as ordinal
  return matchingValues.length >= stringValues.length * 0.5;
}

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

  // Check for ordinal strings before treating as nominal
  if (isOrdinalString(sample)) {
    return 'ordinal';
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

    // Convert string numbers to actual numbers for analysis
    const actualNumbers = numericValues.map((v) => typeof v === 'number' ? v : Number(v));

    // Check if any values have decimals (strong signal for quantitative)
    const hasDecimals = actualNumbers.some((v) => !Number.isInteger(v));

    // Calculate value range
    const min = Math.min(...actualNumbers);
    const max = Math.max(...actualNumbers);
    const range = max - min;

    // Heuristics to distinguish ordinal from quantitative:
    // 1. If has decimal values → quantitative
    // 2. If range is large (>100) → quantitative
    // 3. If only 1 unique value → quantitative (default for numbers)
    // 4. If few unique values AND small range → ordinal

    if (hasDecimals) {
      return 'quantitative';
    }

    if (range > 100) {
      return 'quantitative';
    }

    if (uniqueCount === 1) {
      return 'quantitative';
    }

    // Small number of unique values with small range → ordinal
    if (uniqueCount <= CATEGORICAL_THRESHOLD && range <= CATEGORICAL_THRESHOLD) {
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
