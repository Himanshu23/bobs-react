import { Box, Typography, Button, Badge } from '@mui/material';
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
        alignItems: 'stretch',
        gap: 2,
        width: 380,
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
            <CircleSharp sx={{ color: 'green', fontSize: 20, flexShrink: 0 }} />
          ) : (
            <CircleSharp sx={{ color: 'red', fontSize: 20, flexShrink: 0 }} />
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
        {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
        </Box> */}

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

      <Box
        component="img"
        src={item.image}
        alt={item.name}
        sx={{
          width: 110,
          height: 110,
          borderRadius: 1,
          objectFit: 'cover',
          flexShrink: 0,
        }}
      />
    </Box>
  );
};

export default FoodItemCard;
