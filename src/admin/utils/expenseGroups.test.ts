import { describe, expect, it } from 'vitest';
import { Expense } from '../../types';
import { groupExpenses } from './expenseGroups';

const expense = (
  id: string,
  categoryId: string,
  amount: number,
  date: string,
  madeBy = 'Anita'
): Expense => ({
  id,
  categoryId,
  categoryName: categoryId === 'veg' ? 'Vegetables' : 'Gas',
  amount,
  date,
  madeBy,
  createdAt: '',
  updatedAt: '',
});

const list = [
  expense('1', 'veg', 500.5, '2026-10-01'),
  expense('2', 'gas', 1200, '2026-10-01', 'Bobby'),
  expense('3', 'veg', 299.5, '2026-10-03'),
  expense('4', 'veg', 100, '2026-09-28', 'bobby'),
];

describe('groupExpenses', () => {
  it('groups by category with count, total and share, largest first', () => {
    const result = groupExpenses(list, 'category');
    expect(result.total).toBe(2100);
    expect(result.count).toBe(4);
    expect(result.groups).toEqual([
      { key: 'gas', label: 'Gas', count: 1, total: 1200, percent: 57.1 },
      { key: 'veg', label: 'Vegetables', count: 3, total: 900, percent: 42.9 },
    ]);
  });

  it('uses the current category name when given', () => {
    expect(
      groupExpenses(list, 'category', { veg: 'Veggies' }).groups[1].label
    ).toBe('Veggies');
  });

  it('groups by date and month, newest first', () => {
    expect(groupExpenses(list, 'date').groups.map((g) => g.key)).toEqual([
      '2026-10-03',
      '2026-10-01',
      '2026-09-28',
    ]);
    expect(
      groupExpenses(list, 'month').groups.map((g) => [g.label, g.total])
    ).toEqual([
      ['Oct 2026', 2000],
      ['Sep 2026', 100],
    ]);
  });

  it('groups people regardless of letter case', () => {
    const groups = groupExpenses(list, 'madeBy').groups;
    expect(groups.map((g) => [g.label, g.count, g.total])).toEqual([
      ['Bobby', 2, 1300],
      ['Anita', 2, 800],
    ]);
  });

  it('handles nothing to group', () => {
    expect(groupExpenses([], 'category')).toEqual({
      groups: [],
      count: 0,
      total: 0,
    });
  });
});
