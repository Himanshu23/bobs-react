import { useState } from 'react';
import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  Drawer,
  IconButton,
  SxProps,
  Theme,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  Close as CloseIcon,
  InfoOutlined as InfoOutlinedIcon,
  LocationOnOutlined as LocationOnOutlinedIcon,
  Notes as NotesIcon,
  Phone as PhoneIcon,
  VerifiedOutlined as VerifiedOutlinedIcon,
} from '@mui/icons-material';
import { Restaurant } from '../../types/marketplace';
import { trackEvent } from '../../utils/analytics';
import {
  getCuisineTags,
  getRestaurantInfoRows,
  RestaurantInfoRowKind,
} from '../../utils/restaurantDisplay';
import RestaurantPhoneLink from './RestaurantPhoneLink';
import { getNextOpensText } from '../../utils/restaurantHours';

const ROW_ICONS: Record<RestaurantInfoRowKind, typeof NotesIcon> = {
  description: NotesIcon,
  address: LocationOnOutlinedIcon,
  openingHours: AccessTimeIcon,
  fssaiNumber: VerifiedOutlinedIcon,
  phone: PhoneIcon,
};

interface RestaurantInfoSheetProps {
  restaurant: Restaurant;
  open: boolean;
  onClose: () => void;
  /** Analytics source of the tap-to-call link. */
  source: string;
}

/**
 * Restaurant details: a bottom sheet on phones, a dialog on wider screens.
 * Rows with no value are hidden.
 */
export const RestaurantInfoSheet = ({
  restaurant,
  open,
  onClose,
  source,
}: RestaurantInfoSheetProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const titleId = `restaurant-info-title-${restaurant.id}`;
  const cuisines = getCuisineTags(restaurant);
  const rows = getRestaurantInfoRows(restaurant);

  const content = (
    <Box sx={{ px: 2.5, pt: 2, pb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            id={titleId}
            variant="h6"
            component="h2"
            sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.25 }}
          >
            {restaurant.name}
          </Typography>
          {cuisines.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              {cuisines.join(', ')}
            </Typography>
          )}
          {/* Only when the server sends openNow (D15). */}
          {typeof restaurant.openNow === 'boolean' && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1,
                mt: 0.75,
              }}
            >
              <Chip
                size="small"
                label={restaurant.openNow ? 'Open now' : 'Closed'}
                color={restaurant.openNow ? 'success' : 'default'}
                sx={{ fontWeight: 700, height: 22 }}
              />
              {!restaurant.openNow && getNextOpensText(restaurant) && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 0 }}
                >
                  {getNextOpensText(restaurant)}
                </Typography>
              )}
            </Box>
          )}
        </Box>
        <IconButton
          onClick={onClose}
          aria-label="Close restaurant info"
          edge="end"
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <Box component="dl" sx={{ m: 0, mt: 2 }}>
        {rows.map((row) => {
          const Icon = ROW_ICONS[row.kind];
          return (
            <Box
              key={row.kind}
              sx={{
                display: 'flex',
                gap: 1.5,
                py: 1.25,
                borderTop: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Icon
                aria-hidden
                sx={{ fontSize: '1.2rem', color: 'primary.main', mt: 0.25 }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  component="dt"
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mb: 0 }}
                >
                  {row.label}
                </Typography>
                <Typography
                  component="dd"
                  variant="body2"
                  sx={{
                    m: 0,
                    color: 'text.primary',
                    whiteSpace: 'pre-line',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {row.kind === 'phone' ? (
                    <RestaurantPhoneLink
                      phone={row.value}
                      restaurantId={restaurant.id}
                      source={source}
                      sx={{ '& svg': { display: 'none' } }}
                    />
                  ) : (
                    row.value
                  )}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        PaperProps={{
          role: 'dialog',
          'aria-modal': true,
          'aria-labelledby': titleId,
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '85vh',
          },
        }}
      >
        {/* Grab handle */}
        <Box
          aria-hidden
          sx={{
            width: 40,
            height: 4,
            borderRadius: 2,
            bgcolor: 'divider',
            mx: 'auto',
            mt: 1,
          }}
        />
        {content}
      </Drawer>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby={titleId}
      fullWidth
      maxWidth="xs"
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogContent sx={{ p: 0 }}>{content}</DialogContent>
    </Dialog>
  );
};

interface RestaurantInfoButtonProps {
  restaurant: Restaurant;
  /** Analytics source, e.g. "restaurant_card", "menu_header", "cart_group". */
  source: string;
  sx?: SxProps<Theme>;
}

/**
 * ⓘ button that opens the {@link RestaurantInfoSheet}. Clicks never reach a
 * clickable parent (the restaurant card), including clicks inside the sheet,
 * which React bubbles through the portal to this element.
 */
const RestaurantInfoButton = ({
  restaurant,
  source,
  sx,
}: RestaurantInfoButtonProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Box
      component="span"
      onClick={(event) => event.stopPropagation()}
      sx={{ display: 'inline-flex', flexShrink: 0 }}
    >
      <IconButton
        size="small"
        aria-label={`Restaurant info for ${restaurant.name}`}
        aria-haspopup="dialog"
        onClick={() => {
          setOpen(true);
          trackEvent('restaurant_info_open', {
            restaurant_id: restaurant.id,
            source,
          });
        }}
        sx={{ color: 'text.secondary', ...sx }}
      >
        <InfoOutlinedIcon fontSize="small" />
      </IconButton>
      <RestaurantInfoSheet
        restaurant={restaurant}
        open={open}
        onClose={() => setOpen(false)}
        source={source}
      />
    </Box>
  );
};

export default RestaurantInfoButton;
