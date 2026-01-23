import { describe, it, expect } from 'vitest';
import { detectFieldType } from '../fieldDetection';

describe('fieldDetection', () => {
  describe('detectFieldType', () => {
    it('should be defined', () => {
      expect(detectFieldType).toBeDefined();
    });
  });

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
});
