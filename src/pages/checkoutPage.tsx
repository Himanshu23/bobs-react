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
  SelectChangeEvent,
  Divider,
  List,
  ListItem,
  ListItemText,
  Alert,
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
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { RootState } from '../redux/store';
import { clearCart } from '../redux/store';
import {
  formatOrderMessage,
  openWhatsApp,
  OrderMessage,
} from '../utils/whatsappService';
import {
  getCheckoutFormFromLocalStorage,
  saveCheckoutFormToLocalStorage,
} from '../utils/checkoutStorage';
import { DISCOUNTS, calculateDiscountAmount } from '../data/discounts';
import { trackEvent } from '../utils/analytics';

const WHATSAPP_PHONE = '9643310092'; // Replace with your number

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

interface HabitatTowers {
  [key: string]: string[];
}

const HABITAT_TOWERS: HabitatTowers = {
  'Habitat Old': ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'B1', 'B2', 'C'],
  'Habitat New': ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'E'],
};

const getInitialCheckoutForm = () =>
  getCheckoutFormFromLocalStorage() ?? {
    deliveryMethod: 'delivery' as const,
    habitat: '',
    tower: '',
    flatNumber: '',
    customAddress: '',
    customerName: '',
    customerInstructions: '',
    orderTiming: 'asap' as const,
    scheduledTime: '',
  };

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const addressSectionRef = useRef<HTMLDivElement | null>(null);
  const initialCheckoutForm = getInitialCheckoutForm();

  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>(
    initialCheckoutForm.deliveryMethod
  );
  const [habitat, setHabitat] = useState<string>(initialCheckoutForm.habitat);
  const [tower, setTower] = useState<string>(initialCheckoutForm.tower);
  const [flatNumber, setFlatNumber] = useState<string>(
    initialCheckoutForm.flatNumber
  );
  const [customAddress, setCustomAddress] = useState<string>(
    initialCheckoutForm.customAddress
  );
  const [customerName, setCustomerName] = useState<string>(
    initialCheckoutForm.customerName
  );
  const [customerInstructions, setCustomerInstructions] = useState<string>(
    initialCheckoutForm.customerInstructions
  );
  const [orderTiming, setOrderTiming] = useState<'asap' | 'scheduled'>(
    initialCheckoutForm.orderTiming
  );
  const [scheduledTime, setScheduledTime] = useState<string>(
    initialCheckoutForm.scheduledTime
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDiscountId, setSelectedDiscountId] = useState<string>('');
  const [orderConfirmationOpen, setOrderConfirmationOpen] = useState(false);
  const [addressError, setAddressError] = useState<string>('');
  const [scheduleError, setScheduleError] = useState<string>('');

  useEffect(() => {
    saveCheckoutFormToLocalStorage({
      deliveryMethod,
      habitat,
      tower,
      flatNumber,
      customAddress,
      customerName,
      customerInstructions,
      orderTiming,
      scheduledTime,
    });
  }, [
    customAddress,
    customerInstructions,
    customerName,
    deliveryMethod,
    flatNumber,
    habitat,
    orderTiming,
    scheduledTime,
    tower,
  ]);

  // Reset tower when habitat changes
  const handleHabitatChange = (event: SelectChangeEvent<string>) => {
    const newHabitat = event.target.value as string;
    setHabitat(newHabitat);
    setTower(''); // Reset tower selection
    setAddressError('');
  };

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Calculate discount
  const selectedDiscount = selectedDiscountId
    ? DISCOUNTS.find((d) => d.id === selectedDiscountId)
    : null;
  const discountAmount = selectedDiscount
    ? calculateDiscountAmount(selectedDiscount, totalPrice)
    : 0;

  // Calculate total after discount
  const totalAfterDiscount = totalPrice - discountAmount;
  const tax = totalAfterDiscount * 0.05;
  const finalTotal = totalAfterDiscount;

  const availableTowers = habitat ? HABITAT_TOWERS[habitat] || [] : [];
  const hasHabitatAddress = Boolean(
    habitat && tower && flatNumber && flatNumber.trim() !== ''
  );
  const hasCustomAddress = Boolean(
    customAddress && customAddress.trim() !== ''
  );
  const hasDeliveryAddress = hasHabitatAddress || hasCustomAddress;
  const appliedDiscountCode =
    discountAmount > 0 ? selectedDiscount?.code : undefined;
  const discountLabel = appliedDiscountCode
    ? `Discount (${appliedDiscountCode})`
    : 'Discount';
  const scheduledTimeLabel = scheduledTime
    ? formatScheduledTime(scheduledTime)
    : '';
  const isScheduledTimeValid = SCHEDULE_TIME_OPTIONS.includes(scheduledTime);

  const scrollToAddressSection = () => {
    addressSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const handleProceedToCheckout = async () => {
    // Validation based on delivery method
    if (deliveryMethod === 'delivery' && !hasDeliveryAddress) {
      setAddressError(
        'Add either Habitat, Tower and Flat Number, or enter your full address to continue.'
      );
      scrollToAddressSection();
      return;
    }

    if (orderTiming === 'scheduled' && !isScheduledTimeValid) {
      setScheduleError('Choose a time between 12:00 PM and 12:00 AM.');
      return;
    }

    setAddressError('');
    setScheduleError('');

    setIsProcessing(true);

    try {
      let deliveryAddress = '';
      if (deliveryMethod === 'delivery') {
        if (hasHabitatAddress) {
          deliveryAddress = `${habitat} - Tower ${tower}, Flat ${flatNumber}`;
        } else {
          deliveryAddress = customAddress.trim();
        }
      }

      // Format the order
      const orderMessage: OrderMessage = {
        items: cartItems.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price * item.quantity,
          size: item.option?.size,
        })),
        total: finalTotal,
        habitat: deliveryMethod === 'delivery' ? deliveryAddress : 'Pickup',
        tower:
          deliveryMethod === 'delivery'
            ? hasHabitatAddress
              ? tower
              : 'Custom'
            : 'N/A',
        customerName: customerName || 'Guest',
        phoneNumber: WHATSAPP_PHONE,
        instructions: customerInstructions,
        deliveryMethod: deliveryMethod as 'pickup' | 'delivery',
        flatNumber: hasHabitatAddress ? flatNumber.trim() : undefined,
        discountCode: appliedDiscountCode,
        discountName: discountAmount > 0 ? selectedDiscount?.name : undefined,
        discountAmount: discountAmount > 0 ? discountAmount : undefined,
        tax,
        scheduledTime: orderTiming === 'scheduled' ? scheduledTime : undefined,
      };

      // Format and send WhatsApp message
      const message = formatOrderMessage(orderMessage);
      trackEvent('whatsapp_order_started', {
        delivery_method: deliveryMethod,
        item_count: cartItems.length,
        value: finalTotal,
        discount_id: selectedDiscountId || 'none',
      });
      openWhatsApp(WHATSAPP_PHONE, message);
      setOrderConfirmationOpen(true);
    } catch (error) {
      console.error('Error processing order:', error);
      alert('Error processing order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOrderSentConfirmation = () => {
    trackEvent('purchase_confirmed', {
      delivery_method: deliveryMethod,
      item_count: cartItems.length,
      value: finalTotal,
      currency: 'INR',
    });
    setOrderConfirmationOpen(false);
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

      <Container maxWidth="lg" sx={{ py: 3, pb: 12 }}>
        <Grid container spacing={3}>
          {/* Delivery Details Section */}
          <Grid item xs={12} md={8}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                  � Delivery Method
                </Typography>

                <Alert severity="info" sx={{ mb: 3 }}>
                  Your address details and special instructions are saved on
                  this device, so you can review the cart and come back without
                  re-entering them.
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
                      📍 Delivery Address
                    </Typography>

                    {addressError ? (
                      <Alert severity="error" sx={{ mb: 3 }}>
                        {addressError}
                      </Alert>
                    ) : null}

                    {/* Customer Name */}
                    <TextField
                      fullWidth
                      label="Your Name (Optional)"
                      placeholder="Enter your name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      sx={{ mb: 3 }}
                    />

                    {/* Habitat Selection */}
                    <FormControl fullWidth sx={{ mb: 3 }}>
                      <InputLabel>Select Habitat</InputLabel>
                      <Select
                        value={habitat}
                        label="Select Habitat"
                        onChange={handleHabitatChange}
                      >
                        <MenuItem value="">-- Choose Habitat --</MenuItem>
                        {Object.keys(HABITAT_TOWERS).map((h) => (
                          <MenuItem key={h} value={h}>
                            {h}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {/* Two Options Side by Side */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      {/* Option 1: Tower + Flat Number */}
                      <Grid item xs={12} md={5}>
                        <Box
                          sx={{
                            border: '2px solid #e0e0e0',
                            borderRadius: '12px',
                            padding: 3,
                            backgroundColor: '#fafafa',
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 'bold',
                              mb: 2,
                              color: '#333',
                            }}
                          >
                            🏢 Tower & Flat
                          </Typography>

                          {/* Tower and Flat - Side by Side */}
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <FormControl
                                fullWidth
                                size="small"
                                disabled={!habitat}
                              >
                                <InputLabel>Tower</InputLabel>
                                <Select
                                  value={tower}
                                  label="Tower"
                                  onChange={(e) => {
                                    setTower(e.target.value);
                                    setAddressError('');
                                  }}
                                >
                                  <MenuItem value="">Select</MenuItem>
                                  {availableTowers.map((t) => (
                                    <MenuItem key={t} value={t}>
                                      {t}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Grid>
                            <Grid item xs={6}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Flat No."
                                placeholder="e.g., 502"
                                value={flatNumber}
                                onChange={(e) => {
                                  setFlatNumber(e.target.value);
                                  setAddressError('');
                                }}
                              />
                            </Grid>
                          </Grid>

                          {/* Address Preview */}
                          {hasHabitatAddress && (
                            <Alert severity="success" sx={{ mt: 2 }}>
                              <Typography variant="caption">
                                📦 {habitat} - Tower {tower}, Flat {flatNumber}
                              </Typography>
                            </Alert>
                          )}
                        </Box>
                      </Grid>

                      {/* OR Divider */}
                      <Grid item xs={12} md={2}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            minHeight: '10px',
                          }}
                        >
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 'bold',
                                color: '#999',
                                fontSize: '1.1rem',
                              }}
                            >
                              OR
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>

                      {/* Option 2: Free Text Address */}
                      <Grid item xs={12} md={5}>
                        <Box
                          sx={{
                            border: '2px solid #e0e0e0',
                            borderRadius: '12px',
                            padding: 3,
                            backgroundColor: '#fafafa',
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 'bold',
                              mb: 2,
                              color: '#333',
                            }}
                          >
                            📍 Other Address
                          </Typography>

                          <TextField
                            fullWidth
                            label="Enter Your Address"
                            placeholder="e.g., 123 Main Street, Apartment 4B"
                            value={customAddress}
                            onChange={(e) => {
                              setCustomAddress(e.target.value);
                              setAddressError('');
                            }}
                            multiline
                            rows={3}
                            size="small"
                          />

                          {/* Address Preview */}
                          {customAddress && (
                            <Alert severity="success" sx={{ mt: 2 }}>
                              <Typography variant="caption">
                                📦 {customAddress}
                              </Typography>
                            </Alert>
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                {/* Pickup confirmation */}
                {deliveryMethod === 'pickup' && (
                  <Alert severity="info">
                    🎉 You selected <strong>Pickup</strong>. Your order will be
                    ready for pickup at Bob&apos;s kitchen.
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
                    <React.Fragment key={idx}>
                      <ListItem
                        sx={{ py: 0.75, px: 0, alignItems: 'flex-start' }}
                      >
                        <ListItemText
                          primary={`${item.name} ${
                            item.option?.size ? `(${item.option.size})` : ''
                          }`}
                          secondary={`Qty: ${item.quantity} × ₹${item.price.toFixed(
                            2
                          )}`}
                          primaryTypographyProps={{
                            variant: 'body2',
                            fontWeight: 600,
                          }}
                          secondaryTypographyProps={{
                            variant: 'caption',
                          }}
                        />
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 'bold', pt: 0.25 }}
                        >
                          ₹{(item.quantity * item.price).toFixed(2)}
                        </Typography>
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
                    <Typography variant="body2" color="#4CAF50">
                      Free
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
                    mb: 2,
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Total:
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 'bold', color: '#ff6b6b' }}
                  >
                    ₹{finalTotal.toFixed(2)}
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<WhatsAppIcon />}
                  onClick={handleProceedToCheckout}
                  disabled={isProcessing}
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

                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<ArrowBackIcon />}
                  onClick={() => navigate('/cart')}
                >
                  Review Cart and Edit Items
                </Button>

                {deliveryMethod === 'delivery' && !hasDeliveryAddress ? (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Add a delivery address. If you tap the button first, the
                    page will jump to the address section.
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
    </>
  );
};

export default CheckoutPage;
