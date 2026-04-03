import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  LinearProgress,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { FoodItem } from '../types';
import { useFoodItems, useUpdateFoodItem } from '../data/hooks/useFoodItems';
import MenuTab from './admin/MenuTab';
import OrdersTab from './admin/OrdersTab';
import DiscountsTab from './admin/DiscountsTab';
import EditItemDrawer from './admin/EditItemDrawer';

const AdminPage: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { data: foodItems, isLoading, isFetching } = useFoodItems();
  const updateItemMutation = useUpdateFoodItem();

  const handleEditItem = (item: FoodItem) => {
    setEditingItem(item);
    setIsDrawerOpen(true);
  };

  const handleSaveItem = (updatedItem: FoodItem) => {
    updateItemMutation.mutate(
      { id: updatedItem.id, foodItem: updatedItem },
      {
        onSuccess: () => {
          setIsDrawerOpen(false);
          setEditingItem(null);
        },
      }
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
              icon={<ReceiptLongIcon />}
              iconPosition="start"
              label="Orders"
            />
            <Tab
              icon={<RestaurantMenuIcon />}
              iconPosition="start"
              label="Menu"
            />
            <Tab
              icon={<LocalOfferIcon />}
              iconPosition="start"
              label="Discounts"
            />
          </Tabs>

          {tab === 0 && <OrdersTab />}
          {tab === 1 && foodItems && (
            <MenuTab items={foodItems} onEditItem={handleEditItem} />
          )}
          {tab === 2 && <DiscountsTab />}
        </CardContent>
      </Card>

      <EditItemDrawer
        open={isDrawerOpen}
        item={editingItem}
        onClose={handleCloseDrawer}
        onSave={handleSaveItem}
      />
    </Container>
  );
};

export default AdminPage;
