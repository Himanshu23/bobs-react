import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from '@mui/material';
import { DeleteForever, Edit as EditIcon } from '@mui/icons-material';
import { FoodItem } from '../../types';
import FoodImage from '../../components/FoodImage';

interface MenuItemCardProps {
  item: FoodItem;
  onEditItem?: (item: FoodItem) => void;
  onDeleteItem?: (item: FoodItem) => void;
  onToggleAvailability?: (item: FoodItem) => void;
  backgroundColor?: string;
  hoverColor?: string;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  onEditItem,
  backgroundColor = '#fafafa',
  hoverColor = '#f5f5f5',
  onDeleteItem,
  onToggleAvailability,
}) => {
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
        <Stack
          direction="row"
          spacing={2}
          alignItems="flex-start"
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={2} flex={1}>
            <FoodImage src={item.image} alt={item.name} size={80} />
            <Box flex={1}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                {item.name}
              </Typography>
              {item.available === false && (
                <Typography variant="caption" color="error" sx={{ fontWeight: 700 }}>
                  OUT OF STOCK
                </Typography>
              )}
              <Stack spacing={0.25}>
                {Object.entries(item.priceOptions.nowPrice.size).map(
                  ([size, nowPrice]) => (
                    <Typography
                      key={size}
                      variant="caption"
                      color="text.secondary"
                    >
                      {size}:{' '}
                      <span
                        style={{
                          textDecoration: 'line-through',
                          marginRight: '6px',
                        }}
                      >
                        ₹
                        {
                          item.priceOptions.wasPrice?.size[
                            size as keyof typeof item.priceOptions.wasPrice.size
                          ]
                        }
                      </span>
                      <span style={{ fontWeight: 'bold' }}>₹{nowPrice}</span>
                    </Typography>
                  )
                )}
              </Stack>
            </Box>
          </Stack>
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
            startIcon={<DeleteForever />}
            onClick={() => deleteItem(item)}
          >
            Edit
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default MenuItemCard;
