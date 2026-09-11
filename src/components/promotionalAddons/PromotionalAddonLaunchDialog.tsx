import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { DEFAULT_PROMO_CAMPAIGN } from '../../utils/promotionalAddonStrategy';

const PROMO_LAUNCH_SHOWN_KEY = 'promotional-addon-launch-shown';

interface PromotionalAddonLaunchDialogProps {
  open: boolean;
  onClose: () => void;
  onBrowseMenu: () => void;
}

const PromotionalAddonLaunchDialog = ({
  open,
  onClose,
  onBrowseMenu,
}: PromotionalAddonLaunchDialogProps) => (
  <Dialog
    open={open}
    onClose={onClose}
    fullWidth
    maxWidth="xs"
    PaperProps={{
      sx: {
        overflow: 'hidden',
        borderRadius: 3,
      },
    }}
  >
    <Box
      sx={{
        px: 3,
        pt: 3,
        pb: 2,
        color: '#fff',
        background:
          'linear-gradient(145deg, #14532d 0%, #166534 60%, #15803d 100%)',
      }}
    >
      <LocalOfferIcon sx={{ fontSize: 34, mb: 1 }} />
      <DialogTitle sx={{ p: 0, color: '#fff', fontWeight: 800 }}>
        {DEFAULT_PROMO_CAMPAIGN.name}
      </DialogTitle>
      <Typography sx={{ mt: 0.75, color: '#f0fdf4', lineHeight: 1.5 }}>
        Spend ₹{DEFAULT_PROMO_CAMPAIGN.minOrderValue} on regular items and
        unlock select dishes for just ₹{DEFAULT_PROMO_CAMPAIGN.promotionalPrice}
        .
      </Typography>
    </Box>
    <DialogContent sx={{ px: 3, py: 2.5 }}>
      <Typography variant="body2" color="text.primary">
        You can claim up to {DEFAULT_PROMO_CAMPAIGN.maxItemsPerOrder}{' '}
        promotional add-ons in one order.
      </Typography>
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
      <Button onClick={onClose} color="inherit">
        Maybe later
      </Button>
      <Button variant="contained" onClick={onBrowseMenu}>
        Browse menu
      </Button>
    </DialogActions>
  </Dialog>
);

export const usePromotionalAddonLaunch = (shouldShow: boolean) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!shouldShow || sessionStorage.getItem(PROMO_LAUNCH_SHOWN_KEY)) return;

    sessionStorage.setItem(PROMO_LAUNCH_SHOWN_KEY, 'true');
    setOpen(true);
  }, [shouldShow]);

  return { open, close: () => setOpen(false) };
};

export default PromotionalAddonLaunchDialog;
