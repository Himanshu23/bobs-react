import { Box, Typography, Button, Badge } from '@mui/material';
import { CircleSharp, ImageNotSupported } from '@mui/icons-material'; // Veg & Non-Veg Icons
import { CartActions, FoodItem, ItemOptions } from '../../types';
import { useSelector } from 'react-redux';
import { selectProductTotalQuantity } from '../../redux/selectors';
import { useState } from 'react';
import PriceDisplay from '../PriceDisplay';
import { getLowestNowPrice, getLowestWasPrice } from '../../utils/priceUtils';

interface FoodItemCardProps {
  item: FoodItem;
  handleCart: (id: string, action: CartActions, option?: ItemOptions) => void;
}

const FoodItemCard = ({ item, handleCart }: FoodItemCardProps) => {
  const totalQuantity = useSelector(selectProductTotalQuantity(item.id));
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const lowestNowPrice = getLowestNowPrice(item);
  const lowestWasPrice = getLowestWasPrice(item);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'stretch',
        gap: 2,
        width: 360,
        padding: 2,
        borderRadius: 2,
        boxShadow: 3,
        backgroundColor: 'white',
        flexShrink: 0,
      }}
    >
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: 28 }}
        >
          {item.veg ? (
            <CircleSharp sx={{ color: 'green', fontSize: 14, flexShrink: 0 }} />
          ) : (
            <CircleSharp sx={{ color: 'red', fontSize: 14, flexShrink: 0 }} />
          )}
          <Typography
            variant="body1"
            fontWeight="bold"
            sx={{ wordBreak: 'break-word' }}
          >
            {item.name}
          </Typography>
        </Box>

        {/* <Rating value={item.rating} precision={0.5} readOnly sx={{ my: 1 }} /> */}

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 1, flex: 1 }}
        >
          {item.description}
        </Typography>

        {/* Was Now Price */}
        <PriceDisplay nowPrice={lowestNowPrice} wasPrice={lowestWasPrice} />

        {totalQuantity > 0 ? (
          <Badge
            badgeContent={totalQuantity}
            color="primary"
            sx={{
              '& .MuiBadge-badge': {
                right: 43,
                top: 12,
                fontSize: '12px',
              },
            }}
          >
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 1, textTransform: 'none', alignSelf: 'flex-start' }}
              onClick={() => handleCart(item.id, 'Add')}
            >
              View Cart Items
            </Button>
          </Badge>
        ) : (
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 1, alignSelf: 'flex-start' }}
            onClick={() => handleCart(item.id, 'Add')}
          >
            Add to Cart
          </Button>
        )}
      </Box>

      {imageError ? (
        <Box
          sx={{
            width: 110,
            height: 110,
            borderRadius: 1,
            backgroundColor: '#f5f5f5',
            border: '2px dashed #ccc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <ImageNotSupported sx={{ color: '#999', fontSize: 40 }} />
        </Box>
      ) : (
        <Box
          component="img"
          src={item.image}
          alt={item.name}
          onError={handleImageError}
          sx={{
            width: 110,
            height: 110,
            borderRadius: 1,
            objectFit: 'cover',
            flexShrink: 0,
          }}
        />
      )}
    </Box>
  );
};

export default FoodItemCard;
