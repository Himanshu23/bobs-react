import { Link, SxProps, Theme } from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import { trackEvent } from '../../utils/analytics';

interface RestaurantPhoneLinkProps {
  phone: string;
  restaurantId: string;
  source: string;
  sx?: SxProps<Theme>;
}

/** Tap-to-call restaurant phone (D6: always visible to customers). */
const RestaurantPhoneLink = ({
  phone,
  restaurantId,
  source,
  sx,
}: RestaurantPhoneLinkProps) => (
  <Link
    href={`tel:${phone.replace(/[^\d+]/g, '')}`}
    underline="hover"
    onClick={(event) => {
      // Cards are clickable; calling must not also open the menu.
      event.stopPropagation();
      trackEvent('restaurant_call_click', {
        restaurant_id: restaurantId,
        source,
      });
    }}
    aria-label={`Call ${phone}`}
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.5,
      fontSize: '0.875rem',
      fontWeight: 500,
      ...sx,
    }}
  >
    <PhoneIcon sx={{ fontSize: '1rem' }} />
    {phone}
  </Link>
);

export default RestaurantPhoneLink;
