import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  Grid2,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Expense, ExpenseCategory } from '../../types';
import { useDeleteExpense, useExpenses } from '../../data/hooks/useExpenses';
import {
  EXPENSE_GROUP_OPTIONS,
  ExpenseGroupBy,
  groupExpenses,
} from '../../admin/utils/expenseGroups';

interface ExpenseListTabProps {
  categories: ExpenseCategory[];
  onEditExpense: (expense: Expense) => void;
}

const sampleNames = ['Anita', 'Bobby', 'Carol', 'Deepak', 'Elena'];

const ExpenseListTab: React.FC<ExpenseListTabProps> = ({
  categories,
  onEditExpense,
}) => {
  const today = new Date().toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .slice(0, 10)
  );
  const [toDate, setToDate] = useState(today);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMadeBy, setSelectedMadeBy] = useState('');

  const {
    data: expenses = [],
    isLoading,
    refetch,
  } = useExpenses({
    fromDate,
    toDate,
    categoryId: selectedCategory || undefined,
    madeBy: selectedMadeBy || undefined,
  });
  const deleteExpense = useDeleteExpense();

  const totalAmount = useMemo(
    () => expenses.reduce((sum, expense) => sum + expense.amount, 0),
    [expenses]
  );

  // Selected rows (ids). Only rows still in the filtered list count, so a
  // filter change never totals hidden expenses.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [groupBy, setGroupBy] = useState<ExpenseGroupBy>('category');
  const selectedExpenses = useMemo(
    () => expenses.filter((expense) => selectedIds.has(expense.id)),
    [expenses, selectedIds]
  );
  const allSelected =
    expenses.length > 0 && selectedExpenses.length === expenses.length;
  const someSelected = selectedExpenses.length > 0 && !allSelected;
  // Group the selection; with nothing selected, everything in the filter.
  const grouped = useMemo(() => {
    const categoryNames = Object.fromEntries(
      categories.map((category) => [category.id, category.name])
    );
    return groupExpenses(
      selectedExpenses.length > 0 ? selectedExpenses : expenses,
      groupBy,
      categoryNames
    );
  }, [selectedExpenses, expenses, groupBy, categories]);
  const groupByLabel =
    EXPENSE_GROUP_OPTIONS.find((option) => option.value === groupBy)?.label ??
    '';

  const toggleExpense = (id: string) =>
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelectedIds(
      allSelected ? new Set() : new Set(expenses.map((expense) => expense.id))
    );

  const handleFilterReset = () => {
    setFromDate(
      new Date(new Date().setDate(new Date().getDate() - 30))
        .toISOString()
        .slice(0, 10)
    );
    setToDate(today);
    setSelectedCategory('');
    setSelectedMadeBy('');
  };

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Expense report
          </Typography>
          {/* <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems="flex-end"
          > */}
          <Grid2 container spacing={1} mb={2} alignItems="flex-end">
            <Grid2 size={{ xs: 6, md: 3 }}>
              <TextField
                label="From"
                type="date"
                value={fromDate}
                InputLabelProps={{ shrink: true }}
                onChange={(event) => setFromDate(event.target.value)}
              />
            </Grid2>
            <Grid2 size={{ xs: 6, md: 3 }}>
              <TextField
                label="To"
                type="date"
                value={toDate}
                InputLabelProps={{ shrink: true }}
                onChange={(event) => setToDate(event.target.value)}
              />
            </Grid2>
            <Grid2 size={{ xs: 6, md: 3 }}>
              <TextField
                select
                label="Category"
                value={selectedCategory}
                sx={{ minWidth: 170 }}
                InputLabelProps={{ shrink: true }}
                onChange={(event) => setSelectedCategory(event.target.value)}
              >
                <MenuItem disabled value="">
                  All categories
                </MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid2>
            <Grid2 size={{ xs: 6, md: 3 }}>
              <TextField
                select
                label="Made by"
                sx={{ minWidth: 170 }}
                value={selectedMadeBy}
                onChange={(event) => setSelectedMadeBy(event.target.value)}
              >
                <MenuItem value="">All names</MenuItem>
                {sampleNames.map((name) => (
                  <MenuItem key={name} value={name}>
                    {name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid2>
          </Grid2>
          <Button variant="outlined" onClick={handleFilterReset}>
            Reset filters
          </Button>
          <Button variant="contained" onClick={() => refetch()}>
            Apply
          </Button>
          {/* </Stack> */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Total expenses: ₹{totalAmount.toFixed(2)}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {expenses.length > 0 && (
        <Card>
          <CardContent>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: 'stretch', sm: 'center' }}
              sx={{ mb: 2 }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Totals by {groupByLabel.toLowerCase()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedExpenses.length > 0
                    ? `${selectedExpenses.length} selected expense${selectedExpenses.length === 1 ? '' : 's'}`
                    : `All ${expenses.length} expenses in this filter (tick rows below to total only those)`}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  select
                  size="small"
                  label="Group by"
                  value={groupBy}
                  onChange={(event) =>
                    setGroupBy(event.target.value as ExpenseGroupBy)
                  }
                  sx={{ minWidth: 150 }}
                >
                  {EXPENSE_GROUP_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
                {selectedExpenses.length > 0 && (
                  <Button
                    size="small"
                    onClick={() => setSelectedIds(new Set())}
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    Clear selection
                  </Button>
                )}
              </Stack>
            </Stack>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{groupByLabel}</TableCell>
                    <TableCell align="right">Expenses</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="right">Share</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {grouped.groups.map((group) => (
                    <TableRow key={group.key}>
                      <TableCell>{group.label}</TableCell>
                      <TableCell align="right">{group.count}</TableCell>
                      <TableCell align="right">
                        ₹{group.total.toFixed(2)}
                      </TableCell>
                      <TableCell align="right">{group.percent}%</TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ '& td': { fontWeight: 700 } }}>
                    <TableCell>Total</TableCell>
                    <TableCell align="right">{grouped.count}</TableCell>
                    <TableCell align="right">
                      ₹{grouped.total.toFixed(2)}
                    </TableCell>
                    <TableCell align="right">100%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : expenses.length === 0 ? (
            <Typography color="text.secondary">
              No expenses found for this date range. Try a wider filter.
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={allSelected}
                        indeterminate={someSelected}
                        onChange={toggleAll}
                        inputProps={{ 'aria-label': 'Select all expenses' }}
                      />
                    </TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Amount</TableCell>
                    {/* <TableCell>Type</TableCell> */}
                    <TableCell>Made by</TableCell>
                    <TableCell>Note</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {expenses.map((expense) => {
                    const category = categories.find(
                      (item) => item.id === expense.categoryId
                    );
                    return (
                      <TableRow
                        key={expense.id}
                        hover
                        selected={selectedIds.has(expense.id)}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedIds.has(expense.id)}
                            onChange={() => toggleExpense(expense.id)}
                            inputProps={{
                              'aria-label': `Select expense of ₹${expense.amount} on ${expense.date}`,
                            }}
                          />
                        </TableCell>
                        <TableCell>{expense.date}</TableCell>
                        <TableCell>
                          {category?.name || 'Deleted category'}
                        </TableCell>
                        <TableCell>₹{expense.amount.toFixed(2)}</TableCell>
                        {/* <TableCell>
                          {expense.frequency === 'REGULAR'
                            ? 'Regular'
                            : 'One time'}
                        </TableCell> */}
                        <TableCell>{expense.madeBy}</TableCell>
                        <TableCell>{expense.note || '-'}</TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            onClick={() => onEditExpense(expense)}
                            startIcon={<EditIcon fontSize="small" />}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => deleteExpense.mutate(expense.id)}
                            startIcon={<DeleteIcon fontSize="small" />}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
};

export default ExpenseListTab;
