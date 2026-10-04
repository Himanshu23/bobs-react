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
  TextField,
  InputAdornment,
  Container,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material';
import {
  List as ListIcon,
  Search as SearchIconMUI,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch, removeFromCart } from '../redux/store';
import { useRestaurantFoodItems } from '../data/hooks/useRestaurantFoodItems';
import { useMostReorderedItems } from '../data/hooks/useMostReorderedItems';
import { CartActions, CATEGORY_ORDER, FoodItem } from '../types';
import MostReorderedSection from '../components/MostReorderedSection';
import FoodItemCard, {
  FOOD_CARD_MAX_WIDTH,
} from '../components/listing/foodItemCard';
import FoodImage from '../components/FoodImage';
import ProductDetailModal from '../components/productDetail';
import QuantityUpdate from '../components/quanityUpdate/quantityUpdate';
import VariantRemovalModal from '../components/variantRemovalModal';
import { trackEvent } from '../utils/analytics';
import { getLowestNowPrice } from '../utils/priceUtils';
import { DEFAULT_RESTAURANT_ID } from '../types/marketplace';
import { useCurrentRestaurant } from '../context/CurrentRestaurantContext';
import { useMenuOrdering } from '../context/MenuOrderingContext';
import {
  AnalyticsRestaurant,
  buildCartItemsParams,
  buildViewItemListParams,
  buildViewItemParams,
} from '../utils/analyticsItems';
import {
  getCartItemRestaurantId,
  resolveCartRestaurant,
} from '../utils/cartUtils';

/**
 * Slot around each dish card: the full row on phones, at most
 * FOOD_CARD_MAX_WIDTH, so every card gets the same width (the card fills its
 * slot) and never runs off the screen.
 */
const FOOD_CARD_SLOT_SX = {
  position: 'relative',
  width: '100%',
  maxWidth: FOOD_CARD_MAX_WIDTH,
} as const;

/** Tab value for the "All" tab (every dish); the default tab. */
const ALL_CATEGORY = 'All';

const normalizeSearchText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenizeSearchText = (value: string) =>
  normalizeSearchText(value).split(' ').filter(Boolean);

const areTokensInOrder = (titleTokens: string[], queryTokens: string[]) => {
  let searchIndex = 0;

  for (const token of titleTokens) {
    if (token === queryTokens[searchIndex]) {
      searchIndex += 1;
    }

    if (searchIndex === queryTokens.length) {
      return true;
    }
  }

  return false;
};

const getTitleMatchRank = (title: string, query: string) => {
  const normalizedTitle = normalizeSearchText(title);
  const normalizedQuery = normalizeSearchText(query);
  const titleTokens = tokenizeSearchText(title);
  const queryTokens = tokenizeSearchText(query);

  if (!normalizedQuery) {
    return 0;
  }

  if (normalizedTitle === normalizedQuery) {
    return 100;
  }

  if (normalizedTitle.startsWith(normalizedQuery)) {
    return 95;
  }

  if (normalizedTitle.includes(normalizedQuery)) {
    return 90;
  }

  if (
    queryTokens.length > 1 &&
    queryTokens.every((token) => titleTokens.includes(token))
  ) {
    if (areTokensInOrder(titleTokens, queryTokens)) {
      return 85;
    }

    return 80;
  }

  const exactTokenMatches = queryTokens.filter((token) =>
    titleTokens.includes(token)
  ).length;

  if (exactTokenMatches > 0) {
    return 60 + exactTokenMatches;
  }

  const prefixTokenMatches = queryTokens.filter((queryToken) =>
    titleTokens.some((titleToken) => titleToken.startsWith(queryToken))
  ).length;

  if (prefixTokenMatches > 0) {
    return 40 + prefixTokenMatches;
  }

  return 0;
};

