import { Expense } from '../../types';

export type ExpenseGroupBy = 'category' | 'date' | 'month' | 'madeBy';

export const EXPENSE_GROUP_OPTIONS: { value: ExpenseGroupBy; label: string }[] =
  [
    { value: 'category', label: 'Category' },
    { value: 'date', label: 'Date' },
    { value: 'month', label: 'Month' },
    { value: 'madeBy', label: 'Made by' },
  ];

export interface ExpenseGroup {
  key: string;
  label: string;
  count: number;
  total: number;
  /** Share of the grand total, in percent (one decimal). */
  percent: number;
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const round2 = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const groupKey = (
  expense: Expense,
  by: ExpenseGroupBy,
  categoryNames: Record<string, string>
): { key: string; label: string } => {
  switch (by) {
    case 'date':
      return { key: expense.date, label: expense.date };
    case 'month': {
      const key = (expense.date ?? '').slice(0, 7); // YYYY-MM
      const month = Number(key.slice(5, 7));
      return {
        key,
        label: month ? `${MONTHS[month - 1]} ${key.slice(0, 4)}` : key,
      };
    }
    case 'madeBy': {
      const name = expense.madeBy?.trim() || 'Unknown';
      return { key: name.toLowerCase(), label: name };
    }
    default:
      return {
        key: expense.categoryId,
        label:
          categoryNames[expense.categoryId] ||
          expense.categoryName ||
          'Deleted category',
      };
  }
};

/**
 * Groups expenses and totals each group. Categories and people are ordered by
 * total (largest first); dates and months by date (newest first).
 */
export const groupExpenses = (
  expenses: Expense[],
  by: ExpenseGroupBy,
  categoryNames: Record<string, string> = {}
): { groups: ExpenseGroup[]; count: number; total: number } => {
  const map = new Map<string, Omit<ExpenseGroup, 'percent'>>();
  expenses.forEach((expense) => {
    const { key, label } = groupKey(expense, by, categoryNames);
    const group = map.get(key) ?? { key, label, count: 0, total: 0 };
    group.count += 1;
    group.total = round2(group.total + (expense.amount || 0));
    map.set(key, group);
  });
  const total = round2(
    expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)
  );
  const byDate = by === 'date' || by === 'month';
  const groups = Array.from(map.values())
    .map((group) => ({
      ...group,
      percent: total > 0 ? Math.round((group.total / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) =>
      byDate
        ? b.key.localeCompare(a.key)
        : b.total - a.total || a.label.localeCompare(b.label)
    );
  return { groups, count: expenses.length, total };
};
