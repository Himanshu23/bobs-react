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
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { FoodItem, ItemOptions } from '../types';

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
  const [selectedType, setSelectedType] =
    useState<ItemOptions['style']>('Gravy');
  const [selectedBase, setSelectedBase] =
    useState<ItemOptions['base']>('Roomali');

  const total = useMemo(
    () =>
      (selectedSize ? product.priceOptions.size[selectedSize] : 0) +
      (selectedType && product.priceOptions?.type?.[selectedType]
        ? product.priceOptions?.type?.[selectedType]
        : 0) +
      (selectedBase && product.priceOptions?.base?.[selectedBase]
        ? product.priceOptions?.base?.[selectedBase]
        : 0),
    [product, selectedType, selectedSize, selectedBase]
  );

  const handleAddToCart = () => {
    dispatch(
      addToCart({
        id: product.id,
        name: product.name,
        price:
          (selectedSize ? product.priceOptions.size[selectedSize] : 0) +
          (selectedType && product.priceOptions?.type?.[selectedType]
            ? product.priceOptions?.type?.[selectedType]
            : 0) +
          (selectedBase && product.priceOptions?.base?.[selectedBase]
            ? product.priceOptions?.base?.[selectedBase]
            : 0),
        image: product.image,
        quantity,
        option: {
          size: 'Full',
          style: 'Dry',
          base: 'Paratha',
        },
      })
    );
    onClose();
  };

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { borderRadius: '16px 16px 0 0', padding: 2 } }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="h5">{product.name}</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <img
          src={product.image}
          alt={product.name}
          style={{ width: '100%', borderRadius: '10px' }}
        />
        <Typography variant="body1">{product.description}</Typography>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            width: '100%',
          }}
        >
          {/* Size Options */}
          {product.priceOptions.size && (
            <Card>
              <CardContent>
                <Typography variant="h6">Select Size</Typography>
                <FormControl component="fieldset">
                  <RadioGroup
                    value={selectedSize}
                    onChange={(e) =>
                      setSelectedSize(e.target.value as ItemOptions['size'])
                    }
                  >
                    {Object.entries(product.priceOptions.size).map(
                      ([size, price]) => (
                        <FormControlLabel
                          key={size}
                          value={size}
                          control={<Radio />}
                          label={`${size} - ₹${price}`}
                        />
                      )
                    )}
                  </RadioGroup>
                </FormControl>
              </CardContent>
            </Card>
          )}

          {/* Type Options */}
          {product.priceOptions.type && (
            <Card>
              <CardContent>
                <Typography variant="h6">Select Type</Typography>
                <Select
                  value={selectedType}
                  onChange={(e) =>
                    setSelectedType(e.target.value as ItemOptions['style'])
                  }
                  fullWidth
                >
                  {Object.entries(product.priceOptions.type).map(
                    ([type, price]) => (
                      <MenuItem key={type} value={type}>
                        {`${type} - ₹${price}`}
                      </MenuItem>
                    )
                  )}
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Base Options */}
          {product.priceOptions.base && (
            <Card>
              <CardContent>
                <Typography variant="h6">Select Base</Typography>
                <FormControl component="fieldset">
                  <RadioGroup
                    value={selectedBase}
                    onChange={(e) =>
                      setSelectedBase(e.target.value as ItemOptions['base'])
                    }
                  >
                    {Object.entries(product.priceOptions.base).map(
                      ([base, price]) => (
                        <FormControlLabel
                          key={base}
                          value={base}
                          control={<Radio />}
                          label={`${base} - ₹${price}`}
                        />
                      )
                    )}
                  </RadioGroup>
                </FormControl>
              </CardContent>
            </Card>
          )}
        </Box>
        {/* Add to Cart */}
        <Paper
          elevation={3}
          sx={{
            width: '100%',
            minHeight: '80px',
            padding: '2px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            gap={1}
            sx={{ width: '100%', minHeight: '60px' }}
          >
            <Card
              sx={{
                padding: '5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '55px',
                flexShrink: 0, // Prevents shrinking in flex container
              }}
            >
              <CardContent
                sx={{
                  padding: '0px !important',
                  textAlign: 'center',
                  width: '100%',
                }}
              >
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  gap={1}
                >
                  <Button
                    sx={{ minWidth: '30px', padding: '5px' }}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    -
                  </Button>
                  <Typography sx={{ minWidth: '30px' }}>{quantity}</Typography>
                  <Button
                    sx={{ minWidth: '30px', padding: '5px' }}
                    onClick={() => setQuantity((q) => q + 1)}
                  >
                    +
                  </Button>
                </Box>
              </CardContent>
            </Card>

            <Button
              variant="contained"
              color="primary"
              onClick={handleAddToCart}
              sx={{ width: '75%', height: '60px' }}
              disabled={
                (product.priceOptions.size && !selectedSize) ||
                (product.priceOptions.type && !selectedType) ||
                (product.priceOptions.base && !selectedBase)
              }
            >
              Add Item &#8377;{total * quantity}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Drawer>
  );
};

export default ProductDetailModal;
