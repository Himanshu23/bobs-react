import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  LinearProgress,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SpeedIcon from '@mui/icons-material/Speed';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import BarChartIcon from '@mui/icons-material/BarChart';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PlaceIcon from '@mui/icons-material/Place';
import PaymentsIcon from '@mui/icons-material/Payments';
import { FoodItem } from '../types';
import {
  useAdminFoodItems,
  useUpdateFoodItem,
} from '../data/hooks/useFoodItems';
import {
  useAdminMarkets,
  useAdminRestaurants,
} from '../admin/hooks/useMarketplaceAdmin';
import { AdminFoodItem } from '../admin/types/marketplace';
import MenuTab from './admin/MenuTab';
import RestaurantsTab from './admin/RestaurantsTab';
import MarketsTab from './admin/MarketsTab';
import OrdersTab from './admin/OrdersTab';
import CurrentOrdersTab from './admin/CurrentOrdersTab';
import DiscountsTab from './admin/DiscountsTab';
import ExpensesTab from './admin/ExpensesTab';
import ReportingTab from './admin/ReportingTab';
import PayoutsTab from './admin/PayoutsTab';
import EditItemDrawer from './admin/EditItemDrawer';

const AdminPage: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [editingItem, setEditingItem] = useState<AdminFoodItem | null>(null);
  const [newItemRestaurantId, setNewItemRestaurantId] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Admin list: includes unavailable items and items of inactive
  // restaurants/markets (includeInactiveRestaurants=true).
  const { data: foodItems, isLoading, isFetching } = useAdminFoodItems();
  const { data: restaurants = [] } = useAdminRestaurants();
  const { data: markets = [] } = useAdminMarkets();
  const updateItemMutation = useUpdateFoodItem();

  const handleEditItem = (item: FoodItem) => {
    setEditingItem(item as AdminFoodItem);
    setIsDrawerOpen(true);
  };

  const handleAddItem = (restaurantId?: string) => {
    setEditingItem(null);
    setNewItemRestaurantId(restaurantId ?? '');
    setIsDrawerOpen(true);
  };

  // EditItemDrawer already saved the item (create or update); just close.
  const handleSaveItem = () => {
    setIsDrawerOpen(false);
    setEditingItem(null);
  };

  const handleToggleAvailability = (item: FoodItem) => {
    updateItemMutation.mutate(
      {
        id: item.id,
        foodItem: { ...item, available: item.available === false },
      },
      { onError: (error) => setErrorMessage(error.message) }
    );
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    // Keep editingItem in state in case user reopens
  };

  if (isLoading || !foodItems) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography color="text.secondary">Loading admin panel...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
            Admin Panel
          </Typography>
          <Typography color="text.secondary">
            Manage orders, menu items, and discounts.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => console.log('refresh')}
          disabled={isFetching}
        >
          Refresh
        </Button>
      </Stack>

      <Card>
        <CardContent>
          <Tabs
            value={tab}
            onChange={(_, nextTab) => setTab(nextTab)}
            variant="scrollable"
            allowScrollButtonsMobile
            sx={{ mb: 2 }}
          >
            <Tab
              icon={<SpeedIcon />}
              iconPosition="start"
              label="Active Orders"
            />
            <Tab
              icon={<ReceiptLongIcon />}
              iconPosition="start"
              label="All Orders"
            />
            <Tab
              icon={<RestaurantMenuIcon />}
              iconPosition="start"
              label="Menu"
            />
            <Tab
              icon={<StorefrontIcon />}
              iconPosition="start"
              label="Restaurants"
            />
            <Tab icon={<PlaceIcon />} iconPosition="start" label="Markets" />
            <Tab
              icon={<LocalOfferIcon />}
              iconPosition="start"
              label="Discounts"
            />
            <Tab
              icon={<MonetizationOnIcon />}
              iconPosition="start"
              label="Expenses"
            />
            <Tab icon={<BarChartIcon />} iconPosition="start" label="Reports" />
            <Tab icon={<PaymentsIcon />} iconPosition="start" label="Payouts" />
          </Tabs>

          {tab === 0 && <CurrentOrdersTab />}
          {tab === 1 && <OrdersTab />}
          {tab === 2 && foodItems && (
            <MenuTab
              items={foodItems}
              restaurants={restaurants}
              markets={markets}
              onAddItem={handleAddItem}
              onEditItem={handleEditItem}
              onToggleAvailability={handleToggleAvailability}
            />
          )}
          {tab === 3 && <RestaurantsTab />}
          {tab === 4 && <MarketsTab />}
          {tab === 5 && <DiscountsTab foodItems={foodItems} />}
          {tab === 6 && <ExpensesTab />}
          {tab === 7 && <ReportingTab />}
          {tab === 8 && <PayoutsTab />}
        </CardContent>
      </Card>

      <EditItemDrawer
        open={isDrawerOpen}
        item={editingItem}
        restaurants={restaurants}
        defaultRestaurantId={newItemRestaurantId}
        onClose={handleCloseDrawer}
        onSave={handleSaveItem}
      />

      <Snackbar
        open={Boolean(errorMessage)}
        autoHideDuration={8000}
        onClose={() => setErrorMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {errorMessage ? (
          <Alert
            severity="error"
            variant="filled"
            onClose={() => setErrorMessage(null)}
          >
            {errorMessage}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Container>
  );
};

export default AdminPage;
