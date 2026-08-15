import React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useNavigate } from 'react-router-dom';
import { useAddressBook } from '../../context/AddressContext';
import { formatAddressForDelivery } from '../../types/address';
import { trackEvent } from '../../utils/analytics';

const AddressHeaderBar: React.FC = () => {
  const navigate = useNavigate();
  const { selectedAddress } = useAddressBook();

  if (!selectedAddress) {
    return null;
  }

  const handleEdit = () => {
    trackEvent('header_address_edit_click', {
      address_id: selectedAddress.id,
    });
    navigate('/addresses?return=/bobs/foodList');
  };

  return (
    <Box
      onClick={handleEdit}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1.5,
        height: 44,
        maxHeight: 50,
        bgcolor: 'rgba(0,0,0,0.12)',
        cursor: 'pointer',
        borderTop: '1px solid rgba(255,255,255,0.12)',
      }}
    >
      <LocationOnIcon sx={{ fontSize: 18, color: '#fff', flexShrink: 0 }} />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          variant="caption"
          sx={{
            color: 'rgba(255,255,255,0.75)',
            lineHeight: 1.1,
            display: 'block',
          }}
        >
          Delivering to {selectedAddress.label}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.8rem',
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {formatAddressForDelivery(selectedAddress)}
        </Typography>
      </Box>
      <IconButton
        size="small"
        onClick={(event) => {
          event.stopPropagation();
          handleEdit();
        }}
        aria-label="Edit delivery address"
        sx={{ color: '#fff', flexShrink: 0 }}
      >
        <EditIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};

export default AddressHeaderBar;
