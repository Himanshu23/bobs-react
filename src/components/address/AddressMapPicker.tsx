import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { RESTAURANT_LOCATION } from '../../config/restaurantLocation';
import { useGoogleMaps } from '../../hooks/useGoogleMaps';
import { AddressLabel } from '../../types/address';
import {
  getServiceabilityMessage,
  isWithinServiceRadius,
} from '../../utils/geo';

export interface AddressFormValues {
  label: AddressLabel;
  formattedAddress: string;
  line1: string;
  landmark: string;
  lat: number;
  lng: number;
  placeId?: string;
}

interface AddressMapPickerProps {
  initial?: Partial<AddressFormValues>;
  onChange: (values: AddressFormValues, serviceable: boolean) => void;
}

const DEFAULT_VALUES: AddressFormValues = {
  label: 'Home',
  formattedAddress: '',
  line1: '',
  landmark: '',
  lat: RESTAURANT_LOCATION.lat,
  lng: RESTAURANT_LOCATION.lng,
};

const AddressMapPicker: React.FC<AddressMapPickerProps> = ({
  initial,
  onChange,
}) => {
  const { maps, loading, error, isReady } = useGoogleMaps();
  const [fieldErrors, setFieldErrors] = useState({
    line1: false,
    formattedAddress: false,
  });
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const restaurantMarkerRef = useRef<google.maps.Marker | null>(null);
  const routeLineRef = useRef<google.maps.Polyline | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const onChangeRef = useRef(onChange);

  const [values, setValues] = useState<AddressFormValues>({
    ...DEFAULT_VALUES,
    ...initial,
    lat: initial?.lat ?? DEFAULT_VALUES.lat,
    lng: initial?.lng ?? DEFAULT_VALUES.lng,
  });
  const [geoError, setGeoError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const validateFields = () => {
    const errors = {
      line1: !values.line1.trim(),
      formattedAddress: !values.formattedAddress.trim(),
    };
    setFieldErrors(errors);
    return !errors.line1 && !errors.formattedAddress;
  };

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const serviceable = isWithinServiceRadius(values.lat, values.lng);
    onChangeRef.current(values, serviceable);
  }, [values]);

  const fitRouteBounds = (
    map: google.maps.Map,
    destination: { lat: number; lng: number }
  ) => {
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(RESTAURANT_LOCATION);
    bounds.extend(destination);
    map.fitBounds(bounds, 48);
  };

  const updateRouteLine = (destination: { lat: number; lng: number }) => {
    if (!routeLineRef.current) {
      return;
    }

    routeLineRef.current.setPath([RESTAURANT_LOCATION, destination]);

    if (mapRef.current) {
      fitRouteBounds(mapRef.current, destination);
    }
  };

  useEffect(() => {
    if (!isReady || !maps?.maps || !mapContainerRef.current || mapRef.current) {
      return;
    }

    const destination = { lat: values.lat, lng: values.lng };
    const map = new maps.maps.Map(mapContainerRef.current, {
      center: destination,
      zoom: 14,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    const restaurantMarker = new maps.maps.Marker({
      map,
      position: RESTAURANT_LOCATION,
      title: "Bob's",
      label: {
        text: 'B',
        color: '#ffffff',
        fontWeight: '700',
      },
      zIndex: 1,
    });

    const marker = new maps.maps.Marker({
      map,
      position: destination,
      draggable: true,
      title: 'Delivery location',
      zIndex: 2,
    });

    const routeLine = new maps.maps.Polyline({
      map,
      path: [RESTAURANT_LOCATION, destination],
      geodesic: true,
      strokeColor: '#f25c19',
      strokeOpacity: 0.9,
      strokeWeight: 4,
    });

    const geocoder = new maps.maps.Geocoder();

    mapRef.current = map;
    markerRef.current = marker;
    restaurantMarkerRef.current = restaurantMarker;
    routeLineRef.current = routeLine;
    geocoderRef.current = geocoder;

    fitRouteBounds(map, destination);

    map.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (!event.latLng) {
        return;
      }

      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      marker.setPosition({ lat, lng });
      updateRouteLine({ lat, lng });
      reverseGeocode(lat, lng);
    });

    marker.addListener('dragend', () => {
      const position = marker.getPosition();
      if (!position) {
        return;
      }

      const lat = position.lat();
      const lng = position.lng();
      updateRouteLine({ lat, lng });
      reverseGeocode(lat, lng);
    });

    if (searchInputRef.current) {
      const autocomplete = new maps.maps.places.Autocomplete(
        searchInputRef.current,
        {
          fields: ['formatted_address', 'geometry', 'place_id', 'name'],
        }
      );
      autocomplete.bindTo('bounds', map);
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        const location = place.geometry?.location;

        if (!location) {
          setGeoError('Could not find that place. Try another search.');
          return;
        }

        const lat = location.lat();
        const lng = location.lng();
        marker.setPosition({ lat, lng });
        updateRouteLine({ lat, lng });
        setGeoError(null);
        setValues((prev) => ({
          ...prev,
          lat,
          lng,
          placeId: place.place_id,
          formattedAddress:
            place.formatted_address || place.name || prev.formattedAddress,
        }));
      });
      autocompleteRef.current = autocomplete;
    }
  }, [isReady, maps]);

  useEffect(() => {
    const valid = validateFields();
    const serviceable = isWithinServiceRadius(values.lat, values.lng);
    onChangeRef.current(values, valid && serviceable);
  }, [values]);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !routeLineRef.current) {
      return;
    }

    const destination = { lat: values.lat, lng: values.lng };
    markerRef.current.setPosition(destination);
    updateRouteLine(destination);
  }, [values.lat, values.lng]);

  const reverseGeocode = (lat: number, lng: number) => {
    if (!geocoderRef.current) {
      setValues((prev) => ({ ...prev, lat, lng }));
      return;
    }

    geocoderRef.current.geocode(
      { location: { lat, lng } },
      (results, status) => {
        if (status === 'OK' && results?.[0]) {
          setGeoError(null);
          setValues((prev) => ({
            ...prev,
            lat,
            lng,
            placeId: results[0].place_id,
            formattedAddress: results[0].formatted_address,
          }));
          return;
        }

        setValues((prev) => ({ ...prev, lat, lng }));
        setGeoError('Could not resolve address for this pin.');
      }
    );
  };

  const updateMarker = (lat: number, lng: number) => {
    markerRef.current?.setPosition({ lat, lng });
    updateRouteLine({ lat, lng });
    reverseGeocode(lat, lng);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported on this device.');
      return;
    }

    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        updateMarker(position.coords.latitude, position.coords.longitude);
      },
      () => {
        setLocating(false);
        setGeoError('Unable to get current location. Check permissions.');
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const serviceable = isWithinServiceRadius(values.lat, values.lng);
  const serviceMessage = getServiceabilityMessage(values.lat, values.lng);

  return (
    <Box>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={32} />
        </Box>
      ) : null}
      {error ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Google Maps could not load ({error}). You can still use current
          location once Maps is configured via VITE_GOOGLE_MAPS_API_KEY.
        </Alert>
      ) : null}
      <TextField
        fullWidth
        inputRef={searchInputRef}
        label="Search location"
        placeholder="Search area, society, or landmark"
        sx={{ mb: 2 }}
        disabled={!isReady}
      />
      <Button
        variant="outlined"
        startIcon={
          locating ? <CircularProgress size={16} /> : <MyLocationIcon />
        }
        onClick={handleUseCurrentLocation}
        disabled={locating}
        sx={{ mb: 2, textTransform: 'none' }}
      >
        Use current location
      </Button>
      <Box
        ref={mapContainerRef}
        sx={{
          width: '100%',
          height: 280,
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: '#e8e8e8',
          mb: 2,
          border: '1px solid #ddd',
        }}
      />
      {geoError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {geoError}
        </Alert>
      ) : null}
      <Alert severity={serviceable ? 'success' : 'error'} sx={{ mb: 2 }}>
        {serviceMessage}
      </Alert>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Label
      </Typography>
      <ToggleButtonGroup
        exclusive
        fullWidth
        size="small"
        value={values.label}
        onChange={(_, next: AddressLabel | null) => {
          if (next) {
            setValues((prev) => ({ ...prev, label: next }));
          }
        }}
        sx={{ mb: 2 }}
      >
        <ToggleButton value="Home">Home</ToggleButton>
        <ToggleButton value="Work">Work</ToggleButton>
        <ToggleButton value="Other">Other</ToggleButton>
      </ToggleButtonGroup>
      <TextField
        fullWidth
        required
        label="Flat / House / Floor"
        placeholder="e.g. Tower B, Flat 1203"
        value={values.line1}
        error={fieldErrors.line1}
        helperText={fieldErrors.line1 ? 'Flat / House / Floor is required' : ''}
        onChange={(e) => {
          const value = e.target.value;

          setValues((prev) => ({
            ...prev,
            line1: value,
          }));

          if (value.trim()) {
            setFieldErrors((prev) => ({
              ...prev,
              line1: false,
            }));
          }
        }}
        sx={{ mb: 2 }}
      />
      <TextField
        fullWidth
        label="Landmark (optional)"
        placeholder="Near park / gate"
        value={values.landmark}
        onChange={(e) =>
          setValues((prev) => ({ ...prev, landmark: e.target.value }))
        }
        sx={{ mb: 2 }}
      />
      <TextField
        fullWidth
        required
        label="Address"
        value={values.formattedAddress}
        error={fieldErrors.formattedAddress}
        helperText={fieldErrors.formattedAddress ? 'Address is required' : ''}
        onChange={(e) => {
          const value = e.target.value;

          setValues((prev) => ({
            ...prev,
            formattedAddress: value,
          }));

          if (value.trim()) {
            setFieldErrors((prev) => ({
              ...prev,
              formattedAddress: false,
            }));
          }
        }}
        multiline
        minRows={2}
      />{' '}
    </Box>
  );
};

export default AddressMapPicker;
