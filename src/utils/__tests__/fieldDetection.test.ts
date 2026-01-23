import { describe, it, expect } from 'vitest';
import { detectFieldType } from '../fieldDetection';

describe('fieldDetection', () => {
  describe('detectFieldType', () => {
    it('should be defined', () => {
      expect(detectFieldType).toBeDefined();
    });
  });
});
