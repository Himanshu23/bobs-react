import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Tabs,
  Tab,
  Fab,
  Menu,
  MenuItem,
} from '@mui/material';
import { List as ListIcon } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch, removeFromCart } from '../redux/store';
import { fetchFoodItems } from '../redux/foodSlice';
import { CartActions, FoodItem, ItemOptions } from '../types';
import FoodItemCard from '../components/listing/foodItemCard';
import ProductDetailModal from '../components/productDetail';
import QuantityUpdate from '../components/quanityUpdate/quantityUpdate';
import VariantRemovalModal from '../components/variantRemovalModal';

const FoodListPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const cartItems = useSelector((state: RootState) => state.cart.items);

  const { items, status, error } = useSelector(
    (state: RootState) => state.food
  );
  const [productDetailModal, setProductDetailModal] = useState(false);
  const [quantityUpdateModal, setQuantityUpdateModal] = useState(false);
  const [quantityUpdateItemID, setquantityUpdateItemID] = useState<string>();
  const [product, setProduct] = useState<FoodItem>();
  const [selectedCategory, setSelectedCategory] = useState<string>('Starters');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [variantRemovalModal, setVariantRemovalModal] = useState(false);
  const [variantRemovalItemID, setVariantRemovalItemID] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchFoodItems());
    }
  }, [status, dispatch]);

  const handleCart = (
    id: string,
    action: CartActions,
    option?: ItemOptions
  ) => {
    const cartItem = cartItems.find((el) => el.id === id);
    const foodItem = items.find((el) => el.id === id);
    if (action === 'Add') {
      if (cartItem) {
        setQuantityUpdateModal(true);
        setquantityUpdateItemID(cartItem.id);
      } else {
        setProductDetailModal(true);
        setProduct(foodItem);
      }
    } else if (action === 'Remove') {
      // Get all variants of this item
      const itemVariants = cartItems.filter((el) => el.id === id);

      if (itemVariants.length > 1) {
        // Multiple variants exist - show modal to select which one to remove
        setVariantRemovalItemID(id);
        setVariantRemovalModal(true);
      } else if (itemVariants.length === 1 && option) {
        // Single variant - remove directly
        dispatch(removeFromCart({ id, option }));
      }
    }
  };

  const handleVariantRemovalSelect = (variant: any) => {
    if (variant.option) {
      dispatch(removeFromCart({ id: variant.id, option: variant.option }));
    }
    setVariantRemovalModal(false);
    setVariantRemovalItemID(null);
  };

  const handleQuantityUpdateClose = () => {
    setQuantityUpdateModal(false);
    setquantityUpdateItemID(undefined);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    handleMenuClose();
  };

  // Get unique categories
  const categories = Array.from(new Set(items.map((item) => item.category)));

  // Group items by category
  const groupedItems = items.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, FoodItem[]>
  );

  if (status === 'loading') {
    return <CircularProgress />;
  }

  if (status === 'failed') {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <>
      <Box sx={{ width: '100%', bgcolor: 'background.paper' }}>
        <Tabs
          value={selectedCategory}
          onChange={(_, newValue) => setSelectedCategory(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: 'primary.main',
            },
            '& .MuiTab-root': {
              minWidth: 120,
              fontSize: '0.875rem',
            },
          }}
        >
          {categories.map((category) => (
            <Tab key={category} label={category} value={category} />
          ))}
        </Tabs>
      </Box>
      <Box sx={{ marginTop: 2 }}>
        {groupedItems[selectedCategory] && (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              justifyContent: 'center',
              padding: 3,
            }}
          >
            {groupedItems[selectedCategory].map((food: FoodItem) => (
              <FoodItemCard
                key={`list_${food.id}`}
                item={food}
                handleCart={handleCart}
              />
            ))}
          </Box>
        )}
      </Box>
      {productDetailModal && product && (
        <ProductDetailModal
          open={productDetailModal}
          onClose={() => setProductDetailModal(false)}
          product={product}
        />
      )}
      {quantityUpdateModal && quantityUpdateItemID && (
        <QuantityUpdate
          open={quantityUpdateModal}
          itemID={quantityUpdateItemID}
          onClose={() => handleQuantityUpdateClose()}
        />
      )}
      {variantRemovalModal && variantRemovalItemID && (
        <VariantRemovalModal
          open={variantRemovalModal}
          variants={cartItems.filter((el) => el.id === variantRemovalItemID)}
          onSelect={handleVariantRemovalSelect}
          onClose={() => {
            setVariantRemovalModal(false);
            setVariantRemovalItemID(null);
          }}
        />
      )}
      <Fab
        color="primary"
        aria-label="categories"
        onClick={handleMenuOpen}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000,
        }}
      >
        <ListIcon />
      </Fab>
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
      >
        {categories.map((category) => (
          <MenuItem
            key={category}
            onClick={() => handleCategorySelect(category)}
          >
            {category}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default FoodListPage;
