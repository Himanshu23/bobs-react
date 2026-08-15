import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { SavedAddress, formatAddressForDelivery } from '../../types/address';

interface AddressConfirmDialogProps {
  open: boolean;
  address: SavedAddress;
  onConfirm: () => void;
  onChange: () => void;
}

const AddressConfirmDialog: React.FC<AddressConfirmDialogProps> = ({
  open,
  address,
  onConfirm,
  onChange,
}) => {
  return (
    <Dialog open={open} onClose={onConfirm} fullWidth maxWidth="xs">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LocationOnIcon color="primary" />
        Delivering to
      </DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
          {address.label}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {formatAddressForDelivery(address)}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onChange}
          variant="outlined"
          sx={{ textTransform: 'none' }}
        >
          Change
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          sx={{ textTransform: 'none' }}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddressConfirmDialog;
