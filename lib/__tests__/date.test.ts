import { describe, it, expect } from 'vitest';
import { parseLeaveDate, isValidDate, formatDate } from '../date';

describe('date utility', () => {
  describe('parseLeaveDate', () => {
    it('should parse full date', () => {
      expect(parseLeaveDate("2024-01-15")).toEqual({ date: "2024-01-15", type: "FULL" });
    });

    it('should parse AM date', () => {
      expect(parseLeaveDate("2024-01-15 (AM)")).toEqual({ date: "2024-01-15", type: "AM" });
    });

    it('should parse PM date', () => {
      expect(parseLeaveDate("2024-01-15 (PM)")).toEqual({ date: "2024-01-15", type: "PM" });
    });
  });

  describe('isValidDate', () => {
    it('should return true for valid date', () => {
      expect(isValidDate("2024-01-15")).toBe(true);
    });

    it('should return false for invalid date string', () => {
      expect(isValidDate("invalid")).toBe(false);
    });

    it('should return false for non-existent date', () => {
      expect(isValidDate("2024-02-30")).toBe(false);
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      expect(formatDate("2024-01-15")).toBe("1/15(월)");
    });

    it('should format AM date correctly', () => {
      expect(formatDate("2024-01-15 (AM)")).toBe("1/15(월) AM");
    });
  });
});
