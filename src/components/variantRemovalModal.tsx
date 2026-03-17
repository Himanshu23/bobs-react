import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Box,
  Typography,
} from '@mui/material';
import { CartItem } from '../types';

interface VariantRemovalModalProps {
  open: boolean;
  variants: CartItem[];
  onSelect: (variant: CartItem) => void;
  onClose: () => void;
}

const VariantRemovalModal = ({
  open,
  variants,
  onSelect,
  onClose,
}: VariantRemovalModalProps) => {
  const formatVariant = (variant: CartItem): string => {
    if (!variant.option) return 'No options';

    const parts = [];
    if (variant.option.size) parts.push(`Size: ${variant.option.size}`);
    if (variant.option.style) parts.push(`Style: ${variant.option.style}`);
    if (variant.option.base) parts.push(`Base: ${variant.option.base}`);

    return parts.length > 0 ? parts.join(', ') : 'Default';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Select Variant to Remove</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          This item has multiple variants. Please select which one you want to
          remove:
        </Typography>
        <List sx={{ width: '100%' }}>
          {variants.map((variant, index) => (
            <ListItem key={index} disablePadding>
              <ListItemButton onClick={() => onSelect(variant)}>
                <Box sx={{ width: '100%' }}>
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span>{formatVariant(variant)}</span>
                        <Typography
                          variant="body2"
                          color="primary"
                          sx={{ fontWeight: 'bold' }}
                        >
                          Qty: {variant.quantity}
                        </Typography>
                      </Box>
                    }
                    secondary={`₹${variant.price}`}
                  />
                </Box>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

export default VariantRemovalModal;