const compareSearchResults = (
  left: FoodItem,
  right: FoodItem,
  query: string,
  scoreById: Map<string, number>
) => {
  const leftRank = getTitleMatchRank(left.name, query);
  const rightRank = getTitleMatchRank(right.name, query);

  if (leftRank !== rightRank) {
    return rightRank - leftRank;
  }

  const leftScore = scoreById.get(left.id) ?? Number.POSITIVE_INFINITY;
  const rightScore = scoreById.get(right.id) ?? Number.POSITIVE_INFINITY;

  if (leftScore !== rightScore) {
    return leftScore - rightScore;
  }

  return left.name.localeCompare(right.name);
};

interface FoodListPageProps {
  /** Only this restaurant's menu is shown (D11: menus are never mixed). */
  restaurantId: string;
  /** Restaurant header (name, phone, back button) rendered above the menu. */
  restaurantHeader?: React.ReactNode;
}

const FoodListPage: React.FC<FoodListPageProps> = ({
  restaurantId,
  restaurantHeader,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const allCartItems = useSelector((state: RootState) => state.cart.items);
  const totalItems = useSelector((state: RootState) => state.cart.totalItems);
  // The cart spans restaurants; this page only manages this restaurant's lines.
  const cartItems = useMemo(
    () =>
      allCartItems.filter(
        (item) => getCartItemRestaurantId(item) === restaurantId
      ),
    [allCartItems, restaurantId]
  );

  const {
    data: items = [],
    isLoading,
    error,
  } = useRestaurantFoodItems({ restaurantId });
  // Restaurant for analytics (brand of each item): the menu page's, else the
  // id with the default name fallback.
  const currentRestaurant = useCurrentRestaurant();
  const { orderable } = useMenuOrdering();
  const analyticsRestaurant = useMemo<AnalyticsRestaurant>(
    () => resolveCartRestaurant({ restaurantId }, currentRestaurant),
    [restaurantId, currentRestaurant]
  );

  // GA4 view_item_list once per restaurant per mount, when its items load.
  const lastItemListRef = useRef<string | null>(null);
  useEffect(() => {
    if (isLoading || items.length === 0) return;
    if (lastItemListRef.current === analyticsRestaurant.id) return;
    lastItemListRef.current = analyticsRestaurant.id;
    trackEvent(
      'view_item_list',
      buildViewItemListParams(analyticsRestaurant, items)
    );
  }, [isLoading, items, analyticsRestaurant]);

  const { data: allMostReorderedItems = [] } = useMostReorderedItems();
  const mostReorderedItems = useMemo(
    () =>
      allMostReorderedItems.filter(
        (item) => (item.restaurantId || DEFAULT_RESTAURANT_ID) === restaurantId
      ),
    [allMostReorderedItems, restaurantId]
  );
  const [productDetailModal, setProductDetailModal] = useState(false);
  const [quantityUpdateModal, setQuantityUpdateModal] = useState(false);
  const [quantityUpdateItemID, setquantityUpdateItemID] = useState<string>();
  const [product, setProduct] = useState<FoodItem>();
  const [selectedCategory, setSelectedCategory] =
    useState<string>(ALL_CATEGORY);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [variantRemovalModal, setVariantRemovalModal] = useState(false);
  const [variantRemovalItemID, setVariantRemovalItemID] = useState<
    string | null
  >(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [scrollToItemId, setScrollToItemId] = useState<string | null>(null);
  const [vegAccordionExpanded, setVegAccordionExpanded] = useState(true);
  const [nonVegAccordionExpanded, setNonVegAccordionExpanded] = useState(true);
  const itemsContainerRef = useRef<HTMLDivElement>(null);

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

  // Filter items based on search query and selected category
  const filteredItems = useMemo(() => {
    const trimmedSearchQuery = searchQuery.trim();
    let results = items;

    // Apply search filter
    if (trimmedSearchQuery !== '') {
      const searchResults = fuse.search(trimmedSearchQuery);
      const scoreById = new Map(
        searchResults.map((result) => [result.item.id, result.score ?? 1])
      );
      const titlePriorityResults = results.filter(
        (item) => getTitleMatchRank(item.name, trimmedSearchQuery) > 0
      );
      const dedupedResults = new Map<string, FoodItem>();

      titlePriorityResults.forEach((item) => {
        dedupedResults.set(item.id, item);
      });

      searchResults.forEach((result) => {
        dedupedResults.set(result.item.id, result.item);
      });

      results = Array.from(dedupedResults.values()).sort((left, right) =>
        compareSearchResults(left, right, trimmedSearchQuery, scoreById)
      );
    } else if (selectedCategory !== ALL_CATEGORY) {
      // If no search, filter by selected category ("All" keeps every dish)
      results = results.filter((item) => item.category === selectedCategory);
    }

    return results;
  }, [searchQuery, selectedCategory, items, fuse]);

  // Search keeps relevance order; "All" groups by category, then cheapest first.
  const compareMenuItems = (a: FoodItem, b: FoodItem) => {
    if (searchQuery.trim() !== '') {
      return 0;
    }
    if (selectedCategory === ALL_CATEGORY) {
      const byCategory =
        CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
      if (byCategory !== 0) return byCategory;
    }
    return (getLowestNowPrice(a) ?? 0) - (getLowestNowPrice(b) ?? 0);
  };

  const vegFilteredItems = filteredItems
    .filter((item) => item.veg)
    .sort(compareMenuItems);
  const nonVegFilteredItems = filteredItems
    .filter((item) => !item.veg)
    .sort(compareMenuItems);

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

  const handleCart = (id: string, action: CartActions) => {
    // Restaurant closed (D15): the buttons are disabled; guard anyway.
    if (!orderable) return;
    const cartItem = cartItems.find((el) => el.id === id);
    const foodItem = items.find((el) => el.id === id);
    if (action === 'Add') {
      if (foodItem) {
        if (cartItem) {
          trackEvent('view_item_variant', {
            item_id: foodItem.id,
            item_name: foodItem.name,
            category: foodItem.category,
            variant_count: cartItems.filter((el) => el.id === id).length,
          });
        } else {
          trackEvent('view_item', {
            ...buildViewItemParams(foodItem, analyticsRestaurant),
            item_id: foodItem.id,
            item_name: foodItem.name,
            category: foodItem.category,
          });
        }
        setProductDetailModal(true);
        setProduct(foodItem);
      }
    } else if (action === 'Remove') {
      // Get all variants of this item
      const itemVariants = cartItems.filter((el) => el.id === id);

      if (itemVariants.length > 1) {
        trackEvent('open_variant_removal', {
          item_id: id,
          variant_count: itemVariants.length,
        });
        // Multiple variants exist - show modal to select which one to remove
        setVariantRemovalItemID(id);
        setVariantRemovalModal(true);
      } else if (itemVariants.length === 1) {
        // Single variant - remove directly
        trackEvent('remove_from_cart', {
          ...buildCartItemsParams([itemVariants[0]]),
          item_id: id,
          quantity: itemVariants[0].quantity,
        });
        dispatch(
          removeFromCart({
            id,
            option: itemVariants[0].option,
            isPromotionalAddon: !!itemVariants[0].isPromotionalAddon,
            isFreeClaim: !!itemVariants[0].isFreeClaim,
            restaurantId,
          })
        );
      }
    }
  };

  const handleVariantRemovalSelect = (variant: any) => {
    if (variant.option) {
      trackEvent('remove_from_cart', {
        ...buildCartItemsParams([variant]),
        item_id: variant.id,
        item_name: variant.name,
        quantity: variant.quantity,
      });
      dispatch(
        removeFromCart({
          id: variant.id,
          option: variant.option,
          isPromotionalAddon: !!variant.isPromotionalAddon,
          isFreeClaim: !!variant.isFreeClaim,
          restaurantId,
        })
      );
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

  // Categories that have items in this restaurant (all of them until loaded)
  const categories = useMemo(() => {
    const withItems = CATEGORY_ORDER.filter((category) =>
      items.some((item) => item.category === category)
    );
    return withItems.length > 0 ? withItems : CATEGORY_ORDER;
  }, [items]);

  // Another restaurant may not serve the default category.
  useEffect(() => {
    if (
      selectedCategory !== ALL_CATEGORY &&
      !(categories as string[]).includes(selectedCategory)
    ) {
      setSelectedCategory(ALL_CATEGORY);
    }
  }, [categories, selectedCategory]);

  if (isLoading) {
    return (
      <Container maxWidth="lg">
        {restaurantHeader}
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress aria-label="Loading menu" />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        {restaurantHeader}
        <Typography color="error" sx={{ py: 4, textAlign: 'center' }}>
          {error.message}
        </Typography>
      </Container>
    );
  }

  if (items.length === 0) {
    return (
      <Container maxWidth="lg">
        {restaurantHeader}
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h6" color="textSecondary">
            No dishes on this menu yet
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <>
      <Container maxWidth="lg">
        {restaurantHeader}
        {/* Most Reordered Section */}
        <MostReorderedSection
          items={mostReorderedItems}
          searchQuery={searchQuery}
          onCartAction={handleCart}
        />
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 20,
            backgroundColor: 'background.paper',
            pt: 2,
            pb: 1,
            paddingTop: 'env(safe-area-inset-top)',
          }}
        >
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
          </Box>

          <Tabs
            value={searchQuery ? false : selectedCategory}
            onChange={(_, newValue) => setSelectedCategory(newValue)}
            variant="scrollable"
            scrollButtons={false}
            allowScrollButtonsMobile
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: 'primary.main',
              },
              '& .MuiTab-root': {
                fontSize: '0.875rem',
                py: 1,
                opacity: searchQuery ? 0.5 : 1,
              },
            }}
          >
            <Tab label="All" value={ALL_CATEGORY} />
            {categories.map((category) => (
              <Tab key={category} label={category} value={category} />
            ))}
          </Tabs>
        </Box>

        {/* Results Display */}
        <Box
          ref={itemsContainerRef}
          sx={{ mt: 2, mb: totalItems > 0 ? 15 : 2 }}
        >
          {searchQuery.trim() !== '' ? (
            // Search Results - Show all items together, ignore veg/non-veg
            <>
              {filteredItems.length > 0 ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 2,
                    justifyContent: 'center',
                    // No side padding: more width for the cards on phones.
                    py: 1,
                    width: '100%',
                  }}
                >
                  {filteredItems.map((food: FoodItem) => (
                    <Box
                      key={`list_${food.id}`}
                      data-item-id={food.id}
                      sx={FOOD_CARD_SLOT_SX}
                    >
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
                        {food.veg ? '🥬 Veg' : '🍗 Non-Veg'}
                      </Typography>
                      <FoodItemCard
                        item={food}
                        handleCart={handleCart}
                        searchQuery={searchQuery}
                      />
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant="h6" color="textSecondary" sx={{ mb: 1 }}>
                    No items found matching your search
                  </Typography>
                  <Button
                    variant="text"
                    onClick={() => setSearchQuery('')}
                    sx={{ mt: 2 }}
                  >
                    Clear Search
                  </Button>
                </Box>
              )}
            </>
          ) : (
            // Category View - Show veg/non-veg accordions
            <>
              {/* Vegetarian Accordion (hidden when there are no veg dishes) */}
              {vegFilteredItems.length > 0 && (
                <Accordion
                  slotProps={{ heading: { component: 'h4' } }}
                  defaultExpanded
                  expanded={vegAccordionExpanded}
                  onChange={() =>
                    setVegAccordionExpanded(!vegAccordionExpanded)
                  }
                  sx={{
                    width: '100%',
                    backgroundColor: 'transparent',
                    boxShadow: 'none',
                    border: 'none',
                    transition: 'all 0.3s ease-in-out',
                    '&:before': {
                      display: 'none',
                    },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      padding: '0px 16px',
                      minHeight: '20px !important',
                      height: '20px',
                      alignItems: 'center',
                      transition: 'all 0.3s ease-in-out',
                      '&.Mui-expanded': {
                        minHeight: '20px !important',
                      },
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ lineHeight: 1 }}>
                      Vegetarian ({vegFilteredItems.length})
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails
                    sx={{
                      backgroundColor: 'transparent',
                      padding: 1,
                      transition: 'all 0.3s ease-in-out',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 2,
                        justifyContent: 'center',
                        // No side padding: more width for the cards on phones.
                        py: 1,
                        width: '100%',
                      }}
                    >
                      {vegFilteredItems.map((food: FoodItem) => (
                        <Box
                          key={`list_${food.id}`}
                          data-item-id={food.id}
                          sx={FOOD_CARD_SLOT_SX}
                        >
                          <FoodItemCard
                            item={food}
                            handleCart={handleCart}
                            searchQuery={searchQuery}
                          />
                        </Box>
                      ))}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              )}
              {vegFilteredItems.length > 0 &&
                nonVegFilteredItems.length > 0 && <Divider sx={{ my: 1 }} />}
              {/* Non-Vegetarian Accordion (hidden when there are no non-veg dishes) */}
              {nonVegFilteredItems.length > 0 && (
                <Accordion
                  slotProps={{ heading: { component: 'h4' } }}
                  defaultExpanded
                  expanded={nonVegAccordionExpanded}
                  onChange={() =>
                    setNonVegAccordionExpanded(!nonVegAccordionExpanded)
                  }
                  sx={{
                    width: '100%',
                    backgroundColor: 'transparent',
                    boxShadow: 'none',
                    border: 'none',
                    transition: 'all 0.3s ease-in-out',
                    '&:before': {
                      display: 'none',
                    },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      padding: '0px 16px',
                      minHeight: '20px !important',
                      height: '20px',
                      alignItems: 'center',
                      transition: 'all 0.3s ease-in-out',
                      '&.Mui-expanded': {
                        minHeight: '20px !important',
                      },
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ lineHeight: 1 }}>
                      Non-Vegetarian ({nonVegFilteredItems.length})
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails
                    sx={{
                      backgroundColor: 'transparent',
                      padding: 1,
                      transition: 'all 0.3s ease-in-out',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 2,
                        justifyContent: 'center',
                        // No side padding: more width for the cards on phones.
                        py: 1,
                        width: '100%',
                      }}
                    >
                      {nonVegFilteredItems.map((food: FoodItem) => (
                        <Box
                          key={`list_${food.id}`}
                          data-item-id={food.id}
                          sx={FOOD_CARD_SLOT_SX}
                        >
                          <FoodItemCard
                            item={food}
                            handleCart={handleCart}
                            searchQuery={searchQuery}
                          />
                        </Box>
                      ))}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Empty state message for category view */}
              {vegFilteredItems.length === 0 &&
                nonVegFilteredItems.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography
                      variant="h6"
                      color="textSecondary"
                      sx={{ mb: 1 }}
                    >
                      No items in this category
                    </Typography>
                  </Box>
                )}
            </>
          )}
        </Box>
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
      <Fab
        color="primary"
        aria-label="categories"
        onClick={handleMenuOpen}
        sx={{
          position: 'fixed',
          // Clears the cart bar (72px + the home-indicator inset).
          bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
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
                        {/* Falls back to a placeholder when the dish has no
                            image or it fails to load. */}
                        <FoodImage
                          src={item.image}
                          alt={item.name}
                          size={32}
                          sx={{ borderRadius: '4px' }}
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
