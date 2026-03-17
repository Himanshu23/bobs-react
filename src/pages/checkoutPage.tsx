import React, { useState } from 'react';
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

const WHATSAPP_PHONE = '9643310092'; // Replace with your number

interface HabitatTowers {
  [key: string]: string[];
}

const HABITAT_TOWERS: HabitatTowers = {
  'Habitat Old': ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'B1', 'B2', 'C'],
  'Habitat New': ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'],
};

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector((state: RootState) => state.cart.items);

  const [habitat, setHabitat] = useState<string>('');
  const [tower, setTower] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerInstructions, setCustomerInstructions] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset tower when habitat changes
  const handleHabitatChange = (event: SelectChangeEvent<string>) => {
    const newHabitat = event.target.value as string;
    setHabitat(newHabitat);
    setTower(''); // Reset tower selection
  };

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const tax = totalPrice * 0.05;
  const finalTotal = totalPrice + tax;

  const availableTowers = habitat ? HABITAT_TOWERS[habitat] || [] : [];

  const handleProceedToCheckout = async () => {
    if (!habitat || !tower) {
      alert('Please select Habitat and Tower');
      return;
    }

    setIsProcessing(true);

    try {
      // Format the order
      const orderMessage: OrderMessage = {
        items: cartItems.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price * item.quantity,
          size: item.option?.size,
        })),
        total: finalTotal,
        habitat,
        tower,
        customerName: customerName || 'Guest',
        phoneNumber: WHATSAPP_PHONE,
        instructions: customerInstructions,
      };

      // Format and send WhatsApp message
      const message = formatOrderMessage(orderMessage);
      openWhatsApp(WHATSAPP_PHONE, message);

      // Clear cart after successful order
      setTimeout(() => {
        dispatch(clearCart());
        navigate('/');
      }, 1000);
    } catch (error) {
      console.error('Error processing order:', error);
      alert('Error processing order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/cart')}
          sx={{ mb: 2 }}
        >
          Back to Cart
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Checkout
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Delivery Details Section */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                📍 Delivery Address
              </Typography>

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

              {/* Tower Selection */}
              <FormControl fullWidth disabled={!habitat}>
                <InputLabel>Select Tower</InputLabel>
                <Select
                  value={tower}
                  label="Select Tower"
                  onChange={(e) => setTower(e.target.value)}
                >
                  <MenuItem value="">-- Choose Tower --</MenuItem>
                  {availableTowers.map((t) => (
                    <MenuItem key={t} value={t}>
                      Tower {t}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Address Summary */}
              {habitat && tower && (
                <Alert severity="success" sx={{ mt: 3 }}>
                  📦 Delivering to:{' '}
                  <strong>
                    {habitat} - Tower {tower}
                  </strong>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Customer Instructions */}
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
                💡 Add any special instructions or dietary preferences here
              </Typography>
            </CardContent>
          </Card>

          {/* Order Items Summary */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                📋 Order Summary
              </Typography>
              <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                {cartItems.map((item, idx) => (
                  <React.Fragment key={idx}>
                    <ListItem sx={{ py: 1 }}>
                      <ListItemText
                        primary={`${item.name} ${
                          item.option?.size ? `(${item.option.size})` : ''
                        }`}
                        secondary={`Qty: ${item.quantity} × ₹${item.price.toFixed(
                          2
                        )}`}
                      />
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        ₹{(item.quantity * item.price).toFixed(2)}
                      </Typography>
                    </ListItem>
                    {idx < cartItems.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Price Summary Section */}
        <Grid item xs={12} md={4}>
          <Card sx={{ position: 'sticky', top: 20 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                💰 Price Summary
              </Typography>
              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 1,
                  }}
                >
                  <Typography color="textSecondary">Subtotal:</Typography>
                  <Typography>₹{totalPrice.toFixed(2)}</Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 1,
                  }}
                >
                  <Typography color="textSecondary">Delivery:</Typography>
                  <Typography color="#4CAF50">Free</Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 1,
                  }}
                >
                  <Typography color="textSecondary">Tax (5%):</Typography>
                  <Typography>₹{tax.toFixed(2)}</Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mb: 3,
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
                disabled={!habitat || !tower || isProcessing}
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
                onClick={() => navigate('/cart')}
              >
                Back to Cart
              </Button>

              {!habitat || !tower ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Select habitat and tower to proceed
                </Alert>
              ) : null}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CheckoutPage;
