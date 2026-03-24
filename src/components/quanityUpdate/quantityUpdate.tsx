import {
  Drawer,
  Box,
  Button,
  Typography,
  Divider,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { CartItem } from '../../types';
import QuantityUpdateCard from './quantityUpdateCard';
import ProductDetailModal from '../productDetail';
import PriceDisplay from '../PriceDisplay';
import { useDispatch, useSelector } from 'react-redux';
import { removeFromCart, updateQuantity } from '../../redux/store';
import { RootState } from '../../redux/store';
import { useEffect, useMemo, useState } from 'react';
import { selectFoodItemById } from '../../redux/selectors';

interface QuantityUpdateProps {
  open: boolean;
  itemID: string;
  onClose: () => void;
}

const QuantityUpdate = ({ open, onClose, itemID }: QuantityUpdateProps) => {
  const dispatch = useDispatch();
  const foodItem = useSelector(selectFoodItemById(itemID));
  const hasMultipleSizes =
    foodItem?.priceOptions.nowPrice.size &&
    Object.keys(foodItem.priceOptions.nowPrice.size).length > 1;
  const hasMultipleBases =
    foodItem?.priceOptions.nowPrice.base &&
    Object.keys(foodItem.priceOptions.nowPrice.base).length > 1;
  const hasMultipleStyles =
    foodItem?.priceOptions.nowPrice.type &&
    Object.keys(foodItem.priceOptions.nowPrice.type).length > 1;
  const showCustomizeOption =
    hasMultipleSizes || hasMultipleBases || hasMultipleStyles;
  const allCartItems = useSelector((state: RootState) => state.cart.items);
  const itemVariants = useMemo(
    () => allCartItems.filter((el) => el.id === itemID),
    [allCartItems, itemID]
  );
  const totalPrice = useMemo(
    () =>
      itemVariants.reduce(
        (sum, variant) => sum + variant.price * variant.quantity,
        0
      ),
    [itemVariants]
  );
  const [showProductDetail, setShowProductDetail] = useState(false);
  const product = itemVariants[0]?.product;

  useEffect(() => {
    if (!open || showProductDetail) {
      return;
    }

    if (itemVariants.length === 0) {
      onClose();
    }
  }, [open, itemVariants, onClose, showProductDetail]);

  const handleQuantityChange = (variant: CartItem, delta: number) => {
    const nextQuantity = Math.max(0, variant.quantity + delta);

    if (nextQuantity === 0) {
      dispatch(removeFromCart({ id: variant.id, option: variant.option }));
      return;
    }

    dispatch(
      updateQuantity({
        id: variant.id,
        option: variant.option,
        quantity: nextQuantity,
      })
    );
  };

  const handleDrawerClose = () => {
    onClose();
  };

  if (itemVariants.length === 0 && !showProductDetail) return <></>;

  return (
    <div>
      <Drawer
        anchor="bottom"
        open={open}
        onClose={handleDrawerClose}
        PaperProps={{
          sx: {
            borderRadius: '16px 16px 0 0',
            padding: 2,
            maxHeight: '90%',
            overflowY: 'auto',
          },
        }}
      >
        <Box
          p={2}
          sx={{
            boxShadow: 2,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography variant="h6" fontWeight="bold" textAlign="left">
              All Variants
            </Typography>
            <IconButton
              aria-label="Close quantity drawer"
              onClick={handleDrawerClose}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Manage your cart items
          </Typography>
          <Divider sx={{ mb: 1 }} />

          {/* Display all variants */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
            {itemVariants.map((variant, index) => (
              <Box key={index}>
                <QuantityUpdateCard
                  item={variant}
                  quantity={variant.quantity}
                  onDecrease={() => handleQuantityChange(variant, -1)}
                  onIncrease={() => handleQuantityChange(variant, 1)}
                />
                {index < itemVariants.length - 1 && <Divider sx={{ my: 2 }} />}
              </Box>
            ))}
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
              px: 0.5,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Total Price
            </Typography>
            <PriceDisplay nowPrice={totalPrice} nowVariant="h6" gap={0} />
          </Box>

          {showCustomizeOption && (
            <Button
              variant="outlined"
              color="primary"
              fullWidth
              sx={{ textTransform: 'none' }}
              onClick={() => setShowProductDetail(true)}
            >
              Add New Customization
            </Button>
          )}
        </Box>
      </Drawer>

      {showProductDetail && product && (
        <ProductDetailModal
          open={showProductDetail}
          onClose={() => {
            setShowProductDetail(false);
          }}
          product={product}
        />
      )}
    </div>
  );
};

export default QuantityUpdate;
