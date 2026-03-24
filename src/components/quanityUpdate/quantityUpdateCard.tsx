import { Box, Button, Typography } from '@mui/material';
import { CartItem } from '../../types';
import PriceDisplay from '../PriceDisplay';
import { getPriceForSize } from '../../utils/priceUtils';

interface quantityUpdateCardProps {
  item: CartItem;
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
}
const QuantityUpdateCard = ({
  item,
  quantity,
  onDecrease,
  onIncrease,
}: quantityUpdateCardProps) => {
  const selectedSize = item.option?.size;
  const sizePrice = selectedSize
    ? getPriceForSize(item.product, selectedSize)
    : { nowPrice: item.price, wasPrice: undefined };

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
      alignItems="center"
      gap={1.5}
      sx={{ width: '100%' }}
    >
      <Box flex={1} minWidth={0}>
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

        <Box mb={0.2} ml={2}>
          <PriceDisplay
            nowPrice={item.price ?? sizePrice.nowPrice}
            wasPrice={sizePrice.wasPrice}
            nowVariant="body2"
            wasVariant="caption"
          />
        </Box>
        <Typography
          variant="caption"
          color="textSecondary"
          mb={0.75}
          ml={2}
          display="block"
        >
          {formatVariant()}
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 0.75,
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '40px',
            flexShrink: 0,
            px: 0.75,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={1}
          >
            <Button
              sx={{ minWidth: '15px', padding: '3px' }}
              onClick={onDecrease}
              disabled={quantity <= 0}
            >
              -
            </Button>
            <Typography
              variant="body2"
              sx={{ minWidth: '15px', textAlign: 'center' }}
            >
              {quantity}
            </Typography>
            <Button
              sx={{ minWidth: '15px', padding: '3px' }}
              onClick={onIncrease}
            >
              +
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default QuantityUpdateCard;
