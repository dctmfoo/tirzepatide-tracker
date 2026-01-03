import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCheckinForm, DEFAULT_SIDE_EFFECTS } from '../useCheckinForm';
import type { DailyLogData } from '@/lib/data/daily-log';

// Mock fetch for save tests
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useCheckinForm', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('Initial State', () => {
    it('creates initial state with null values when no existing data', () => {
      const { result } = renderHook(() => useCheckinForm());

      expect(result.current.formState.moodLevel).toBeNull();
      expect(result.current.formState.cravingsLevel).toBeNull();
      expect(result.current.formState.motivationLevel).toBeNull();
      expect(result.current.formState.hungerLevel).toBeNull();
      expect(result.current.formState.workoutType).toBeNull();
      expect(result.current.formState.notes).toBe('');
    });

    it('initializes numeric values to 0 when no existing data', () => {
      const { result } = renderHook(() => useCheckinForm());

      expect(result.current.formState.mealsCount).toBe(0);
      expect(result.current.formState.proteinGrams).toBe(0);
      expect(result.current.formState.waterLiters).toBe(0);
      expect(result.current.formState.steps).toBe(0);
      expect(result.current.formState.durationMinutes).toBe(0);
    });

    it('initializes all default side effects with severity 0', () => {
      const { result } = renderHook(() => useCheckinForm());

      expect(result.current.formState.sideEffects).toHaveLength(DEFAULT_SIDE_EFFECTS.length);
      result.current.formState.sideEffects.forEach((se) => {
        expect(DEFAULT_SIDE_EFFECTS).toContain(se.effectType);
        expect(se.severity).toBe(0);
      });
    });

    it('populates state from existing data', () => {
      const existingData: DailyLogData = {
        id: 'test-id',
        logDate: '2025-01-01',
        mental: {
          moodLevel: 'Good',
          cravingsLevel: 'Low',
          motivationLevel: 'High',
          notes: 'Test mental note',
        },
        diet: {
          hungerLevel: 'Moderate',
          mealsCount: 3,
          proteinGrams: 100,
          waterLiters: 2.5,
          notes: 'Test diet note',
        },
        activity: {
          workoutType: 'Cardio',
          durationMinutes: 45,
          steps: 8000,
          notes: 'Test activity note',
        },
        sideEffects: [
          { effectType: 'Nausea', severity: 3 },
          { effectType: 'Headache', severity: 2 },
        ],
      };

      const { result } = renderHook(() => useCheckinForm(existingData));

      expect(result.current.formState.moodLevel).toBe('Good');
      expect(result.current.formState.cravingsLevel).toBe('Low');
      expect(result.current.formState.motivationLevel).toBe('High');
      expect(result.current.formState.hungerLevel).toBe('Moderate');
      expect(result.current.formState.mealsCount).toBe(3);
      expect(result.current.formState.proteinGrams).toBe(100);
      expect(result.current.formState.waterLiters).toBe(2.5);
      expect(result.current.formState.workoutType).toBe('Cardio');
      expect(result.current.formState.durationMinutes).toBe(45);
      expect(result.current.formState.steps).toBe(8000);
    });

    it('loads notes from mental section first (priority)', () => {
      const existingData: DailyLogData = {
        id: 'test-id',
        logDate: '2025-01-01',
        mental: { notes: 'Mental note' },
        diet: { notes: 'Diet note' },
        activity: { notes: 'Activity note' },
        sideEffects: [],
      };

      const { result } = renderHook(() => useCheckinForm(existingData));
      expect(result.current.formState.notes).toBe('Mental note');
    });

    it('falls back to diet notes if no mental notes', () => {
      const existingData: DailyLogData = {
        id: 'test-id',
        logDate: '2025-01-01',
        mental: null,
        diet: { notes: 'Diet note' },
        activity: { notes: 'Activity note' },
        sideEffects: [],
      };

      const { result } = renderHook(() => useCheckinForm(existingData));
      expect(result.current.formState.notes).toBe('Diet note');
    });

    it('merges existing side effects with defaults', () => {
      const existingData: DailyLogData = {
        id: 'test-id',
        logDate: '2025-01-01',
        mental: null,
        diet: null,
        activity: null,
        sideEffects: [
          { effectType: 'Nausea', severity: 4 },
          { effectType: 'CustomEffect', severity: 2 }, // Custom effect not in defaults
        ],
      };

      const { result } = renderHook(() => useCheckinForm(existingData));

      // Should have all defaults + custom
      expect(result.current.formState.sideEffects.length).toBe(DEFAULT_SIDE_EFFECTS.length + 1);

      // Nausea should have severity from existing data
      const nausea = result.current.formState.sideEffects.find((se) => se.effectType === 'Nausea');
      expect(nausea?.severity).toBe(4);

      // Custom effect should be included
      const custom = result.current.formState.sideEffects.find((se) => se.effectType === 'CustomEffect');
      expect(custom?.severity).toBe(2);
    });
  });

  describe('Update Functions', () => {
    it('updates mood level', () => {
      const { result } = renderHook(() => useCheckinForm());

      act(() => {
        result.current.updateMood('moodLevel', 'Great');
      });

      expect(result.current.formState.moodLevel).toBe('Great');
    });

    it('updates cravings level', () => {
      const { result } = renderHook(() => useCheckinForm());

      act(() => {
        result.current.updateMood('cravingsLevel', 'High');
      });

      expect(result.current.formState.cravingsLevel).toBe('High');
    });

    it('updates side effect severity', () => {
      const { result } = renderHook(() => useCheckinForm());

      act(() => {
        result.current.updateSideEffect('Nausea', 3);
      });

      const nausea = result.current.formState.sideEffects.find((se) => se.effectType === 'Nausea');
      expect(nausea?.severity).toBe(3);
    });

    it('adds custom side effect', () => {
      const { result } = renderHook(() => useCheckinForm());
      const initialCount = result.current.formState.sideEffects.length;

      act(() => {
        result.current.addCustomSideEffect('Bloating');
      });

      expect(result.current.formState.sideEffects.length).toBe(initialCount + 1);
      const bloating = result.current.formState.sideEffects.find((se) => se.effectType === 'Bloating');
      expect(bloating).toBeDefined();
      expect(bloating?.severity).toBe(0);
    });

    it('updates diet fields', () => {
      const { result } = renderHook(() => useCheckinForm());

      act(() => {
        result.current.updateDiet('mealsCount', 4);
        result.current.updateDiet('proteinGrams', 120);
        result.current.updateDiet('waterLiters', 3);
        result.current.updateDiet('hungerLevel', 'Low');
      });

      expect(result.current.formState.mealsCount).toBe(4);
      expect(result.current.formState.proteinGrams).toBe(120);
      expect(result.current.formState.waterLiters).toBe(3);
      expect(result.current.formState.hungerLevel).toBe('Low');
    });

    it('updates activity fields', () => {
      const { result } = renderHook(() => useCheckinForm());

      act(() => {
        result.current.updateActivity('steps', 10000);
        result.current.updateActivity('durationMinutes', 60);
        result.current.updateActivity('workoutType', 'Strength training');
      });

      expect(result.current.formState.steps).toBe(10000);
      expect(result.current.formState.durationMinutes).toBe(60);
      expect(result.current.formState.workoutType).toBe('Strength training');
    });

    it('updates notes', () => {
      const { result } = renderHook(() => useCheckinForm());

      act(() => {
        result.current.updateNotes('Today was a good day!');
      });

      expect(result.current.formState.notes).toBe('Today was a good day!');
    });
  });

  describe('Completed Sections Tracking', () => {
    it('marks mood as complete when moodLevel is set', () => {
      const { result } = renderHook(() => useCheckinForm());

      expect(result.current.completedSections.mood).toBe(false);

      act(() => {
        result.current.updateMood('moodLevel', 'Good');
      });

      expect(result.current.completedSections.mood).toBe(true);
    });

    it('marks sideEffects as complete when any has severity > 0', () => {
      const { result } = renderHook(() => useCheckinForm());

      expect(result.current.completedSections.sideEffects).toBe(false);

      act(() => {
        result.current.updateSideEffect('Fatigue', 2);
      });

      expect(result.current.completedSections.sideEffects).toBe(true);
    });

    it('marks diet as complete when any diet field is set', () => {
      const { result } = renderHook(() => useCheckinForm());

      expect(result.current.completedSections.diet).toBe(false);

      act(() => {
        result.current.updateDiet('mealsCount', 2);
      });

      expect(result.current.completedSections.diet).toBe(true);
    });

    it('marks activity as complete when steps or duration set', () => {
      const { result } = renderHook(() => useCheckinForm());

      expect(result.current.completedSections.activity).toBe(false);

      act(() => {
        result.current.updateActivity('steps', 5000);
      });

      expect(result.current.completedSections.activity).toBe(true);
    });

    it('counts completed sections correctly', () => {
      const { result } = renderHook(() => useCheckinForm());

      expect(result.current.completedCount).toBe(0);

      act(() => {
        result.current.updateMood('moodLevel', 'Good');
      });
      expect(result.current.completedCount).toBe(1);

      act(() => {
        result.current.updateSideEffect('Nausea', 1);
      });
      expect(result.current.completedCount).toBe(2);

      act(() => {
        result.current.updateDiet('mealsCount', 3);
      });
      expect(result.current.completedCount).toBe(3);

      act(() => {
        result.current.updateActivity('workoutType', 'Walking');
      });
      expect(result.current.completedCount).toBe(4);
    });
  });

  describe('Save Function', () => {
    it('calls API with correct payload', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useCheckinForm());

      act(() => {
        result.current.updateMood('moodLevel', 'Great');
        result.current.updateDiet('mealsCount', 3);
        result.current.updateSideEffect('Nausea', 2);
      });

      let saveResult: boolean = false;
      await act(async () => {
        saveResult = await result.current.save('2025-01-15');
      });

      expect(saveResult).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('/api/daily-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.any(String),
      });

      const payload = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(payload.logDate).toBe('2025-01-15');
      expect(payload.mental.moodLevel).toBe('Great');
      expect(payload.diet.mealsCount).toBe(3);
      expect(payload.sideEffects).toHaveLength(1);
      expect(payload.sideEffects[0].effectType).toBe('Nausea');
      expect(payload.sideEffects[0].severity).toBe(2);
    });

    it('filters out side effects with severity 0', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useCheckinForm());

      // Only set one side effect, leave others at 0
      act(() => {
        result.current.updateSideEffect('Headache', 3);
      });

      await act(async () => {
        await result.current.save('2025-01-15');
      });

      const payload = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(payload.sideEffects).toHaveLength(1);
      expect(payload.sideEffects[0].effectType).toBe('Headache');
    });

    it('omits empty sections from payload', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useCheckinForm());

      // Only set mood, nothing else
      act(() => {
        result.current.updateMood('moodLevel', 'Fair');
      });

      await act(async () => {
        await result.current.save('2025-01-15');
      });

      const payload = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(payload.mental).toBeDefined();
      expect(payload.diet).toBeUndefined();
      expect(payload.activity).toBeUndefined();
      expect(payload.sideEffects).toBeUndefined();
    });

    it('sends mental section when only notes are set (notes are canonical to mental)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useCheckinForm());

      // Only set notes, no mood/cravings/motivation
      act(() => {
        result.current.updateNotes('Just some notes for today');
      });

      await act(async () => {
        await result.current.save('2025-01-15');
      });

      const payload = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(payload.mental).toBeDefined();
      expect(payload.mental.notes).toBe('Just some notes for today');
      expect(payload.mental.moodLevel).toBeUndefined();
      expect(payload.mental.cravingsLevel).toBeUndefined();
      expect(payload.mental.motivationLevel).toBeUndefined();
    });

    it('sets isSaving during save operation', async () => {
      let resolvePromise: (value: unknown) => void;
      mockFetch.mockReturnValueOnce(
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
      );

      const { result } = renderHook(() => useCheckinForm());

      expect(result.current.isSaving).toBe(false);

      act(() => {
        result.current.save('2025-01-15');
      });

      expect(result.current.isSaving).toBe(true);

      await act(async () => {
        resolvePromise!({ ok: true, json: async () => ({}) });
      });

      await waitFor(() => {
        expect(result.current.isSaving).toBe(false);
      });
    });

    it('handles API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Server error' }),
      });

      const { result } = renderHook(() => useCheckinForm());

      let saveResult: boolean = false;
      await act(async () => {
        saveResult = await result.current.save('2025-01-15');
      });

      expect(saveResult).toBe(false);
      expect(result.current.error).toBe('Server error');
    });

    it('handles network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useCheckinForm());

      let saveResult: boolean = false;
      await act(async () => {
        saveResult = await result.current.save('2025-01-15');
      });

      expect(saveResult).toBe(false);
      expect(result.current.error).toBe('Network error');
    });

    it('clears error on new save attempt', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'First error' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      const { result } = renderHook(() => useCheckinForm());

      await act(async () => {
        await result.current.save('2025-01-15');
      });
      expect(result.current.error).toBe('First error');

      await act(async () => {
        await result.current.save('2025-01-15');
      });
      expect(result.current.error).toBeNull();
    });
  });
});
