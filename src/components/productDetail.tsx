import React, { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { addToCart } from '../redux/store';
import {
  Box,
  Button,
  Typography,
  Select,
  MenuItem,
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
              }}
            >
              <Typography variant="subtitle1" sx={{ mb: 0.75 }}>
                Size
              </Typography>
              <FormControl component="fieldset">
                <RadioGroup
                  value={selectedSize}
                  onChange={(e) =>
                    setSelectedSize(e.target.value as ItemOptions['size'])
                  }
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
              }}
            >
              <Typography variant="subtitle1" sx={{ mb: 0.75 }}>
                Type
              </Typography>
              <Select
                value={selectedType}
                onChange={(e) =>
                  setSelectedType(e.target.value as ItemOptions['style'])
                }
                fullWidth
                size="small"
              >
                {Object.entries(product.priceOptions.nowPrice.type).map(
                  ([type, price]) => (
                    <MenuItem key={type} value={type}>
                      {renderOptionPriceLabel(
                        type,
                        price,
                        product.priceOptions.wasPrice?.type?.[
                          type as NonNullable<ItemOptions['style']>
                        ]
                      )}
                    </MenuItem>
                  )
                )}
              </Select>
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
              }}
            >
              <Typography variant="subtitle1" sx={{ mb: 0.75 }}>
                Base
              </Typography>
              <FormControl component="fieldset">
                <RadioGroup
                  value={selectedBase}
                  onChange={(e) =>
                    setSelectedBase(e.target.value as ItemOptions['base'])
                  }
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
