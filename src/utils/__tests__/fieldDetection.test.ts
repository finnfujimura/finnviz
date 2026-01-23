import { describe, it, expect } from 'vitest';
import { detectFieldType, detectAllFields } from '../fieldDetection';

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
});
