import { describe, it, expect } from 'vitest';
import {
  kgToLbs,
  kgToStone,
  lbsToKg,
  stoneToKg,
  kgToStoneLbs,
  stoneLbsToKg,
  cmToFeetInches,
  feetInchesToCm,
  formatWeight,
  formatHeight,
  convertWeight,
} from '../conversions';

describe('Weight Conversions', () => {
  describe('kgToLbs', () => {
    it('converts kilograms to pounds correctly', () => {
      expect(kgToLbs(1)).toBeCloseTo(2.20462, 4);
      expect(kgToLbs(100)).toBeCloseTo(220.462, 2);
      expect(kgToLbs(0)).toBe(0);
    });

    it('handles decimal values', () => {
      expect(kgToLbs(92.5)).toBeCloseTo(203.93, 1);
    });
  });

  describe('lbsToKg', () => {
    it('converts pounds to kilograms correctly', () => {
      expect(lbsToKg(220.462)).toBeCloseTo(100, 1);
      expect(lbsToKg(0)).toBe(0);
    });

    it('is inverse of kgToLbs', () => {
      const kg = 85.5;
      expect(lbsToKg(kgToLbs(kg))).toBeCloseTo(kg, 4);
    });
  });

  describe('kgToStone', () => {
    it('converts kilograms to stone correctly', () => {
      expect(kgToStone(1)).toBeCloseTo(0.157473, 4);
      expect(kgToStone(100)).toBeCloseTo(15.7473, 2);
    });
  });

  describe('stoneToKg', () => {
    it('converts stone to kilograms correctly', () => {
      expect(stoneToKg(15.7473)).toBeCloseTo(100, 1);
    });

    it('is inverse of kgToStone', () => {
      const kg = 85.5;
      expect(stoneToKg(kgToStone(kg))).toBeCloseTo(kg, 4);
    });
  });

  describe('kgToStoneLbs', () => {
    it('converts kg to stone and remaining pounds', () => {
      const result = kgToStoneLbs(92);
      expect(result.stone).toBe(14);
      expect(result.lbs).toBeCloseTo(6.63, 0);
    });
  });

  describe('stoneLbsToKg', () => {
    it('converts stone and pounds to kg', () => {
      expect(stoneLbsToKg(14, 7)).toBeCloseTo(92.5, 0);
    });
  });

  describe('convertWeight', () => {
    it('returns same value when units match', () => {
      expect(convertWeight(100, 'kg', 'kg')).toBe(100);
      expect(convertWeight(220, 'lbs', 'lbs')).toBe(220);
    });

    it('converts between all unit types', () => {
      const kg = 100;
      expect(convertWeight(kg, 'kg', 'lbs')).toBeCloseTo(220.462, 1);
      expect(convertWeight(kg, 'kg', 'stone')).toBeCloseTo(15.7473, 2);

      const lbs = 220.462;
      expect(convertWeight(lbs, 'lbs', 'kg')).toBeCloseTo(100, 1);
    });
  });
});

describe('Height Conversions', () => {
  describe('cmToFeetInches', () => {
    it('converts centimeters to feet and inches', () => {
      const result = cmToFeetInches(168);
      expect(result.feet).toBe(5);
      expect(result.inches).toBe(6);
    });

    it('handles exact foot values', () => {
      expect(cmToFeetInches(152.4)).toEqual({ feet: 5, inches: 0 });
      expect(cmToFeetInches(182.88)).toEqual({ feet: 6, inches: 0 });
    });

    it('handles tall heights', () => {
      const result = cmToFeetInches(190);
      expect(result.feet).toBe(6);
      expect(result.inches).toBe(3);
    });
  });

  describe('feetInchesToCm', () => {
    it('converts feet and inches to centimeters', () => {
      expect(feetInchesToCm(5, 6)).toBeCloseTo(167.64, 1);
    });

    it('handles feet only', () => {
      expect(feetInchesToCm(6)).toBeCloseTo(182.88, 1);
    });

    it('is inverse of cmToFeetInches (approximately)', () => {
      const cm = 175;
      const { feet, inches } = cmToFeetInches(cm);
      expect(feetInchesToCm(feet, inches)).toBeCloseTo(cm, 0);
    });
  });
});

describe('Formatting Functions', () => {
  describe('formatWeight', () => {
    it('formats weight with kg as primary unit', () => {
      const result = formatWeight(92.2, 'kg');
      expect(result).toContain('92.2 kg');
      expect(result).toContain('lbs');
    });

    it('formats weight with lbs as primary unit', () => {
      const result = formatWeight(92.2, 'lbs');
      expect(result).toContain('lbs');
      expect(result).toContain('kg');
    });

    it('formats weight with stone as primary unit', () => {
      const result = formatWeight(92.2, 'stone');
      expect(result).toContain('st');
      expect(result).toContain('lb');
    });
  });

  describe('formatHeight', () => {
    it('formats height with cm as primary unit', () => {
      const result = formatHeight(168, 'cm');
      expect(result).toContain('168 cm');
      expect(result).toContain("'");
    });

    it('formats height with ft-in as primary unit', () => {
      const result = formatHeight(168, 'ft-in');
      expect(result).toContain("5'6\"");
      expect(result).toContain('cm');
    });
  });
});
