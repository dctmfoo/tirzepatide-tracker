import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InjectionHistoryItem } from '../InjectionHistoryItem';

describe('InjectionHistoryItem - Backward Compatibility', () => {
  it('displays legacy abdomen format correctly', () => {
    render(
      <InjectionHistoryItem
        id="test-1"
        date={new Date('2026-01-04')}
        doseMg={2.5}
        site="abdomen"
        weekNumber={2}
      />
    );

    expect(screen.getByText('Abdomen')).toBeInTheDocument();
  });

  it('displays legacy abdomen_left format correctly', () => {
    render(
      <InjectionHistoryItem
        id="test-2"
        date={new Date('2026-01-04')}
        doseMg={2.5}
        site="abdomen_left"
        weekNumber={2}
      />
    );

    expect(screen.getByText('Abdomen - Left')).toBeInTheDocument();
  });

  it('displays legacy arm_left format with Upper prefix', () => {
    render(
      <InjectionHistoryItem
        id="test-3"
        date={new Date('2026-01-04')}
        doseMg={2.5}
        site="arm_left"
        weekNumber={2}
      />
    );

    expect(screen.getByText('Upper Arm - Left')).toBeInTheDocument();
  });

  it('displays legacy arm_right format with Upper prefix', () => {
    render(
      <InjectionHistoryItem
        id="test-4"
        date={new Date('2026-01-04')}
        doseMg={2.5}
        site="arm_right"
        weekNumber={2}
      />
    );

    expect(screen.getByText('Upper Arm - Right')).toBeInTheDocument();
  });

  it('displays legacy thigh_left format correctly', () => {
    render(
      <InjectionHistoryItem
        id="test-5"
        date={new Date('2026-01-04')}
        doseMg={2.5}
        site="thigh_left"
        weekNumber={2}
      />
    );

    expect(screen.getByText('Thigh - Left')).toBeInTheDocument();
  });

  it('displays legacy thigh_right format correctly', () => {
    render(
      <InjectionHistoryItem
        id="test-6"
        date={new Date('2026-01-04')}
        doseMg={2.5}
        site="thigh_right"
        weekNumber={2}
      />
    );

    expect(screen.getByText('Thigh - Right')).toBeInTheDocument();
  });

  it('displays new format without modification', () => {
    render(
      <InjectionHistoryItem
        id="test-7"
        date={new Date('2026-01-04')}
        doseMg={2.5}
        site="Abdomen - Left"
        weekNumber={2}
      />
    );

    expect(screen.getByText('Abdomen - Left')).toBeInTheDocument();
  });

  it('displays new Upper Arm format without modification', () => {
    render(
      <InjectionHistoryItem
        id="test-8"
        date={new Date('2026-01-04')}
        doseMg={2.5}
        site="Upper Arm - Left"
        weekNumber={2}
      />
    );

    expect(screen.getByText('Upper Arm - Left')).toBeInTheDocument();
  });

  it('displays unknown site format as-is', () => {
    render(
      <InjectionHistoryItem
        id="test-9"
        date={new Date('2026-01-04')}
        doseMg={2.5}
        site="unknown_site"
        weekNumber={2}
      />
    );

    expect(screen.getByText('unknown_site')).toBeInTheDocument();
  });

  it('renders all injection details correctly', () => {
    render(
      <InjectionHistoryItem
        id="test-10"
        date={new Date('2026-01-04')}
        doseMg={5}
        site="Abdomen - Right"
        weekNumber={3}
        isDoseChange={true}
        previousDose={2.5}
      />
    );

    expect(screen.getByText('Abdomen - Right')).toBeInTheDocument();
    expect(screen.getByText('5mg')).toBeInTheDocument();
    expect(screen.getByText('Week 3')).toBeInTheDocument();
    expect(screen.getByText('Dose Up')).toBeInTheDocument();
  });
});
