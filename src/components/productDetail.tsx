import React, { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { addToCart } from '../redux/store';
import {
  Box,
  Button,
  Typography,
  Drawer,
  IconButton,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { FoodItem, ItemOptions } from '../types';
import { createCartItem } from '../utils/cartUtils';
import PriceDisplay from './PriceDisplay';
import { trackEvent } from '../utils/analytics';

interface ProductDetailModalProps {
  open: boolean;
  onClose: () => void;
  product: FoodItem;
}

const ProductDetailModal = ({
  open,
  onClose,
  product,
}: ProductDetailModalProps) => {
  const dispatch = useDispatch();

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<ItemOptions['size']>('Full');
  const [selectedType, setSelectedType] = useState<ItemOptions['style']>();
  const [selectedBase, setSelectedBase] = useState<ItemOptions['base']>();

  const renderOptionPriceLabel = (
    label: string,
    nowPrice?: number,
    wasPrice?: number
  ) => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <Typography variant="body2">{label}</Typography>
      <PriceDisplay
        nowPrice={nowPrice}
        wasPrice={wasPrice}
        nowVariant="body2"
        wasVariant="caption"
      />
    </Box>
  );

  const unitPrice = useMemo(
    () =>
      (selectedSize
        ? (product.priceOptions.nowPrice.size?.[selectedSize] ?? 0)
        : 0) +
      (selectedType && product.priceOptions.nowPrice.type?.[selectedType]
        ? product.priceOptions.nowPrice.type?.[selectedType]
        : 0) +
      (selectedBase && product.priceOptions.nowPrice.base?.[selectedBase]
        ? product.priceOptions.nowPrice.base?.[selectedBase]
        : 0),
    [product, selectedType, selectedSize, selectedBase]
  );

  const unitWasPrice = useMemo(
    () =>
      (selectedSize
        ? (product.priceOptions.wasPrice.size?.[selectedSize] ?? 0)
        : 0) +
      (selectedType && product.priceOptions.wasPrice.type?.[selectedType]
        ? product.priceOptions.wasPrice.type?.[selectedType]
        : 0) +
      (selectedBase && product.priceOptions.wasPrice.base?.[selectedBase]
        ? product.priceOptions.wasPrice.base?.[selectedBase]
        : 0),
    [product, selectedBase, selectedSize, selectedType]
  );

  const totalPrice = unitPrice * quantity;
  const totalWasPrice = unitWasPrice > 0 ? unitWasPrice * quantity : undefined;

  const handleAddToCart = () => {
    const newCartItem = createCartItem(
      product,
      quantity,
      selectedSize,
      selectedType,
      selectedBase
    );
    trackEvent('add_to_cart', {
      item_id: newCartItem.id,
      item_name: newCartItem.name,
      item_category: newCartItem.product.category,
      quantity: newCartItem.quantity,
      value: newCartItem.price * newCartItem.quantity,
      size: newCartItem.option.size,
      style: newCartItem.option.style,
      base: newCartItem.option.base,
    });
    dispatch(addToCart(newCartItem));
    setQuantity(1);
    onClose();
  };

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: '16px 16px 0 0',
          padding: 2,
          maxHeight: '90vh',
          overflowY: 'auto',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ pr: 1, minWidth: 0 }}>
            <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
              {product.name}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5, lineHeight: 1.4 }}
            >
              {product.description}
            </Typography>
            <Box sx={{ mt: 1 }}>
              <PriceDisplay
                nowPrice={totalPrice}
                wasPrice={totalWasPrice}
                nowVariant="h6"
                wasVariant="body2"
              />
            </Box>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            width: '100%',
          }}
        >
          {/* Size Options */}
          {product.priceOptions.nowPrice.size && (
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                px: 1.5,
                py: 1.25,
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                flexWrap: 'wrap',
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{ minWidth: 52, flexShrink: 0 }}
              >
                Size
              </Typography>
              <Box
                sx={{
                  width: { xs: 4, sm: 1 },
                  height: { xs: 4, sm: 'auto' },
                  minHeight: { sm: 20 },
                  alignSelf: 'center',
                  borderRadius: '50%',
                  bgcolor: 'divider',
                }}
              />
              <FormControl component="fieldset" sx={{ flex: 1, minWidth: 0 }}>
                <RadioGroup
                  row
                  value={selectedSize}
                  onChange={(e) =>
                    setSelectedSize(e.target.value as ItemOptions['size'])
                  }
                  sx={{ columnGap: 1, rowGap: 0.25, flexWrap: 'wrap' }}
                >
                  {Object.entries(product.priceOptions.nowPrice.size).map(
                    ([size, price]) => (
                      <FormControlLabel
                        key={size}
                        value={size}
                        control={<Radio />}
                        label={renderOptionPriceLabel(
                          size,
                          price,
                          product.priceOptions.wasPrice?.size[
                            size as ItemOptions['size']
                          ]
                        )}
                        sx={{ mr: 0.75, ml: 0 }}
                      />
                    )
                  )}
                </RadioGroup>
              </FormControl>
            </Box>
          )}

          {/* Type Options */}
          {product.priceOptions.nowPrice.type && (
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                px: 1.5,
                py: 1.25,
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                flexWrap: 'wrap',
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{ minWidth: 52, flexShrink: 0 }}
              >
                Type
              </Typography>
              <Box
                sx={{
                  width: { xs: 4, sm: 1 },
                  height: { xs: 4, sm: 'auto' },
                  minHeight: { sm: 20 },
                  alignSelf: 'center',
                  borderRadius: '50%',
                  bgcolor: 'divider',
                }}
              />
              <FormControl component="fieldset" sx={{ flex: 1, minWidth: 0 }}>
                <RadioGroup
                  row
                  value={selectedType}
                  onChange={(e) =>
                    setSelectedType(e.target.value as ItemOptions['style'])
                  }
                  sx={{ columnGap: 1, rowGap: 0.25, flexWrap: 'wrap' }}
                >
                  {Object.entries(product.priceOptions.nowPrice.type).map(
                    ([type, price]) => (
                      <FormControlLabel
                        key={type}
                        value={type}
                        control={<Radio />}
                        label={renderOptionPriceLabel(
                          type,
                          price,
                          product.priceOptions.wasPrice?.type?.[
                            type as NonNullable<ItemOptions['style']>
                          ]
                        )}
                        sx={{ mr: 0.75, ml: 0 }}
                      />
                    )
                  )}
                </RadioGroup>
              </FormControl>
            </Box>
          )}

          {/* Base Options */}
          {product.priceOptions.nowPrice.base && (
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                px: 1.5,
                py: 1.25,
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                flexWrap: 'wrap',
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{ minWidth: 52, flexShrink: 0 }}
              >
                Base
              </Typography>
              <Box
                sx={{
                  width: { xs: 4, sm: 1 },
                  height: { xs: 4, sm: 'auto' },
                  minHeight: { sm: 20 },
                  alignSelf: 'center',
                  borderRadius: '50%',
                  bgcolor: 'divider',
                }}
              />
              <FormControl component="fieldset" sx={{ flex: 1, minWidth: 0 }}>
                <RadioGroup
                  row
                  value={selectedBase}
                  onChange={(e) =>
                    setSelectedBase(e.target.value as ItemOptions['base'])
                  }
                  sx={{ columnGap: 1, rowGap: 0.25, flexWrap: 'wrap' }}
                >
                  {Object.entries(product.priceOptions.nowPrice.base).map(
                    ([base, price]) => (
                      <FormControlLabel
                        key={base}
                        value={base}
                        control={<Radio />}
                        label={renderOptionPriceLabel(
                          base,
                          price,
                          product.priceOptions.wasPrice?.base?.[
                            base as NonNullable<ItemOptions['base']>
                          ]
                        )}
                        sx={{ mr: 0.75, ml: 0 }}
                      />
                    )
                  )}
                </RadioGroup>
              </FormControl>
            </Box>
          )}
        </Box>
        {/* Add to Cart */}
        <Paper
          elevation={3}
          sx={{
            width: '100%',
            p: 1,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
              width: '100%',
            }}
          >
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleAddToCart}
              disabled={
                (product.priceOptions.nowPrice.size && !selectedSize) ||
                (product.priceOptions.nowPrice.type && !selectedType) ||
                (product.priceOptions.nowPrice.base && !selectedBase)
              }
            >
              Add Item • ₹{totalPrice}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Drawer>
  );
};

export default ProductDetailModal;
