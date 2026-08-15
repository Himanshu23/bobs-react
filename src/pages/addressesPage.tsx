import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Container,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import { useAddressBook } from '../context/AddressContext';
import { formatAddressForDelivery } from '../types/address';
import { trackEvent } from '../utils/analytics';

const AddressesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('return') || '/bobs/foodList';
  const { addresses, selectedAddressId, selectAddress, deleteAddress } =
    useAddressBook();
  const [error, setError] = useState('');

  const sortedAddresses = useMemo(
    () =>
      [...addresses].sort((a, b) => {
        if (a.id === selectedAddressId) return -1;
        if (b.id === selectedAddressId) return 1;
        return b.updatedAt - a.updatedAt;
      }),
    [addresses, selectedAddressId]
  );

  const handleSelect = (id: string) => {
    selectAddress(id);
    trackEvent('address_selected', { address_id: id });
    navigate(returnTo);
  };

  const handleBack = () => {
    navigate(returnTo);
  };

  return (
    <Container maxWidth="sm" sx={{ py: 2, pb: 10 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={handleBack} edge="start" aria-label="Back">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 700, ml: 1 }}>
          Saved addresses
        </Typography>
      </Box>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {sortedAddresses.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          No saved addresses yet. Add one to continue with delivery.
        </Alert>
      ) : (
        <List sx={{ mb: 3 }}>
          {sortedAddresses.map((address) => {
            const selected = address.id === selectedAddressId;

            return (
              <ListItem
                key={address.id}
                disablePadding
                secondaryAction={
                  <Box>
                    <IconButton
                      edge="end"
                      aria-label="Edit address"
                      onClick={() =>
                        navigate(
                          `/addresses/${address.id}/edit?return=${encodeURIComponent(
                            returnTo
                          )}`
                        )
                      }
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="Delete address"
                      onClick={() => {
                        deleteAddress(address.id);
                        trackEvent('address_deleted', {
                          address_id: address.id,
                        });
                        setError('');
                      }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Box>
                }
                sx={{
                  mb: 1,
                  border: selected ? '2px solid' : '1px solid',
                  borderColor: selected ? 'primary.main' : 'divider',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <ListItemButton onClick={() => handleSelect(address.id)}>
                  {selected ? (
                    <CheckCircleIcon color="primary" sx={{ mr: 1.5 }} />
                  ) : null}
                  <ListItemText
                    primary={`${address.label}`}
                    secondary={formatAddressForDelivery(address)}
                    primaryTypographyProps={{ fontWeight: 700 }}
                    secondaryTypographyProps={{
                      sx: {
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      )}

      <Button
        fullWidth
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() =>
          navigate(`/addresses/new?return=${encodeURIComponent(returnTo)}`)
        }
        sx={{ textTransform: 'none' }}
      >
        Add new address
      </Button>
    </Container>
  );
};

export default AddressesPage;
