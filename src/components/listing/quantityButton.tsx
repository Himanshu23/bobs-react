import { Card, CardContent, Typography, Box, Button } from '@mui/material';
import { CartActions, ItemOptions } from '../../types';
import { useSelector } from 'react-redux';
import { selectCartItemByIdAndOption } from '../../redux/selectors';

interface QuantityButtonsProps {
  id: string;
  option?: ItemOptions;
  handleCart: (id: string, action: CartActions, option?: ItemOptions) => void;
}
export const QuantityButtons = ({
  id,
  option,
  handleCart,
}: QuantityButtonsProps) => {
  const cartItem = useSelector(selectCartItemByIdAndOption(id, option));
  return (
    <Card
      sx={{
        padding: '3px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '40px',
        flexShrink: 0, // Prevents shrinking in flex container
      }}
    >
      <CardContent
        sx={{
          padding: '0px !important',
          textAlign: 'center',
          width: '50%',
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
          <Button
            sx={{ minWidth: '15px', padding: '3px' }}
            onClick={() => handleCart(id, 'Remove', cartItem?.option)}
          >
            -
          </Button>
          <Typography
            variant="body2"
            sx={{ minWidth: '15px', marginBottom: '0.2rem' }}
          >
            {cartItem?.quantity}
          </Typography>
          <Button
            sx={{ minWidth: '15px', padding: '3px' }}
            onClick={() => handleCart(id, 'Add')}
          >
            +
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};
