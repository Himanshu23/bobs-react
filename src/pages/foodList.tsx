import React, { useEffect, useState, useRef, useMemo } from 'react';
import Fuse from 'fuse.js';
import {
  Box,
  Typography,
  CircularProgress,
  Tabs,
  Tab,
  Fab,
  Menu,
  MenuItem,
  Button,
  Avatar,
  AvatarGroup,
  TextField,
  InputAdornment,
  Container,
} from '@mui/material';
import {
  List as ListIcon,
  ChevronRight as ChevronRightIcon,
  Search as SearchIconMUI,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  EnergySavingsLeaf as LeafIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch, removeFromCart } from '../redux/store';
import { fetchFoodItems } from '../redux/foodSlice';
import { CartActions, FoodItem, ItemOptions } from '../types';
import FoodItemCard from '../components/listing/foodItemCard';
import ProductDetailModal from '../components/productDetail';
import QuantityUpdate from '../components/quanityUpdate/quantityUpdate';
import VariantRemovalModal from '../components/variantRemovalModal';

const FoodListPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const totalItems = useSelector((state: RootState) => state.cart.totalItems);

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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [scrollToItemId, setScrollToItemId] = useState<string | null>(null);
  const [vegOnly, setVegOnly] = useState<boolean>(false);
  const itemsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchFoodItems());
    }
  }, [status, dispatch]);

  // Fuse.js configuration for intelligent fuzzy search
  const fuseOptions = useMemo(
    () => ({
      keys: [
        { name: 'name', weight: 0.7 }, // Name has higher weight
        { name: 'category', weight: 0.2 },
        { name: 'description', weight: 0.1 },
      ],
      threshold: 0.3, // Allow fuzzy matching (0.3 = moderate fuzzy)
      distance: 100,
      minMatchCharLength: 2,
      includeScore: true,
    }),
    []
  );

  // Initialize Fuse with all items
  const fuse = useMemo(
    () => new Fuse(items, fuseOptions),
    [items, fuseOptions]
  );

  // Filter items based on search query, selected category, and veg filter
  const filteredItems = useMemo(() => {
    let results = items;

    // Apply veg filter first
    if (vegOnly) {
      results = results.filter((item) => item.veg === true);
    }

    // Apply search filter
    if (searchQuery.trim() !== '') {
      const searchResults = fuse.search(searchQuery);
      results = searchResults.map((result) => result.item);
    } else {
      // If no search, filter by selected category
      results = results.filter((item) => item.category === selectedCategory);
    }

    return results;
  }, [searchQuery, selectedCategory, vegOnly, items, fuse]);

  useEffect(() => {
    if (scrollToItemId && itemsContainerRef.current) {
      const element = itemsContainerRef.current.querySelector(
        `[data-item-id="${scrollToItemId}"]`
      );
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setScrollToItemId(null);
        }, 100);
      }
    }
  }, [scrollToItemId]);

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
    setExpandedCategory(null);
    handleMenuClose();
  };

  const toggleCategoryExpand = (category: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const handleItemSelect = (category: string, itemId?: string) => {
    setSelectedCategory(category);
    if (itemId) {
      setScrollToItemId(itemId);
    }
    setExpandedCategory(null);
    handleMenuClose();
  };

  // Get unique categories
  const categories = Array.from(new Set(items.map((item) => item.category)));

  // Group items by category
  // const groupedItems = items.reduce(
  //   (acc, item) => {
  //     if (!acc[item.category]) acc[item.category] = [];
  //     acc[item.category].push(item);
  //     return acc;
  //   },
  //   {} as Record<string, FoodItem[]>
  // );

  if (status === 'loading') {
    return <CircularProgress />;
  }

  if (status === 'failed') {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <>
      <Container maxWidth="lg">
        {/* Search Bar and Category Tabs */}
        <Box sx={{ pt: 2, pb: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 1.5, alignItems: 'center' }}>
            <TextField
              fullWidth
              placeholder="Search dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIconMUI sx={{ color: '#999' }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <Button
                      size="small"
                      onClick={() => setSearchQuery('')}
                      sx={{ textTransform: 'none', mr: -1 }}
                    >
                      Clear
                    </Button>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '24px',
                  backgroundColor: '#f5f5f5',
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                },
              }}
            />
            <Button
              variant={vegOnly ? 'contained' : 'outlined'}
              color="success"
              startIcon={<LeafIcon />}
              onClick={() => setVegOnly(!vegOnly)}
              sx={{
                whiteSpace: 'nowrap',
                fontWeight: 600,
                animation: !vegOnly ? 'blink 1.5s infinite' : 'none',
                '@keyframes blink': {
                  '0%, 49%, 100%': { opacity: 1 },
                  '50%, 99%': { opacity: 0.5 },
                },
                '&:hover': {
                  animation: 'none',
                },
              }}
            >
              Veg Only
            </Button>
          </Box>

          <Tabs
            value={searchQuery ? false : selectedCategory}
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
                py: 1,
                opacity: searchQuery ? 0.5 : 1,
              },
            }}
          >
            {categories.map((category) => (
              <Tab key={category} label={category} value={category} />
            ))}
          </Tabs>
        </Box>

        {filteredItems.length > 0 ? (
          <Box
            ref={itemsContainerRef}
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              justifyContent: 'center',
              padding: 1,
            }}
          >
            {filteredItems.map((food: FoodItem) => (
              <Box
                key={`list_${food.id}`}
                data-item-id={food.id}
                sx={{ position: 'relative' }}
              >
                {searchQuery && (
                  <Typography
                    variant="caption"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      backgroundColor: '#e3f2fd',
                      color: '#1976d2',
                      px: 1,
                      py: 0.5,
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 600,
                      zIndex: 10,
                    }}
                  >
                    {food.category}
                  </Typography>
                )}
                <FoodItemCard item={food} handleCart={handleCart} />
              </Box>
            ))}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" color="textSecondary" sx={{ mb: 1 }}>
              {searchQuery
                ? 'No items found matching your search'
                : 'No items in this category'}
            </Typography>
            {searchQuery && (
              <Button
                variant="text"
                onClick={() => setSearchQuery('')}
                sx={{ mt: 2 }}
              >
                Clear Search
              </Button>
            )}
          </Box>
        )}
      </Container>

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
      {totalItems > 0 && (
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={() => navigate('/cart')}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 999,
            borderRadius: 0,
            fontSize: '1rem',
            fontWeight: 600,
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            textTransform: 'none',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AvatarGroup
              max={3}
              sx={{
                '& .MuiAvatar-root': {
                  width: 40,
                  height: 40,
                  fontSize: '0.875rem',
                  border: '3px solid rgba(255, 255, 255, 0.8)',
                },
                '& .MuiAvatarGroup-avatar': {
                  marginLeft: '-12px',
                },
              }}
            >
              {cartItems.slice(0, 3).map((item) => (
                <Avatar
                  key={`${item.id}_${JSON.stringify(item.option)}`}
                  alt={item.name}
                  src={item.image}
                  sx={{
                    width: 40,
                    height: 40,
                  }}
                />
              ))}
            </AvatarGroup>
            <Typography sx={{ fontWeight: 500, color: 'white' }}>
              {totalItems} Item{totalItems > 1 ? 's' : ''} Added
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            View Cart
            <ChevronRightIcon sx={{ fontSize: '1.25rem' }} />
          </Box>
        </Button>
      )}
      <Fab
        color="primary"
        aria-label="categories"
        onClick={handleMenuOpen}
        sx={{
          position: 'fixed',
          bottom: 80,
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
        {categories.map((category) => {
          const categoryItems = items.filter(
            (item) => item.category === category
          );
          const isExpanded = expandedCategory === category;
          return (
            <Box key={category}>
              <MenuItem
                onClick={() => handleCategorySelect(category)}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  pr: 1,
                }}
              >
                <Typography sx={{ flex: 1 }}>{category}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      backgroundColor: '#f0f0f0',
                      px: 1,
                      py: 0.5,
                      borderRadius: '12px',
                      fontWeight: 600,
                      color: 'primary.main',
                    }}
                  >
                    {categoryItems.length}
                  </Typography>
                  <Box
                    onClick={(e) => toggleCategoryExpand(category, e)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      color: 'primary.main',
                      '&:hover': {
                        opacity: 0.8,
                      },
                    }}
                  >
                    {isExpanded ? (
                      <ExpandLessIcon sx={{ fontSize: '1.25rem' }} />
                    ) : (
                      <ExpandMoreIcon sx={{ fontSize: '1.25rem' }} />
                    )}
                  </Box>
                </Box>
              </MenuItem>
              {isExpanded && (
                <Box
                  sx={{
                    backgroundColor: '#fafafa',
                    borderLeft: '3px solid',
                    borderLeftColor: 'primary.main',
                    maxHeight: '300px',
                    overflow: 'auto',
                  }}
                >
                  {categoryItems.map((item) => (
                    <MenuItem
                      key={item.id}
                      onClick={() => handleItemSelect(category, item.id)}
                      sx={{
                        pl: 4,
                        fontSize: '0.875rem',
                        color: 'textSecondary',
                        '&:hover': {
                          backgroundColor: '#f0f0f0',
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          width: '100%',
                        }}
                      >
                        <Box
                          component="img"
                          src={item.image}
                          alt={item.name}
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '4px',
                            objectFit: 'cover',
                          }}
                        />
                        <Typography sx={{ fontSize: '0.875rem', flex: 1 }}>
                          {item.name}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Box>
              )}
            </Box>
          );
        })}
      </Menu>
    </>
  );
};

export default FoodListPage;
