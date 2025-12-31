import { describe, it, expect } from 'vitest';
import {
  calculateBMI,
  getBMICategory,
  calculateTotalChange,
  calculatePercentChange,
  calculateWeeklyAverage,
  calculateTreatmentWeek,
  calculateTreatmentDay,
  calculateToGoal,
  calculateGoalProgress,
  calculateWeightStats,
} from '../calculations';

describe('BMI Calculations', () => {
  describe('calculateBMI', () => {
    it('calculates BMI correctly', () => {
      // BMI = weight(kg) / height(m)^2
      expect(calculateBMI(70, 175)).toBeCloseTo(22.86, 1);
      expect(calculateBMI(92, 168)).toBeCloseTo(32.6, 1);
    });

    it('handles zero weight', () => {
      expect(calculateBMI(0, 175)).toBe(0);
    });

    it('throws for zero height', () => {
      expect(() => calculateBMI(70, 0)).toThrow('Height must be greater than 0');
    });

    it('throws for negative height', () => {
      expect(() => calculateBMI(70, -175)).toThrow('Height must be greater than 0');
    });

    it('throws for negative weight', () => {
      expect(() => calculateBMI(-70, 175)).toThrow('Weight cannot be negative');
    });
  });

  describe('getBMICategory', () => {
    it('returns Underweight for BMI < 18.5', () => {
      expect(getBMICategory(17)).toBe('Underweight');
      expect(getBMICategory(18.4)).toBe('Underweight');
    });

    it('returns Normal for BMI 18.5-24.9', () => {
      expect(getBMICategory(18.5)).toBe('Normal');
      expect(getBMICategory(22)).toBe('Normal');
      expect(getBMICategory(24.9)).toBe('Normal');
    });

    it('returns Overweight for BMI 25-29.9', () => {
      expect(getBMICategory(25)).toBe('Overweight');
      expect(getBMICategory(27)).toBe('Overweight');
      expect(getBMICategory(29.9)).toBe('Overweight');
    });

    it('returns Obese Class I for BMI 30-34.9', () => {
      expect(getBMICategory(30)).toBe('Obese Class I');
      expect(getBMICategory(32)).toBe('Obese Class I');
      expect(getBMICategory(34.9)).toBe('Obese Class I');
    });

    it('returns Obese Class II for BMI 35-39.9', () => {
      expect(getBMICategory(35)).toBe('Obese Class II');
      expect(getBMICategory(37)).toBe('Obese Class II');
    });

    it('returns Obese Class III for BMI >= 40', () => {
      expect(getBMICategory(40)).toBe('Obese Class III');
      expect(getBMICategory(42)).toBe('Obese Class III');
      expect(getBMICategory(50)).toBe('Obese Class III');
    });
  });
});

