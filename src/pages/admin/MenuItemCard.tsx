import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import { DeleteForever, Edit as EditIcon } from '@mui/icons-material';
import { FoodItem } from '../../types';
import FoodImage from '../../components/FoodImage';
import { getAvailableSizes } from '../../utils/priceUtils';
import { getSizeLabel } from '../../utils/sizeLabels';

interface MenuItemCardProps {
  item: FoodItem;
  onEditItem?: (item: FoodItem) => void;
  onDeleteItem?: (item: FoodItem) => void;
  onToggleAvailability?: (item: FoodItem) => void;
  backgroundColor?: string;
  hoverColor?: string;
  /** Restaurant name shown as a chip (multi-restaurant admin view). */
  restaurantLabel?: string;
  /** Set when the item is hidden from the storefront by its restaurant/market. */
  inactiveLabel?: string;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  onEditItem,
  backgroundColor = '#fafafa',
  hoverColor = '#f5f5f5',
  onDeleteItem,
  onToggleAvailability,
  restaurantLabel,
  inactiveLabel,
}) => {
  // Sizes actually sold (price above 0), Full → Quarter.
  const sizes = getAvailableSizes(item);
  const deleteItem = (item: FoodItem) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${item.name}?`
    );
    if (confirmDelete) {
      onDeleteItem?.(item);
    }
  };
  return (
    <Card
      variant="outlined"
      sx={{
        backgroundColor,
        opacity: item.available === false ? 0.58 : 1,
        filter: item.available === false ? 'grayscale(0.75)' : 'none',
        '&:hover': { backgroundColor: hoverColor },
      }}
    >
      <CardContent>
        {/* Phones: details on top, buttons in a row below. Wider: buttons
            stacked on the right. Nothing is squeezed off the card. */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', sm: 'flex-start' }}
        >
          <Stack direction="row" spacing={2} sx={{ flex: 1, minWidth: 0 }}>
            <FoodImage src={item.image} alt={item.name} size={80} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700, mb: 0.5, overflowWrap: 'anywhere' }}
              >
                {item.name}
              </Typography>
              {(restaurantLabel || inactiveLabel) && (
                <Stack
                  direction="row"
                  spacing={0.5}
                  flexWrap="wrap"
                  useFlexGap
                  sx={{ mb: 0.5 }}
                >
                  {restaurantLabel && (
                    <Chip label={restaurantLabel} size="small" />
                  )}
                  {inactiveLabel && (
                    <Chip label={inactiveLabel} size="small" color="warning" />
                  )}
                </Stack>
              )}
              {item.available === false && (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{ fontWeight: 700, display: 'block' }}
                >
                  OUT OF STOCK
                </Typography>
              )}
              <Stack spacing={0.25}>
                {sizes.length === 0 && (
                  <Typography variant="caption" color="error">
                    No price set
                  </Typography>
                )}
                {sizes.map((size) => {
                  const nowPrice = item.priceOptions.nowPrice.size[size];
                  const wasPrice = item.priceOptions.wasPrice?.size?.[size];
                  return (
                    <Typography
                      key={size}
                      variant="caption"
                      color="text.secondary"
                    >
                      {getSizeLabel(size, item.category)}:{' '}
                      {wasPrice && nowPrice && wasPrice > nowPrice && (
                        <span
                          style={{
                            textDecoration: 'line-through',
                            marginRight: '6px',
                          }}
                        >
                          ₹{wasPrice}
                        </span>
                      )}
                      <span style={{ fontWeight: 'bold' }}>₹{nowPrice}</span>
                    </Typography>
                  );
                })}
              </Stack>
            </Box>
          </Stack>
          <Stack
            direction={{ xs: 'row', sm: 'column' }}
            spacing={1}
            useFlexGap
            flexWrap="wrap"
            sx={{
              flexShrink: 0,
              '& .MuiButton-root': {
                flex: { xs: '1 1 0', sm: '0 0 auto' },
                minWidth: { xs: 0, sm: 140 },
                whiteSpace: 'nowrap',
              },
            }}
          >
            <Button
              size="small"
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => onEditItem?.(item)}
            >
              Edit
            </Button>
            <Button
              size="small"
              variant={item.available === false ? 'contained' : 'outlined'}
              color={item.available === false ? 'success' : 'warning'}
              onClick={() => onToggleAvailability?.(item)}
            >
              {item.available === false ? 'Mark available' : 'Out of stock'}
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<DeleteForever />}
              onClick={() => deleteItem(item)}
            >
              Delete
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default MenuItemCard;
