import { Drawer, Box, Button, Typography, Divider } from '@mui/material';
import { CartActions } from '../../types';
import QuantityUpdateCard from './quantityUpdateCard';
import ProductDetailModal from '../productDetail';
import { useDispatch, useSelector } from 'react-redux';
import { removeFromCart, updateQuantity } from '../../redux/store';
import { RootState } from '../../redux/store';
import { useState } from 'react';
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
  const itemVariants = allCartItems.filter((el) => el.id === itemID);
  const [addQty, setAddQty] = useState(1);
  const [showProductDetail, setShowProductDetail] = useState(false);

  if (itemVariants.length === 0) return <></>;

  const product = itemVariants[0].product;

  const handleCart = (id: string, action: CartActions, variant: any) => {
    if (action === 'Add')
      dispatch(
        updateQuantity({
          id,
          option: variant.option,
          quantity: variant.quantity + 1,
        })
      );
    else {
      const newQuantity = variant.quantity - 1;
      if (newQuantity === 0) {
        dispatch(removeFromCart({ id, option: variant.option }));
      } else
        dispatch(
          updateQuantity({
            id,
            option: variant.option,
            quantity: variant.quantity - 1,
          })
        );
    }
  };

  const handleAddMore = (variant: any) => {
    dispatch(
      updateQuantity({
        id: variant.id,
        option: variant.option,
        quantity: variant.quantity + addQty,
      })
    );
    setAddQty(1);
  };

  return (
    <div>
      <Drawer
        anchor="bottom"
        open={open}
        onClose={() => {
          setAddQty(1);
          onClose();
        }}
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
          <Typography variant="h6" fontWeight="bold" textAlign="left">
            All Variants
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Manage your cart items
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {/* Display all variants */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
            {itemVariants.map((variant, index) => (
              <Box key={index}>
                <QuantityUpdateCard
                  item={variant}
                  handleCart={(id: string, action: CartActions) =>
                    handleCart(id, action, variant)
                  }
                />
                {index < itemVariants.length - 1 && <Divider sx={{ my: 2 }} />}
              </Box>
            ))}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Add More of same variant section - only show for single variant */}
          {itemVariants.length === 1 && (
            <>
              <Typography variant="body2" fontWeight="bold" sx={{ mb: 2 }}>
                Add {addQty} more
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Button
                  variant="outlined"
                  sx={{ minWidth: '40px' }}
                  onClick={() => setAddQty(Math.max(1, addQty - 1))}
                >
                  -
                </Button>
                <Box
                  sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #ccc',
                    borderRadius: 1,
                  }}
                >
                  <Typography>{addQty}</Typography>
                </Box>
                <Button
                  variant="outlined"
                  sx={{ minWidth: '40px' }}
                  onClick={() => setAddQty(addQty + 1)}
                >
                  +
                </Button>
              </Box>

              <Button
                variant="contained"
                color="primary"
                fullWidth
                sx={{ textTransform: 'none', mb: 2 }}
                onClick={() => handleAddMore(itemVariants[0])}
              >
                Add to Cart
              </Button>
            </>
          )}

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
