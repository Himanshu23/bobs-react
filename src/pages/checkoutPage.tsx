import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemText,
  Alert,
  Checkbox,
  FormControlLabel,
  RadioGroup,
  Radio,
  AppBar,
  Toolbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PrintIcon from '@mui/icons-material/Print';
import SaveIcon from '@mui/icons-material/Save';
import { RootState } from '../redux/store';
import { clearCart } from '../redux/store';
import {
  buildRestaurantSectionsFromCart,
  formatOrderMessage,
  formatRupees,
  openWhatsApp,
  OrderMessage,
  WhatsAppRestaurantSection,
} from '../utils/whatsappService';
import {
  getCheckoutFormFromLocalStorage,
  saveCheckoutFormToLocalStorage,
} from '../utils/checkoutStorage';
import { isAuthenticated, isAuthenticatedAndAdmin } from '../admin/auth';
import { getCustomerAuthState } from '../customer/auth';
import { DISCOUNTS, calculateDiscountAmount } from '../data/discounts';
import { trackEvent } from '../utils/analytics';
import {
  buildCartItemsParams,
  buildPurchaseEvents,
} from '../utils/analyticsItems';
import Receipt from '../components/Receipt';
import { printReceipt } from '../utils/printService';
import { usePlaceOrder } from '../data/hooks/usePlaceOrder';
import { useFoodItems } from '../data/hooks/useFoodItems';
import { useDeliveryArea } from '../data/hooks/useMarkets';
import { useRestaurantDirectory } from '../data/hooks/useRestaurants';
import { useGuardedAddToCart } from '../context/CartGuardContext';
import { FoodItem } from '../types';
import { useAddressBook } from '../context/AddressContext';
import { formatAddressForDelivery, SavedAddress } from '../types/address';
import CustomerOtpDialog from '../components/auth/CustomerOtpDialog';
import RestaurantPhoneLink from '../components/marketplace/RestaurantPhoneLink';
import { DeliveryArea, isWithinDeliveryArea } from '../utils/geo';
import { getCartItemMarketId, groupCartByRestaurant } from '../utils/cartUtils';
import {
  buildCreateOrderRequest,
  computePayableTotal,
  createFreeClaimCartItem,
  getDisplayDeliveryFee,
  getFreeClaimOptions,
  getFulfillmentType,
  describePlaceOrderError,
  PlaceOrderErrorInfo,
  isOrderRejected,
  getCheckoutOrders,
  summarizePlacedCheckout,
  willSplitPickup,
} from '../utils/checkoutOrder';
import { CustomerAuthResponseDTO } from '../types/customerAuth';
import { usePromotionalAddons } from '../data/hooks/usePromotionalAddons';
import PromotionalAddonBanner from '../components/promotionalAddons/PromotionalAddonBanner';
import PromotionalAddonSection from '../components/promotionalAddons/PromotionalAddonSection';
import CartItemPriceDisplay from '../components/promotionalAddons/CartItemPriceDisplay';
import {
  getCartPromoSavings,
  getQualifyingCartSubtotal,
} from '../utils/promotionalAddonStrategy';

const WHATSAPP_PHONE = '9643310092'; // Replace with your number
const GUEST_MINIMUM_ORDER_VALUE = 299;

/** What the confirmation dialog shows after WhatsApp opens. */
interface PlacedOrderSummary {
  /** D12 split pickup: each row is its own order (with `orderId`). */
  split: boolean;
  restaurants: WhatsAppRestaurantSection[];
  deliveryFee: number;
  /** The server's fee differs from the one shown before placing. */
  feeChanged: boolean;
  total: number;
  /** False when saving failed and WhatsApp was opened anyway. */
  saved: boolean;
}

const getPickupAddressFallback = (area: DeliveryArea): SavedAddress => {
  const now = Date.now();
  return {
    id: 'pickup-default',
    label: 'Other',
    formattedAddress: `${area.name} — Pickup`,
    line1: 'Pickup',
    landmark: '',
    lat: area.center.lat,
    lng: area.center.lng,
    createdAt: now,
    updatedAt: now,
  };
};

const formatScheduledTime = (time: string): string => {
  const [hoursText, minutes] = time.split(':');
  const hours = Number(hoursText);

  if (Number.isNaN(hours) || !minutes) {
    return time;
  }

  const period = hours >= 12 ? 'PM' : 'AM';
  const normalizedHours = hours % 12 || 12;

  return `${normalizedHours}:${minutes} ${period}`;
};

const createScheduleTimeOptions = (): string[] => {
  const options: string[] = [];

  for (let hour = 12; hour < 24; hour += 1) {
    for (const minutes of ['00', '30']) {
      options.push(`${String(hour).padStart(2, '0')}:${minutes}`);
    }
  }

  options.push('00:00');

  return options;
};

const SCHEDULE_TIME_OPTIONS = createScheduleTimeOptions();

// interface HabitatTowers {
//   [key: string]: string[];
// }

