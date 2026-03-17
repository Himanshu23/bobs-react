import { Box, Typography } from '@mui/material';
import { CartActions, CartItem } from '../../types';
import { QuantityButtons } from '../listing/quantityButton';

interface quantityUpdateCardProps {
  item: CartItem;
  handleCart: (id: string, action: CartActions) => void;
}
const QuantityUpdateCard = ({ item, handleCart }: quantityUpdateCardProps) => {
  const formatVariant = (): string => {
    if (!item.option) return '';
    const parts = [];
    if (item.option.size) parts.push(`Size: ${item.option.size}`);
    if (item.option.style) parts.push(`Style: ${item.option.style}`);
    if (item.option.base) parts.push(`Base: ${item.option.base}`);
    return parts.length > 0 ? ` • ${parts.join(' • ')}` : '';
  };

  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="flex-start"
      sx={{ width: '100%' }}
    >
      <Box flex={3}>
        <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              bgcolor: 'green',
              mr: 1,
            }}
          />
          <Typography variant="body1" fontWeight="bold">
            {item.name}
          </Typography>
        </Box>

        <Typography variant="body2" color="textSecondary" mb={0.2} ml={2}>
          ₹{item.price}
          <span
            style={{ color: 'red', fontWeight: 'bold', paddingLeft: '15px' }}
          >
            30% Off
          </span>
        </Typography>
        <Typography
          variant="caption"
          color="textSecondary"
          mb={0.2}
          ml={2}
          display="block"
        >
          {formatVariant()}
        </Typography>
      </Box>
      <Box flex={1} p={2}>
        <QuantityButtons
          handleCart={handleCart}
          id={item.id}
          option={item.option}
        />
      </Box>
    </Box>
  );
};

export default QuantityUpdateCard;
