import React, { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Alert,
  AppBar,
  Box,
  Button,
  Container,
  IconButton,
  Toolbar,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddressMapPicker, {
  AddressFormValues,
} from '../components/address/AddressMapPicker';
import { useAddressBook } from '../context/AddressContext';
import { trackEvent } from '../utils/analytics';
import { SERVICE_RADIUS_KM } from '../config/restaurantLocation';

const AddAddressPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('return') || '/bobs/foodList';
  const { addresses, saveAddress } = useAddressBook();
  const editing = useMemo(
    () => (id ? addresses.find((address) => address.id === id) : undefined),
    [addresses, id]
  );

  const [form, setForm] = useState<AddressFormValues | null>(null);
  const [serviceable, setServiceable] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleBack = () => {
    navigate(`/addresses?return=${encodeURIComponent(returnTo)}`);
  };

  const handleSave = () => {
    if (!form) {
      setError('Pick a location on the map first.');
      return;
    }

    if (!form.formattedAddress.trim()) {
      setError('Address is required.');
      return;
    }

    if (!form.line1.trim()) {
      setError('Please add flat / house / floor details.');
      return;
    }

    if (!serviceable) {
      setError(
        `We only deliver within ${SERVICE_RADIUS_KM} km of the restaurant.`
      );
      return;
    }

    setSaving(true);
    setError('');

    const saved = saveAddress({
      id: editing?.id,
      label: form.label,
      formattedAddress: form.formattedAddress.trim(),
      line1: form.line1.trim(),
      landmark: form.landmark.trim(),
      lat: form.lat,
      lng: form.lng,
      placeId: form.placeId,
    });

    trackEvent(editing ? 'address_updated' : 'address_saved', {
      address_id: saved.id,
      label: saved.label,
    });

    setSaving(false);
    navigate(returnTo);
  };

  return (
    <Box sx={{ pb: 10 }}>
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar>
          <IconButton edge="start" onClick={handleBack} aria-label="Back">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700, ml: 1 }}>
            {editing ? 'Edit address' : 'Add address'}
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 2 }}>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}

        <AddressMapPicker
          initial={
            editing
              ? {
                  label: editing.label,
                  formattedAddress: editing.formattedAddress,
                  line1: editing.line1,
                  landmark: editing.landmark,
                  lat: editing.lat,
                  lng: editing.lng,
                  placeId: editing.placeId,
                }
              : undefined
          }
          onChange={(values, nextServiceable) => {
            setForm(values);
            setServiceable(nextServiceable);
            if (nextServiceable) {
              setError('');
            }
          }}
        />

        <Button
          fullWidth
          variant="contained"
          size="large"
          disabled={saving || !serviceable}
          onClick={handleSave}
          sx={{ mt: 3, textTransform: 'none' }}
        >
          {saving ? 'Saving...' : 'Save address'}
        </Button>
      </Container>
    </Box>
  );
};

export default AddAddressPage;