const getInitialCheckoutForm = () =>
  getCheckoutFormFromLocalStorage() ?? {
    deliveryMethod: 'delivery' as const,
    habitat: '',
    tower: '',
    flatNumber: '',
    customAddress: '',
    customerName: '',
  };

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const { data: menuItems = [] } = useFoodItems();
  const { mutateAsync: placeOrder } = usePlaceOrder();
  const addToCartGuarded = useGuardedAddToCart();
  const { restaurantsById, restaurantRefsById } = useRestaurantDirectory();
  // The cart is locked to one market (D5): its area and flat fee apply.
  const cartMarketId =
    cartItems.length > 0 ? getCartItemMarketId(cartItems[0]) : undefined;
  const { area: deliveryArea, market } = useDeliveryArea(cartMarketId);
  const { selectedAddress, addresses } = useAddressBook();
  const addressSectionRef = useRef<HTMLDivElement | null>(null);
  const receiptRef = useRef<HTMLDivElement | null>(null);
  const receiptPreviewRef = useRef<HTMLDivElement | null>(null);
  const initialCheckoutForm = getInitialCheckoutForm();
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [verifiedCustomerPhone, setVerifiedCustomerPhone] = useState<
    string | null
  >(() => getCustomerAuthState().customer?.phoneNumber ?? null);

  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>(
    initialCheckoutForm.deliveryMethod
  );
  const [habitat] = useState<string>(initialCheckoutForm.habitat);
  const [tower] = useState<string>(initialCheckoutForm.tower);
  const [flatNumber] = useState<string>(initialCheckoutForm.flatNumber);
  const [customAddress, setCustomAddress] = useState<string>(
    selectedAddress
      ? formatAddressForDelivery(selectedAddress)
      : initialCheckoutForm.customAddress
  );
  const [customerName, setCustomerName] = useState<string>(
    initialCheckoutForm.customerName
  );
  const [customerInstructions, setCustomerInstructions] = useState<string>('');
  const [orderTiming, setOrderTiming] = useState<'asap' | 'scheduled'>('asap');
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDiscountId, setSelectedDiscountId] = useState<string>('');
  const [orderConfirmationOpen, setOrderConfirmationOpen] = useState(false);
  const [recordSaleConfirmationOpen, setRecordSaleConfirmationOpen] =
    useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [paidOnline, setPaidOnline] = useState(false);
  const [addressError, setAddressError] = useState<string>('');
  const [scheduleError, setScheduleError] = useState<string>('');
  const [freeClaimDialogOpen, setFreeClaimDialogOpen] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrderSummary | null>(
    null
  );
  const [orderError, setOrderError] = useState<PlaceOrderErrorInfo | null>(
    null
  );

  useEffect(() => {
    if (selectedAddress) {
      setCustomAddress(formatAddressForDelivery(selectedAddress));
      setAddressError('');
    }
  }, [selectedAddress]);

  useEffect(() => {
    saveCheckoutFormToLocalStorage({
      deliveryMethod,
      habitat,
      tower,
      flatNumber,
      customAddress,
      customerName,
    });
  }, [customAddress, customerName, deliveryMethod, flatNumber, habitat, tower]);

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const { data: promoData, isFetching: isPromoFetching } =
    usePromotionalAddons(cartItems);
  const promoSavings = getCartPromoSavings(cartItems);
  const qualifyingSubtotal = getQualifyingCartSubtotal(cartItems);
  const hasFreeDish = cartItems.some((item) => item.isFreeClaim);
  const hasPromotionalDish = cartItems.some((item) => item.isPromotionalAddon);
  // Calculate discount
  const selectedDiscount = selectedDiscountId
    ? DISCOUNTS.find((d) => d.id === selectedDiscountId)
    : null;
  const discountAmount =
    selectedDiscount && !hasFreeDish && !hasPromotionalDish
      ? calculateDiscountAmount(selectedDiscount, totalPrice)
      : 0;

  // Calculate total after discount
  const totalAfterDiscount = totalPrice - discountAmount;
  const tax = totalAfterDiscount * 0.05;

  // const hasHabitatAddress = Boolean(
  //   habitat && tower && flatNumber && flatNumber.trim() !== ''
  // );
  const hasHabitatAddress = false;
  const hasSelectedSavedAddress = Boolean(selectedAddress);
  const isAdminLoggedIn = isAuthenticatedAndAdmin() || isAuthenticated();
  const isCustomerLoggedIn = getCustomerAuthState().isAuthenticated;
  const isGuestOrder =
    !isAdminLoggedIn && !isCustomerLoggedIn && !isAuthenticated();
  const isGuestOrderBelowMinimum =
    isGuestOrder && totalPrice < GUEST_MINIMUM_ORDER_VALUE;
  const fulfillmentType = getFulfillmentType(deliveryMethod, orderTiming);
  // Server rule, for every customer: market fee for delivery, ₹0 for pickup.
  const deliveryFee = getDisplayDeliveryFee(
    fulfillmentType,
    market?.deliveryFee
  );
  const finalTotal = computePayableTotal(
    totalPrice,
    discountAmount,
    deliveryFee
  );
  const restaurantGroups = groupCartByRestaurant(cartItems);
  const cartRestaurantNames = restaurantGroups.map(
    (group) =>
      restaurantsById.get(group.restaurantId)?.name || group.restaurantName
  );
  const restaurantNames = cartRestaurantNames.join(', ');
  // D12: the server places this as one order per restaurant.
  const isSplitPickup = willSplitPickup(
    fulfillmentType,
    restaurantGroups.length
  );
  // Only checked against the market from the API; with the fallback area the
  // server has the final say.
  const isSelectedAddressOutsideArea = Boolean(
    deliveryMethod === 'delivery' &&
      selectedAddress &&
      !deliveryArea.isFallback &&
      !isWithinDeliveryArea(
        selectedAddress.lat,
        selectedAddress.lng,
        deliveryArea
      )
  );
  const outsideAreaMessage = `This address is outside the ${deliveryArea.name} delivery area (${deliveryArea.radiusKm} km). Choose another address or switch to pickup.`;
  const appliedDiscountCode =
    discountAmount > 0 ? selectedDiscount?.code : undefined;
  const discountLabel = appliedDiscountCode
    ? `Discount (${appliedDiscountCode})`
    : 'Discount';
  const freeClaimOptions = getFreeClaimOptions(
    menuItems,
    cartItems,
    restaurantRefsById
  );
  const scheduledTimeLabel = scheduledTime
    ? formatScheduledTime(scheduledTime)
    : '';
  const isScheduledTimeValid = SCHEDULE_TIME_OPTIONS.includes(scheduledTime);

  const goToAddressFlow = () => {
    navigate('/addresses?return=/checkout');
  };

  const ensureDeliveryAddress = (): boolean => {
    if (deliveryMethod !== 'delivery') {
      return true;
    }

    if (hasSelectedSavedAddress) {
      if (isSelectedAddressOutsideArea) {
        setAddressError(outsideAreaMessage);
        addressSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
        return false;
      }
      return true;
    }

    setAddressError('Add a delivery address to continue.');
    goToAddressFlow();
    return false;
  };

  const getDeliveryAddressText = (): string => {
    if (deliveryMethod !== 'delivery') {
      return 'Pickup';
    }
    if (selectedAddress) {
      return formatAddressForDelivery(selectedAddress);
    }
    if (hasHabitatAddress) {
      return `${habitat} - Tower ${tower}, Flat ${flatNumber}`;
    }
    return customAddress.trim();
  };

  const buildOrderRequest = () =>
    buildCreateOrderRequest({
      cartItems,
      customerName: customerName || 'Guest',
      customerPhone:
        verifiedCustomerPhone ||
        getCustomerAuthState().customer?.phoneNumber ||
        WHATSAPP_PHONE,
      deliveryAddress: getDeliveryAddressText(),
      // The server checks it against the market area (delivery only).
      deliveryLocation: selectedAddress
        ? { lat: selectedAddress.lat, lng: selectedAddress.lng }
        : null,
      fulfillmentType,
      scheduledTime: orderTiming === 'scheduled' ? scheduledTime : undefined,
      discountAmount,
      discountCode: appliedDiscountCode,
      discountName: discountAmount > 0 ? selectedDiscount?.name : undefined,
      promotionalSavings: promoSavings,
      taxAmount: tax,
      isPaidOnline: paidOnline,
    });

  const buildWhatsAppMessage = (
    restaurants: WhatsAppRestaurantSection[],
    fee: number,
    total: number,
    savedToServer: boolean,
    separateOrders = false
  ): string => {
    const orderMessage: OrderMessage = {
      restaurants,
      total,
      deliveryAddress: getDeliveryAddressText(),
      customerName: customerName || 'Guest',
      instructions: customerInstructions,
      deliveryMethod,
      discountCode: appliedDiscountCode,
      discountName: discountAmount > 0 ? selectedDiscount?.name : undefined,
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
      deliveryFee: fee,
      tax,
      scheduledTime: orderTiming === 'scheduled' ? scheduledTime : undefined,
      savedToServer,
      separateOrders,
    };
    return formatOrderMessage(orderMessage);
  };

  const getAddressForOtp = (): SavedAddress | null => {
    if (selectedAddress) {
      return selectedAddress;
    }

    if (deliveryMethod === 'pickup') {
      return getPickupAddressFallback(deliveryArea);
    }

    return null;
  };

  const placeOrderAfterAuth = async () => {
    if (!ensureDeliveryAddress()) {
      return;
    }

    if (orderTiming === 'scheduled' && !isScheduledTimeValid) {
      setScheduleError('Choose a time between 12:00 PM and 12:00 AM.');
      return;
    }

    setAddressError('');
    setScheduleError('');
    setIsProcessing(true);

    setOrderError(null);
    const orderRequest = buildOrderRequest();

    try {
      const savedOrder = await placeOrder(orderRequest);
      // D12: a split pickup comes back as `groupOrders` (one per restaurant).
      // The server's fee is authoritative once the orders exist.
      const placed = summarizePlacedCheckout({
        response: savedOrder,
        cartItems,
        contacts: restaurantsById,
        displayedFee: deliveryFee,
        cartTotal: totalPrice,
        discountAmount,
      });
      console.log('Order(s) saved to database:', placed.orderIds.join(', '));

      // GA4 purchase: one per saved order (a split pickup is N orders, each
      // with its own transaction id and its restaurant's items). Not sent
      // for the unsaved WhatsApp fallback below.
      buildPurchaseEvents({
        response: savedOrder,
        cartItems,
        discountAmount,
        discountCode: appliedDiscountCode,
        deliveryFee: placed.deliveryFee,
      }).forEach((purchaseParams) =>
        trackEvent('purchase', {
          ...purchaseParams,
          delivery_method: deliveryMethod,
          split_pickup: placed.split,
        })
      );

      trackEvent('whatsapp_order_started', {
        delivery_method: deliveryMethod,
        item_count: cartItems.length,
        restaurant_count: placed.restaurants.length,
        order_count: placed.orderIds.length,
        value: placed.total,
        discount_id: selectedDiscountId || 'none',
      });
      openWhatsApp(
        WHATSAPP_PHONE,
        buildWhatsAppMessage(
          placed.restaurants,
          placed.deliveryFee,
          placed.total,
          true,
          placed.split
        )
      );
      setPlacedOrder({
        split: placed.split,
        restaurants: placed.restaurants,
        deliveryFee: placed.deliveryFee,
        feeChanged: placed.feeChanged,
        total: placed.total,
        saved: true,
      });
      setOrderConfirmationOpen(true);
    } catch (error) {
      console.error('Failed to save order to database:', error);

      if (isOrderRejected(error)) {
        // The server refused the order (outside the area, mixed markets,
        // inactive restaurant/item…): it can't be fulfilled as is, so don't
        // send it on WhatsApp. Let the customer fix it.
        trackEvent('order_rejected', {
          delivery_method: deliveryMethod,
          item_count: cartItems.length,
          reason: error instanceof Error ? error.message : 'unknown',
        });
        setOrderError(describePlaceOrderError(error));
        return;
      }

      // Network error or server failure: the order itself is fine, so keep
      // the old behaviour and still send it on WhatsApp (marked as not saved)
      // with the fee shown on screen and the cart grouped by restaurant.
      const restaurants = buildRestaurantSectionsFromCart(
        cartItems,
        restaurantsById
      );
      trackEvent('whatsapp_order_started', {
        delivery_method: deliveryMethod,
        item_count: cartItems.length,
        restaurant_count: restaurants.length,
        value: finalTotal,
        discount_id: selectedDiscountId || 'none',
        saved: false,
      });
      openWhatsApp(
        WHATSAPP_PHONE,
        buildWhatsAppMessage(restaurants, deliveryFee, finalTotal, false)
      );
      setPlacedOrder({
        split: false,
        restaurants,
        deliveryFee,
        feeChanged: false,
        total: finalTotal,
        saved: false,
      });
      setOrderConfirmationOpen(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const isCustomerAuthenticated = (): boolean => {
    return getCustomerAuthState().isAuthenticated;
  };

  const handleProceedToCheckout = async () => {
    if (isGuestOrderBelowMinimum) {
      setAddressError(
        `Orders must be at least ₹${GUEST_MINIMUM_ORDER_VALUE}. Please add more items.`
      );
      return;
    }

    if (!ensureDeliveryAddress()) {
      return;
    }

    if (orderTiming === 'scheduled' && !isScheduledTimeValid) {
      setScheduleError('Choose a time between 12:00 PM and 12:00 AM.');
      return;
    }
    //TODO: implement OTP verification for customers before placing order
    // if (!isCustomerAuthenticated()) {
    //   if (!getAddressForOtp()) {
    //     setAddressError('Add a delivery address before verifying your phone.');
    //     return;
    //   }
    //   setOtpDialogOpen(true);
    //   return;
    // }

    await placeOrderAfterAuth();
  };

  const handleOtpVerified = (auth: CustomerAuthResponseDTO) => {
    setVerifiedCustomerPhone(auth.customer.phoneNumber);
    setOtpDialogOpen(false);
    void placeOrderAfterAuth();
  };

  const handleClaimFreeItem = (foodItem: FoodItem) => {
    // Stamped with the dish's own restaurant/market from the restaurants
    // cache, not a market1 default.
    setSelectedDiscountId('');
    const freeClaimItem = createFreeClaimCartItem(foodItem, restaurantRefsById);
    trackEvent('add_to_cart', {
      ...buildCartItemsParams([freeClaimItem]),
      item_id: freeClaimItem.id,
      source: 'free_claim',
    });
    addToCartGuarded(freeClaimItem);
  };

  const handlePlaceOrderClick = () => {
    if (freeClaimOptions.length > 0) {
      setFreeClaimDialogOpen(true);
      return;
    }

    void handleProceedToCheckout();
  };

  const handleContinueToOrder = () => {
    setFreeClaimDialogOpen(false);
    void handleProceedToCheckout();
  };

  const handleRecordSaleOnly = async () => {
    if (!ensureDeliveryAddress()) {
      return;
    }

    if (orderTiming === 'scheduled' && !isScheduledTimeValid) {
      setScheduleError('Choose a time between 12:00 PM and 12:00 AM.');
      return;
    }

    setAddressError('');
    setScheduleError('');
    setOrderError(null);
    setIsProcessing(true);

    try {
      const savedOrder = await placeOrder(buildOrderRequest());
      console.log(
        'Sale recorded to database:',
        getCheckoutOrders(savedOrder)
          .map((order) => order.id)
          .join(', ')
      );
      setRecordSaleConfirmationOpen(true);
    } catch (error) {
      console.error('Failed to record sale:', error);
      setOrderError(
        isOrderRejected(error)
          ? describePlaceOrderError(error)
          : {
              message: 'Failed to record sale. Please try again.',
              action: 'dismiss',
            }
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOrderSentConfirmation = () => {
    trackEvent('purchase_confirmed', {
      delivery_method: deliveryMethod,
      item_count: cartItems.length,
      value: placedOrder?.total ?? finalTotal,
      currency: 'INR',
    });
    setOrderConfirmationOpen(false);
    setPlacedOrder(null);
    dispatch(clearCart());
    navigate('/');
  };

  const handleOrderNotSent = () => {
    trackEvent('whatsapp_order_not_sent', {
      delivery_method: deliveryMethod,
      item_count: cartItems.length,
      value: finalTotal,
    });
    setOrderConfirmationOpen(false);
  };

  const handlePrintBill = () => {
    setPrintModalOpen(true);
  };

  const handleConfirmPrint = () => {
    trackEvent('bill_printed', {
      delivery_method: deliveryMethod,
      item_count: cartItems.length,
      value: finalTotal,
    });
    setPrintModalOpen(false);
    printReceipt(receiptRef.current);
  };

  const handleCancelPrint = () => {
    setPrintModalOpen(false);
  };

  if (cartItems.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Your cart is empty. Please add items before checkout.
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
        >
          Back to Menu
        </Button>
      </Container>
    );
  }

  return (
    <>
      {/* App Bar - Consistent with theme */}
      <AppBar position="sticky" sx={{ mb: 2 }}>
        <Toolbar>
          <Button
            color="inherit"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/cart')}
            sx={{
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              mr: 2,
            }}
          >
            Review Cart
          </Button>
          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              textAlign: 'center',
              fontWeight: 700,
              color: '#fff',
            }}
          >
            Checkout
          </Typography>
          {/* Empty box for alignment symmetry */}
          <Box sx={{ width: '80px' }} />
        </Toolbar>
      </AppBar>

      <Dialog
        open={freeClaimDialogOpen}
        onClose={() => setFreeClaimDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Claim a free dish</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Pick any free-portion offer below. Claimed items will be added to
            your cart with zero cost.
          </DialogContentText>

          {freeClaimOptions.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {freeClaimOptions.map((item) => (
                <Box
                  key={item.id}
                  sx={{
                    border: '1px solid #e0e0e0',
                    borderRadius: 2,
                    p: 1.5,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {item.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Free {item.freeClaimPortion} portion
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleClaimFreeItem(item)}
                  >
                    Claim
                  </Button>
                </Box>
              ))}
            </Box>
          ) : (
            <Alert severity="info">
              There are no free-claim dishes available right now.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFreeClaimDialogOpen(false)}>Close</Button>
          <Button variant="contained" onClick={handleContinueToOrder}>
            Continue to Order
          </Button>
        </DialogActions>
      </Dialog>

      <Container maxWidth="lg" sx={{ py: 3, pb: 12 }}>
        <PromotionalAddonBanner
          promoData={promoData}
          cartSubtotal={qualifyingSubtotal}
        />
        <PromotionalAddonSection
          promoData={promoData}
          menuItems={menuItems}
          isUpdating={isPromoFetching}
        />

        <Grid container spacing={3}>
          {/* Delivery Details Section */}
          <Grid item xs={12} md={8}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                  � Delivery Method
                </Typography>

                <Alert severity="info" sx={{ mb: 3 }}>
                  Your address details are saved on this device.
                </Alert>

                {/* Pickup vs Delivery Radio Buttons */}
                <FormControl component="fieldset" sx={{ mb: 3 }}>
                  <RadioGroup
                    row
                    value={deliveryMethod}
                    onChange={(e) =>
                      setDeliveryMethod(e.target.value as 'delivery' | 'pickup')
                    }
                  >
                    <FormControlLabel
                      value="delivery"
                      control={<Radio />}
                      label="Delivery"
                    />
                    <FormControlLabel
                      value="pickup"
                      control={<Radio />}
                      label="Pickup"
                    />
                  </RadioGroup>
                </FormControl>

                {/* Address fields - Only show for delivery */}
                {deliveryMethod === 'delivery' && (
                  <Box ref={addressSectionRef}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                      Delivery Address
                    </Typography>

                    {addressError ? (
                      <Alert severity="error" sx={{ mb: 3 }}>
                        {addressError}
                      </Alert>
                    ) : null}

                    <TextField
                      fullWidth
                      label="Your Name (Optional)"
                      placeholder="Enter your name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      sx={{ mb: 3 }}
                    />

                    {selectedAddress ? (
                      <Alert severity="success" sx={{ mb: 2 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 700 }}
                        >
                          {selectedAddress.label}
                        </Typography>
                        <Typography variant="body2">
                          {formatAddressForDelivery(selectedAddress)}
                        </Typography>
                      </Alert>
                    ) : (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        No saved delivery address yet. Add one to place a
                        delivery order.
                      </Alert>
                    )}
                    {isSelectedAddressOutsideArea &&
                    addressError !== outsideAreaMessage ? (
                      <Alert severity="warning" sx={{ mb: 2 }}>
                        {outsideAreaMessage}
                      </Alert>
                    ) : null}

                    <Button
                      variant="outlined"
                      onClick={goToAddressFlow}
                      sx={{ textTransform: 'none' }}
                    >
                      {addresses.length > 0
                        ? 'Change address'
                        : 'Add delivery address'}
                    </Button>
                  </Box>
                )}

                {/* Pickup confirmation */}
                {deliveryMethod === 'pickup' && (
                  <Alert severity="info">
                    🎉 You selected <strong>Pickup</strong>. Your order will be
                    ready for pickup at {restaurantNames || 'the restaurant'}.
                  </Alert>
                )}
                {isSplitPickup && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Pickup from multiple restaurants will be placed as separate
                    orders, one per restaurant:
                    <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 2.5 }}>
                      {cartRestaurantNames.map((name, index) => (
                        <li key={restaurantGroups[index].restaurantId}>
                          {name}
                        </li>
                      ))}
                    </Box>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Customer Name for Pickup */}
            {deliveryMethod === 'pickup' && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <TextField
                    fullWidth
                    label="Your Name (Optional)"
                    placeholder="Enter your name for identification"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </CardContent>
              </Card>
            )}

            {/* Customer Instructions */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                  ⏰ Order Timing
                </Typography>
                <FormControl component="fieldset" sx={{ mb: 2 }}>
                  <RadioGroup
                    row
                    value={orderTiming}
                    onChange={(e) => {
                      const nextTiming = e.target.value as 'asap' | 'scheduled';
                      setOrderTiming(nextTiming);
                      if (nextTiming === 'asap') {
                        setScheduleError('');
                      }
                    }}
                  >
                    <FormControlLabel
                      value="asap"
                      control={<Radio />}
                      label="ASAP"
                    />
                    <FormControlLabel
                      value="scheduled"
                      control={<Radio />}
                      label="Schedule for later"
                    />
                  </RadioGroup>
                </FormControl>

                {orderTiming === 'scheduled' ? (
                  <>
                    <FormControl fullWidth>
                      <InputLabel>Choose Time</InputLabel>
                      <Select
                        value={scheduledTime}
                        label="Choose Time"
                        onChange={(e) => {
                          setScheduledTime(e.target.value);
                          setScheduleError('');
                        }}
                      >
                        <MenuItem value="">Select time</MenuItem>
                        {SCHEDULE_TIME_OPTIONS.map((timeOption) => (
                          <MenuItem key={timeOption} value={timeOption}>
                            {formatScheduledTime(timeOption)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1, display: 'block' }}
                    >
                      Available scheduling window: 12:00 PM to 12:00 AM.
                    </Typography>
                    {scheduledTimeLabel ? (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        Scheduled for {scheduledTimeLabel}
                      </Alert>
                    ) : null}
                    {scheduleError ? (
                      <Alert severity="error" sx={{ mt: 2 }}>
                        {scheduleError}
                      </Alert>
                    ) : null}
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Your order will be treated as immediate.
                  </Typography>
                )}
              </CardContent>
            </Card>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                  📝 Special Instructions
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Any special requests? (Optional)"
                  placeholder="e.g., Extra spicy, No onions, Extra sauce, etc."
                  value={customerInstructions}
                  onChange={(e) => setCustomerInstructions(e.target.value)}
                  variant="outlined"
                />
                <Typography
                  variant="caption"
                  color="textSecondary"
                  sx={{ mt: 1, display: 'block' }}
                >
                  💡 Add any special instructions or dietary preferences here.
                  Saved locally on this device.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Order Review Sidebar */}
          <Grid item xs={12} md={4}>
            <Card sx={{ position: 'sticky', top: 20 }}>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1.5,
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    📋 Review Order
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {cartItems.length} item{cartItems.length > 1 ? 's' : ''}
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />

                <List sx={{ maxHeight: 240, overflow: 'auto', mb: 1.5, py: 0 }}>
                  {cartItems.map((item, idx) => (
                    <React.Fragment
                      key={`${item.id}-${JSON.stringify(item.option)}-${item.isPromotionalAddon ? 'promo' : ''}`}
                    >
                      <ListItem
                        sx={{ py: 0.75, px: 0, alignItems: 'flex-start' }}
                      >
                        <ListItemText
                          primary={`${item.name} ${
                            item.option?.size ? `(${item.option.size})` : ''
                          }${item.isPromotionalAddon ? ' · ₹9 Deal' : ''}`}
                          secondary={
                            item.isPromotionalAddon && item.originalPrice ? (
                              <Box
                                component="span"
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                }}
                              >
                                <Typography
                                  component="span"
                                  variant="caption"
                                  sx={{
                                    textDecoration: 'line-through',
                                    color: 'text.secondary',
                                  }}
                                >
                                  ₹{item.originalPrice.toFixed(0)}
                                </Typography>
                                <Typography component="span" variant="caption">
                                  ₹{item.price.toFixed(0)} × {item.quantity}
                                </Typography>
                              </Box>
                            ) : (
                              `Qty: ${item.quantity} × ₹${item.price.toFixed(2)}`
                            )
                          }
                          primaryTypographyProps={{
                            variant: 'body2',
                            fontWeight: 600,
                          }}
                          secondaryTypographyProps={{
                            variant: 'caption',
                            component: 'div',
                          }}
                        />
                        <CartItemPriceDisplay item={item} compact />
                      </ListItem>
                      {idx < cartItems.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>

                <Divider sx={{ my: 1.5 }} />

                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, mb: 1 }}
                  >
                    🎁 Discount
                  </Typography>
                  <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                    <InputLabel>Select Discount</InputLabel>
                    <Select
                      value={selectedDiscountId}
                      label="Select Discount"
                      disabled={hasFreeDish || hasPromotionalDish}
                      onChange={(e) => setSelectedDiscountId(e.target.value)}
                    >
                      <MenuItem value="">No Discount</MenuItem>
                      {DISCOUNTS.filter((d) => d.active).map((discount) => (
                        <MenuItem key={discount.id} value={discount.id}>
                          {discount.name} -{' '}
                          {discount.percent > 0
                            ? `${discount.percent}%`
                            : `₹${discount.fixedValue}`}
                          {discount.code && ` (${discount.code})`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {(hasFreeDish || hasPromotionalDish) && (
                    <Typography variant="caption" color="text.secondary">
                      Discounts are unavailable when a free dish is selected.
                    </Typography>
                  )}
                  {selectedDiscount && (
                    <Typography
                      variant="caption"
                      sx={{
                        color:
                          totalPrice < selectedDiscount.minValue
                            ? '#ff0000'
                            : 'textSecondary',
                        fontWeight:
                          totalPrice < selectedDiscount.minValue
                            ? 'bold'
                            : 'normal',
                        display: 'block',
                      }}
                    >
                      {totalPrice < selectedDiscount.minValue ? '⚠️ ' : '📌 '}
                      {selectedDiscount.description}
                      <br />
                      Min: ₹{selectedDiscount.minValue} | Max Cap: ₹
                      {selectedDiscount.maxCap}
                      {totalPrice < selectedDiscount.minValue && (
                        <>
                          <br />❌ Not applicable - Add ₹
                          {(selectedDiscount.minValue - totalPrice).toFixed(2)}{' '}
                          more to unlock this discount
                        </>
                      )}
                    </Typography>
                  )}
                </Box>

                <Divider sx={{ my: 1.5 }} />

                <Box sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 0.75,
                    }}
                  >
                    <Typography variant="body2" color="textSecondary">
                      Subtotal
                    </Typography>
                    <Typography variant="body2">
                      ₹{totalPrice.toFixed(2)}
                    </Typography>
                  </Box>
                  {promoSavings > 0 && (
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 0.75,
                      }}
                    >
                      <Typography variant="body2" color="#2e7d32">
                        ₹9 Deal savings
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#2e7d32' }}>
                        −₹{promoSavings.toFixed(0)}
                      </Typography>
                    </Box>
                  )}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 0.75,
                    }}
                  >
                    <Typography variant="body2" color="textSecondary">
                      Delivery
                    </Typography>
                    <Typography
                      variant="body2"
                      color={deliveryFee > 0 ? 'text.primary' : '#4CAF50'}
                    >
                      {deliveryFee > 0 ? `₹${deliveryFee.toFixed(2)}` : 'Free'}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 0.75,
                    }}
                  >
                    <Typography variant="body2" color="textSecondary">
                      Order Timing
                    </Typography>
                    <Typography variant="body2">
                      {orderTiming === 'scheduled' && scheduledTimeLabel
                        ? scheduledTimeLabel
                        : 'ASAP'}
                    </Typography>
                  </Box>
                  {discountAmount > 0 && (
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 0.75,
                      }}
                    >
                      <Typography variant="body2" color="textSecondary">
                        {discountLabel}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 'bold', color: '#4CAF50' }}
                      >
                        -₹{discountAmount.toFixed(2)}
                      </Typography>
                    </Box>
                  )}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 0.5,
                      opacity: 0.7,
                    }}
                  >
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      sx={{ textDecoration: 'line-through' }}
                    >
                      Tax (5%)
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ textDecoration: 'line-through' }}
                    >
                      ₹{tax.toFixed(2)}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Tax is shown for reference and is not added to the payable
                    total.
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Total:
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 'bold', color: '#ff6b6b' }}
                    >
                      ₹{finalTotal.toFixed(2)}
                    </Typography>
                    <Tooltip title="Print Label">
                      <IconButton
                        onClick={handlePrintBill}
                        size="small"
                        sx={{
                          backgroundColor: '#1976d2',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: '#1565c0',
                          },
                        }}
                      >
                        <PrintIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<WhatsAppIcon />}
                  onClick={handlePlaceOrderClick}
                  disabled={isProcessing || isGuestOrderBelowMinimum}
                  sx={{
                    background:
                      'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                    textTransform: 'none',
                    fontSize: '1rem',
                    mb: 1,
                  }}
                >
                  {isProcessing ? 'Processing...' : 'Order via WhatsApp'}
                </Button>

                {isGuestOrderBelowMinimum && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Orders must be at least ₹{GUEST_MINIMUM_ORDER_VALUE}. Add
                    more items to continue.
                  </Alert>
                )}

                {isAdminLoggedIn && (
                  <Box sx={{ mb: 2 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={paidOnline}
                          onChange={(e) => setPaidOnline(e.target.checked)}
                          color="primary"
                        />
                      }
                      label="Paid online"
                    />
                    <Button
                      variant="outlined"
                      fullWidth
                      size="large"
                      startIcon={<SaveIcon />}
                      onClick={handleRecordSaleOnly}
                      disabled={isProcessing}
                      sx={{ mt: 1, textTransform: 'none' }}
                    >
                      {isProcessing ? 'Saving sale...' : 'Record sale only'}
                    </Button>
                  </Box>
                )}

                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<ArrowBackIcon />}
                  onClick={() => navigate('/cart')}
                >
                  Review Cart and Edit Items
                </Button>

                {deliveryMethod === 'delivery' && !hasSelectedSavedAddress ? (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Add a delivery address before placing your order.
                  </Alert>
                ) : null}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Fixed Footer with Action Buttons */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          borderTop: '2px solid #25D366',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          backdropFilter: 'blur(10px)',
        }}
      ></Box>

      <Dialog
        open={orderConfirmationOpen}
        onClose={handleOrderNotSent}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Did you send the order?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            WhatsApp opened 😊 Confirm if you sent the order, or go back to edit
            your cart.
          </DialogContentText>
          {placedOrder && !placedOrder.saved ? (
            <Alert severity="warning" sx={{ mt: 2 }}>
              We couldn&apos;t save your order in the app, but you can still
              send it on WhatsApp and we&apos;ll take it from there.
            </Alert>
          ) : null}
          {placedOrder && placedOrder.restaurants.length > 0 ? (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                {placedOrder.split
                  ? `Placed as ${placedOrder.restaurants.length} separate orders, one per restaurant`
                  : 'Your order is from'}
              </Typography>
              {placedOrder.restaurants.map((restaurant) => (
                <Box
                  key={restaurant.restaurantId}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 1,
                    py: 0.75,
                    borderBottom: '1px solid #eee',
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    {placedOrder.split && restaurant.orderId ? (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', wordBreak: 'break-all' }}
                      >
                        Order #{restaurant.orderId}
                      </Typography>
                    ) : null}
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {restaurant.name}
                    </Typography>
                    {restaurant.phone ? (
                      <RestaurantPhoneLink
                        phone={restaurant.phone}
                        restaurantId={restaurant.restaurantId}
                        source="order_confirmation"
                      />
                    ) : null}
                  </Box>
                  <Typography variant="body2">
                    {formatRupees(restaurant.subtotal)}
                  </Typography>
                </Box>
              ))}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mt: 1,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Delivery fee
                </Typography>
                <Typography variant="body2">
                  {placedOrder.deliveryFee > 0
                    ? formatRupees(placedOrder.deliveryFee)
                    : 'Free'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {placedOrder.split
                    ? 'Total to pay (all orders)'
                    : 'Total to pay'}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {formatRupees(placedOrder.total)}
                </Typography>
              </Box>
              {placedOrder.feeChanged ? (
                <Alert severity="info" sx={{ mt: 1.5 }}>
                  The delivery fee for this order is{' '}
                  {formatRupees(placedOrder.deliveryFee)} (you were shown{' '}
                  {formatRupees(deliveryFee)}). The total above and in WhatsApp
                  uses the updated fee.
                </Alert>
              ) : null}
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleOrderNotSent} variant="outlined">
            No
          </Button>
          <Button onClick={handleOrderSentConfirmation} variant="contained">
            Yes
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(orderError)}
        onClose={() => setOrderError(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Order not placed</DialogTitle>
        <DialogContent>
          <DialogContentText>{orderError?.message}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {orderError?.action === 'change-address' ? (
            <Button
              onClick={() => {
                setOrderError(null);
                goToAddressFlow();
              }}
              variant="contained"
            >
              Change address
            </Button>
          ) : null}
          {orderError?.action === 'review-cart' ? (
            <Button
              onClick={() => {
                setOrderError(null);
                navigate('/cart');
              }}
              variant="contained"
            >
              Review cart
            </Button>
          ) : null}
          <Button onClick={() => setOrderError(null)} variant="outlined">
            {orderError?.action === 'dismiss' ? 'OK' : 'Close'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={recordSaleConfirmationOpen}
        onClose={() => {
          setRecordSaleConfirmationOpen(false);
          dispatch(clearCart());
          navigate('/');
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Sale recorded</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The sale has been recorded successfully. You can continue browsing
            or start a new order.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setRecordSaleConfirmationOpen(false);
              dispatch(clearCart());
              navigate('/');
            }}
            variant="contained"
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>

      {/* Print Preview Modal */}
      <Dialog
        open={printModalOpen}
        onClose={handleCancelPrint}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>Print Receipt</DialogTitle>
        <DialogContent
          sx={{
            display: 'flex',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5',
            py: 3,
            minHeight: '500px',
            overflowY: 'auto',
          }}
        >
          <Box
            sx={{
              backgroundColor: '#fff',
              borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <Receipt
              ref={receiptPreviewRef}
              cartItems={cartItems}
              totalPrice={totalPrice}
              discountAmount={discountAmount}
              finalTotal={finalTotal}
              deliveryFee={deliveryFee}
              customerName={customerName}
              deliveryMethod={deliveryMethod}
              deliveryAddress={
                deliveryMethod === 'delivery'
                  ? hasHabitatAddress
                    ? `${habitat} - Tower ${tower}, Flat ${flatNumber}`
                    : customAddress.trim()
                  : `Pickup from ${restaurantNames || 'the restaurant'}`
              }
              customerInstructions={customerInstructions}
              scheduledTime={
                orderTiming === 'scheduled' ? scheduledTime : undefined
              }
              discountCode={appliedDiscountCode}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCancelPrint} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmPrint}
            variant="contained"
            startIcon={<PrintIcon />}
          >
            Print Now
          </Button>
        </DialogActions>
      </Dialog>

      {/* Hidden Receipt for Printing */}
      <Box sx={{ display: 'none' }}>
        <Receipt
          ref={receiptRef}
          cartItems={cartItems}
          totalPrice={totalPrice}
          discountAmount={discountAmount}
          finalTotal={finalTotal}
          deliveryFee={deliveryFee}
          customerName={customerName}
          deliveryMethod={deliveryMethod}
          deliveryAddress={
            deliveryMethod === 'delivery'
              ? hasHabitatAddress
                ? `${habitat} - Tower ${tower}, Flat ${flatNumber}`
                : customAddress.trim()
              : `Pickup from ${restaurantNames || 'the restaurant'}`
          }
          customerInstructions={customerInstructions}
          scheduledTime={
            orderTiming === 'scheduled' ? scheduledTime : undefined
          }
          discountCode={appliedDiscountCode}
        />
      </Box>

      <CustomerOtpDialog
        open={otpDialogOpen}
        address={getAddressForOtp()}
        onClose={() => setOtpDialogOpen(false)}
        onVerified={handleOtpVerified}
      />
    </>
  );
};

export default CheckoutPage;
