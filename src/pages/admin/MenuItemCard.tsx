import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { FoodItem } from '../../types';
import FoodImage from '../../components/FoodImage';

interface MenuItemCardProps {
  item: FoodItem;
  onEditItem?: (item: FoodItem) => void;
  backgroundColor?: string;
  hoverColor?: string;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  onEditItem,
  backgroundColor = '#fafafa',
  hoverColor = '#f5f5f5',
}) => {
  return (
    <Card
      variant="outlined"
      sx={{
        backgroundColor,
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
                          item.priceOptions.wasPrice.size[
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
        </Stack>
      </CardContent>
    </Card>
  );
};

export default MenuItemCard;
