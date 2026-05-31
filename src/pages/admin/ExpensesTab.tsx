import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import CategoryIcon from '@mui/icons-material/Category';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ExpenseCategoriesTab from './ExpenseCategoriesTab';
import ExpenseRecordTab from './ExpenseRecordTab';
import ExpenseListTab from './ExpenseListTab';
import { Expense } from '../../types';
import { useExpenseCategories } from '../../data/hooks/useExpenseCategories';

const ExpensesTab: React.FC = () => {
  const [subTab, setSubTab] = useState(0);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const { data: categories = [] } = useExpenseCategories();

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Expense Management
            </Typography>
            <Typography color="text.secondary">
              Create categories, record expenses, and review spend using
              filters.
            </Typography>
          </Box>
          <Tabs
            value={subTab}
            onChange={(_, next) => setSubTab(next)}
            variant="scrollable"
            allowScrollButtonsMobile
          >
            <Tab
              icon={<CategoryIcon />}
              iconPosition="start"
              label="Categories"
            />
            <Tab
              icon={<AttachMoneyIcon />}
              iconPosition="start"
              label="Record Expense"
            />
            <Tab
              icon={<ListAltIcon />}
              iconPosition="start"
              label="Expense List"
            />
          </Tabs>
        </CardContent>
      </Card>

      {subTab === 0 && <ExpenseCategoriesTab />}
      {subTab === 1 && (
        <ExpenseRecordTab
          categories={categories}
          selectedExpense={selectedExpense}
          onSaved={() => setSelectedExpense(null)}
          onClearSelection={() => setSelectedExpense(null)}
        />
      )}
      {subTab === 2 && (
        <ExpenseListTab
          categories={categories}
          onEditExpense={(expense) => {
            setSelectedExpense(expense);
            setSubTab(1);
          }}
        />
      )}
    </Stack>
  );
};

export default ExpensesTab;
