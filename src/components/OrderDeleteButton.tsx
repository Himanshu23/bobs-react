import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useDeleteOrder } from '../data/hooks/useOrders';

interface OrderDeleteButtonProps {
  orderId: string;
  orderNumber?: string;
  onDeleteSuccess?: () => void;
  variant?: 'icon' | 'button';
  size?: 'small' | 'medium';
}

const OrderDeleteButton: React.FC<OrderDeleteButtonProps> = ({
  orderId,
  orderNumber,
  onDeleteSuccess,
  variant = 'icon',
  size = 'small',
}) => {
  const [openDialog, setOpenDialog] = useState(false);
  const { mutate: deleteOrder, isPending: isDeleting } = useDeleteOrder();

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleConfirmDelete = () => {
    deleteOrder(orderId, {
      onSuccess: () => {
        setOpenDialog(false);
        onDeleteSuccess?.();
      },
    });
  };

  const buttonContent = (
    <>
      <DeleteIcon sx={{ fontSize: size === 'small' ? '1.25rem' : '1.5rem' }} />
    </>
  );

  const button =
    variant === 'icon' ? (
      <Tooltip title="Delete Order">
        <IconButton
          size={size}
          color="error"
          onClick={handleOpenDialog}
          disabled={isDeleting}
        >
          {isDeleting ? <CircularProgress size={24} /> : buttonContent}
        </IconButton>
      </Tooltip>
    ) : (
      <Button
        size={size}
        color="error"
        variant="outlined"
        startIcon={isDeleting ? <CircularProgress size={20} /> : <DeleteIcon />}
        onClick={handleOpenDialog}
        disabled={isDeleting}
      >
        Delete
      </Button>
    );

  return (
    <>
      {button}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Order</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete order{' '}
            {orderNumber ? `#${orderNumber}` : `${orderId}`}? This action cannot
            be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDialog}
            disabled={isDeleting}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={isDeleting}
          >
            {isDeleting ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default OrderDeleteButton;
