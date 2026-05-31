import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
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
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems="flex-end"
          >
            <TextField
              label="From"
              type="date"
              value={fromDate}
              InputLabelProps={{ shrink: true }}
              onChange={(event) => setFromDate(event.target.value)}
            />
            <TextField
              label="To"
              type="date"
              value={toDate}
              InputLabelProps={{ shrink: true }}
              onChange={(event) => setToDate(event.target.value)}
            />
            <TextField
              select
              label="Category"
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
            >
              <MenuItem value="">All categories</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Made by"
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
            <Button variant="outlined" onClick={handleFilterReset}>
              Reset filters
            </Button>
            <Button variant="contained" onClick={() => refetch()}>
              Apply
            </Button>
          </Stack>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Total expenses: ₹{totalAmount.toFixed(2)}
            </Typography>
          </Box>
        </CardContent>
      </Card>

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
                      <TableRow key={expense.id}>
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
