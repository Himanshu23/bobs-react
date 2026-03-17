import { Box, Typography, Button, Rating, Badge } from '@mui/material';
import { CircleSharp } from '@mui/icons-material'; // Veg & Non-Veg Icons
import { CartActions, FoodItem, ItemOptions } from '../../types';
import { useSelector } from 'react-redux';
import { selectProductTotalQuantity } from '../../redux/selectors';

interface FoodItemCardProps {
  item: FoodItem;
  handleCart: (id: string, action: CartActions, option?: ItemOptions) => void;
}

const FoodItemCard = ({ item, handleCart }: FoodItemCardProps) => {
  const totalQuantity = useSelector(selectProductTotalQuantity(item.id));

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: 400,
        padding: 2,
        borderRadius: 2,
        boxShadow: 3,
        backgroundColor: 'white',
      }}
    >
      <Box sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {item.veg ? (
            <CircleSharp sx={{ color: 'green' }} />
          ) : (
            <CircleSharp sx={{ color: 'red' }} />
          )}
          <Typography variant="body1" fontWeight="bold">
            {item.name}
          </Typography>
        </Box>

        <Rating value={item.rating} precision={0.5} readOnly sx={{ my: 1 }} />

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {item.description}
        </Typography>

        {/* Was Now Price */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {item.wasPrice && (
            <Typography
              variant="body2"
              sx={{ textDecoration: 'line-through', color: 'text.secondary' }}
            >
              ₹{item.wasPrice}
            </Typography>
          )}
          {item.nowPrice && (
            <Typography
              variant="h6"
              sx={{ fontWeight: 'bold', color: 'primary.main' }}
            >
              ₹{item.nowPrice}
            </Typography>
          )}
        </Box>

        {totalQuantity > 0 ? (
          <Badge
            badgeContent={totalQuantity}
            color="primary"
            sx={{
              '& .MuiBadge-badge': {
                right: -3,
                top: 13,
                fontSize: '12px',
              },
            }}
          >
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 2, textTransform: 'none' }}
              onClick={() => handleCart(item.id, 'Add')}
            >
              View Cart Items
            </Button>
          </Badge>
        ) : (
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            onClick={() => handleCart(item.id, 'Add')}
          >
            Add to Cart
          </Button>
        )}
      </Box>

      <Box
        component="img"
        src={item.image}
        alt={item.name}
        sx={{
          width: 100,
          height: 100,
          borderRadius: 1,
          objectFit: 'cover',
        }}
      />
    </Box>
  );
};

export default FoodItemCard;