describe('Progress Calculations', () => {
  describe('calculateTotalChange', () => {
    it('calculates weight loss correctly', () => {
      expect(calculateTotalChange(100, 92)).toBe(-8);
    });

    it('calculates weight gain correctly', () => {
      expect(calculateTotalChange(80, 85)).toBe(5);
    });

    it('handles no change', () => {
      expect(calculateTotalChange(80, 80)).toBe(0);
    });
  });

  describe('calculatePercentChange', () => {
    it('calculates percentage loss correctly', () => {
      expect(calculatePercentChange(100, 92)).toBeCloseTo(-8, 1);
    });

    it('calculates percentage gain correctly', () => {
      expect(calculatePercentChange(100, 110)).toBeCloseTo(10, 1);
    });

    it('throws for zero starting weight', () => {
      expect(() => calculatePercentChange(0, 50)).toThrow('Starting weight must be greater than 0');
    });
  });

  describe('calculateWeeklyAverage', () => {
    it('calculates weekly average loss correctly', () => {
      // Lost 8kg over 8 weeks = 1kg/week
      expect(calculateWeeklyAverage(-8, 8)).toBe(-1);
      expect(calculateWeeklyAverage(-4, 4)).toBe(-1);
    });

    it('handles zero weeks', () => {
      expect(calculateWeeklyAverage(-8, 0)).toBe(0);
    });

    it('handles weight gain', () => {
      expect(calculateWeeklyAverage(4, 4)).toBe(1);
    });
  });

  describe('calculateToGoal', () => {
    it('calculates distance to goal correctly', () => {
      expect(calculateToGoal(92, 68)).toBe(24);
    });

    it('handles being at goal', () => {
      expect(calculateToGoal(68, 68)).toBe(0);
    });

    it('handles being below goal', () => {
      expect(calculateToGoal(65, 68)).toBe(-3);
    });
  });

  describe('calculateGoalProgress', () => {
    it('calculates progress percentage correctly', () => {
      // Start: 100, Current: 92, Goal: 80 -> Lost 8 of 20 = 40%
      expect(calculateGoalProgress(100, 92, 80)).toBe(40);
    });

    it('returns 0 when no progress', () => {
      expect(calculateGoalProgress(100, 100, 80)).toBe(0);
    });

    it('returns 100 when at goal', () => {
      expect(calculateGoalProgress(100, 80, 80)).toBe(100);
    });

    it('returns 100 when below goal', () => {
      expect(calculateGoalProgress(100, 75, 80)).toBe(100);
    });

    it('handles already at goal weight', () => {
      expect(calculateGoalProgress(80, 80, 80)).toBe(100);
    });
  });
});

describe('Treatment Timeline', () => {
  describe('calculateTreatmentWeek', () => {
    it('returns week 1 on start date', () => {
      const startDate = new Date('2025-01-01');
      expect(calculateTreatmentWeek(startDate, new Date('2025-01-01'))).toBe(1);
    });

    it('returns week 1 during first 7 days', () => {
      const startDate = new Date('2025-01-01');
      expect(calculateTreatmentWeek(startDate, new Date('2025-01-07'))).toBe(1);
    });

    it('returns week 2 on day 8', () => {
      const startDate = new Date('2025-01-01');
      expect(calculateTreatmentWeek(startDate, new Date('2025-01-08'))).toBe(2);
    });

    it('calculates later weeks correctly', () => {
      const startDate = new Date('2025-01-01');
      expect(calculateTreatmentWeek(startDate, new Date('2025-02-01'))).toBe(5);
    });
  });

  describe('calculateTreatmentDay', () => {
    it('returns day 1 on start date', () => {
      const startDate = new Date('2025-01-01');
      expect(calculateTreatmentDay(startDate, new Date('2025-01-01'))).toBe(1);
    });

    it('returns day 2 on second day', () => {
      const startDate = new Date('2025-01-01');
      expect(calculateTreatmentDay(startDate, new Date('2025-01-02'))).toBe(2);
    });

    it('calculates later days correctly', () => {
      const startDate = new Date('2025-01-01');
      expect(calculateTreatmentDay(startDate, new Date('2025-02-01'))).toBe(32);
    });
  });
});

describe('Weight Statistics', () => {
  describe('calculateWeightStats', () => {
    it('calculates stats for weight array', () => {
      const weights = [100, 98, 95, 97, 92];
      const stats = calculateWeightStats(weights);

      expect(stats.min).toBe(92);
      expect(stats.max).toBe(100);
      expect(stats.avg).toBeCloseTo(96.4, 1);
      expect(stats.first).toBe(100);
      expect(stats.last).toBe(92);
      expect(stats.change).toBe(-8);
    });

    it('handles empty array', () => {
      const stats = calculateWeightStats([]);

      expect(stats.min).toBeNull();
      expect(stats.max).toBeNull();
      expect(stats.avg).toBeNull();
      expect(stats.first).toBeNull();
      expect(stats.last).toBeNull();
      expect(stats.change).toBeNull();
    });

    it('handles single weight', () => {
      const stats = calculateWeightStats([92.5]);

      expect(stats.min).toBe(92.5);
      expect(stats.max).toBe(92.5);
      expect(stats.avg).toBe(92.5);
      expect(stats.first).toBe(92.5);
      expect(stats.last).toBe(92.5);
      expect(stats.change).toBe(0);
    });
  });
});
