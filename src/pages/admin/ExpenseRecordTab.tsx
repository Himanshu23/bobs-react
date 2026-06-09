import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Expense, ExpenseCategory } from '../../types';
import {
  useCreateExpense,
  useUpdateExpense,
} from '../../data/hooks/useExpenses';

interface ExpenseRecordTabProps {
  categories: ExpenseCategory[];
  selectedExpense: Expense | null;
  onSaved: () => void;
  onClearSelection: () => void;
}

const sampleNames = ['Himanshu', 'Kvita', 'Gaurav', 'Neeraj'];

const ExpenseRecordTab: React.FC<ExpenseRecordTabProps> = ({
  categories,
  selectedExpense,
  onSaved,
  onClearSelection,
}) => {
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  //   const [frequency, setFrequency] = useState<ExpenseFrequency>('ONE_TIME');
  const [note, setNote] = useState('');
  const [madeBy, setMadeBy] = useState(sampleNames[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  useEffect(() => {
    if (selectedExpense) {
      setCategoryId(selectedExpense.categoryId);
      setAmount(String(selectedExpense.amount));
      setDate(selectedExpense.date);
      // setFrequency(selectedExpense.frequency);
      setNote(selectedExpense.note ?? '');
      setMadeBy(selectedExpense.madeBy);
    }
  }, [selectedExpense]);

  useEffect(() => {
    if (!selectedExpense && categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [categories, selectedExpense, categoryId]);

  //   useEffect(() => {
  //     if (!selectedExpense && categoryId) {
  //       const cat = categories.find((c) => c.id === categoryId);
  //       if (cat) {
  //         // Map category recurring flag to frequency default
  //         setFrequency(cat.recurring ? 'REGULAR' : 'ONE_TIME');
  //       }
  //     }
  //   }, [categoryId, categories, selectedExpense]);

  const selectedCategoryName = useMemo(
    () => categories.find((item) => item.id === categoryId)?.name || 'Unknown',
    [categories, categoryId]
  );

  const resetForm = () => {
    setCategoryId(categories[0]?.id ?? '');
    setAmount('');
    setDate(new Date().toISOString().slice(0, 10));
    setNote('');
    setMadeBy(sampleNames[0]);
    onClearSelection();
  };

  const handleSubmit = async () => {
    if (!categoryId || !amount || Number(amount) <= 0 || !date) {
      return;
    }

    setIsSaving(true);

    const payload = {
      categoryId,
      amount: Number(amount),
      date,
      note,
      madeBy,
    };

    try {
      if (selectedExpense) {
        await updateExpense.mutateAsync({ ...selectedExpense, ...payload });
      } else {
        await createExpense.mutateAsync(payload);
      }
      setSuccessOpen(true);
      resetForm();
      onSaved();
    } catch (error) {
      console.error('Failed to save expense', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          {selectedExpense ? 'Edit expense' : 'Record new expense'}
        </Typography>
        <Stack spacing={3}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              select
              label="Category"
              value={categoryId}
              fullWidth
              onChange={(event) => setCategoryId(event.target.value)}
              helperText={
                selectedExpense ? `Category:   ${selectedCategoryName}` : ''
              }
            >
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Amount"
              value={amount}
              type="number"
              fullWidth
              onChange={(event) => setAmount(event.target.value)}
            />
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="Expense date"
              type="date"
              value={date}
              fullWidth
              InputLabelProps={{ shrink: true }}
              onChange={(event) => setDate(event.target.value)}
            />
            <TextField
              select
              label="Made by"
              value={madeBy}
              fullWidth
              onChange={(event) => setMadeBy(event.target.value)}
            >
              {sampleNames.map((name) => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          {/* 
          <FormControl>
            <FormLabel>Expense type</FormLabel>
            <RadioGroup
              row
              value={frequency}
              onChange={(event) =>
                setFrequency(event.target.value as ExpenseFrequency)
              }
            >
              <FormControlLabel
                value="ONE_TIME"
                control={<Radio />}
                label="One time"
              />
              <FormControlLabel
                value="REGULAR"
                control={<Radio />}
                label="Regular"
              />
            </RadioGroup>
          </FormControl> */}

          <TextField
            label="Note"
            multiline
            minRows={3}
            value={note}
            fullWidth
            onChange={(event) => setNote(event.target.value)}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={isSaving}
            >
              {selectedExpense ? 'Update expense' : 'Save expense'}
            </Button>
            <Button variant="outlined" onClick={resetForm}>
              Reset form
            </Button>
          </Stack>
        </Stack>
      </CardContent>
      <Snackbar
        open={successOpen}
        autoHideDuration={4000}
        onClose={() => setSuccessOpen(false)}
        message="Expense saved successfully"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Card>
  );
};

export default ExpenseRecordTab;
