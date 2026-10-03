import React from 'react';
import { MenuItem, TextField } from '@mui/material';
import { RestaurantFilterOption } from '../../admin/utils/adminOrders';

interface RestaurantFilterSelectProps {
  value: string;
  options: RestaurantFilterOption[];
  onChange: (restaurantId: string) => void;
  label?: string;
  allLabel?: string;
  /** Hide the "all" option (e.g. when a restaurant is required). */
  required?: boolean;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  minWidth?: number;
}

/** Restaurant picker used by the order, payout and reporting filters. */
const RestaurantFilterSelect: React.FC<RestaurantFilterSelectProps> = ({
  value,
  options,
  onChange,
  label = 'Restaurant',
  allLabel = 'All restaurants',
  required = false,
  size = 'small',
  fullWidth = true,
  minWidth = 180,
}) => (
  <TextField
    select
    size={size}
    fullWidth={fullWidth}
    label={label}
    value={value}
    onChange={(event) => onChange(event.target.value)}
    sx={{ minWidth }}
  >
    {!required && <MenuItem value="">{allLabel}</MenuItem>}
    {options.map((option) => (
      <MenuItem key={option.id} value={option.id}>
        {option.name}
      </MenuItem>
    ))}
  </TextField>
);

export default RestaurantFilterSelect;
