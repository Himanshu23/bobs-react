import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControlLabel,
  Switch,
  IconButton,
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
import {
  useCreateExpenseCategory,
  useDeleteExpenseCategory,
  useExpenseCategories,
  useUpdateExpenseCategory,
} from '../../data/hooks/useExpenseCategories';
import { ExpenseCategory } from '../../types';

const ExpenseCategoriesTab: React.FC = () => {
  const { data: categories = [], isLoading } = useExpenseCategories();
  const createCategory = useCreateExpenseCategory();
  const updateCategory = useUpdateExpenseCategory();
  const deleteCategory = useDeleteExpenseCategory();

  const [name, setName] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<ExpenseCategory | null>(null);

  useEffect(() => {
    if (!editingCategory) {
      setName('');
      setRecurring(false);
    }
  }, [editingCategory]);

  const submitLabel = editingCategory ? 'Save changes' : 'Add category';

  const handleSave = async () => {
    if (!name.trim()) return;
    if (editingCategory) {
      await updateCategory.mutateAsync({
        id: editingCategory.id,
        name: name.trim(),
        recurring,
      });
      setEditingCategory(null);
    } else {
      await createCategory.mutateAsync({ name: name.trim(), recurring });
    }
    setName('');
    setRecurring(false);
  };

  const handleEdit = (category: ExpenseCategory) => {
    setEditingCategory(category);
    setName(category.name);
    setRecurring(Boolean((category as any).recurring));
  };

  const handleCancel = () => {
    setEditingCategory(null);
    setName('');
  };

  const rows = useMemo(() => categories, [categories]);

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Expense Categories
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Category name"
              value={name}
              fullWidth
              onChange={(event) => setName(event.target.value)}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={recurring}
                  onChange={(e) => setRecurring(e.target.checked)}
                />
              }
              label="Recurring by default"
            />
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={createCategory.isPending || updateCategory.isPending}
              >
                {submitLabel}
              </Button>
              {editingCategory && (
                <Button variant="outlined" onClick={handleCancel}>
                  Cancel
                </Button>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
            Manage categories
          </Typography>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : rows.length === 0 ? (
            <Typography color="text.secondary">
              No categories yet. Add one to start recording expenses.
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Recurring</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>{category.name}</TableCell>
                      <TableCell>{category.recurring ? 'Yes' : 'No'}</TableCell>
                      <TableCell>
                        {new Date(category.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(category)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => deleteCategory.mutate(category.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
};

export default ExpenseCategoriesTab;
