import { Box, Typography } from '@mui/material';
import { Variant } from '@mui/material/styles/createTypography';
import { formatPrice } from '../utils/priceUtils';

interface PriceDisplayProps {
  nowPrice?: number;
  wasPrice?: number;
  nowVariant?: Variant;
  wasVariant?: Variant;
  gap?: number;
}

const PriceDisplay = ({
  nowPrice,
  wasPrice,
  nowVariant = 'h6',
  wasVariant = 'body2',
  gap = 1,
}: PriceDisplayProps) => {
  if (typeof nowPrice !== 'number') {
    return null;
  }

  const showWasPrice =
    typeof wasPrice === 'number' && wasPrice > 0 && wasPrice > nowPrice;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap }}>
      {showWasPrice && (
        <Typography
          variant={wasVariant}
          sx={{ textDecoration: 'line-through', color: 'text.secondary' }}
        >
          {formatPrice(wasPrice)}
        </Typography>
      )}
      <Typography
        variant={nowVariant}
        sx={{ fontWeight: 'bold', color: 'primary.main' }}
      >
        {formatPrice(nowPrice)}
      </Typography>
    </Box>
  );
};

export default PriceDisplay;
