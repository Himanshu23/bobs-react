import { Box, Typography, Button, Badge } from '@mui/material';
import { CircleSharp, ImageNotSupported } from '@mui/icons-material'; // Veg & Non-Veg Icons
import { CartActions, FoodItem, ItemOptions } from '../../types';
import { useSelector } from 'react-redux';
import { selectProductTotalQuantity } from '../../redux/selectors';
import { useState } from 'react';
import PriceDisplay from '../PriceDisplay';
import { getLowestNowPrice, getLowestWasPrice } from '../../utils/priceUtils';

interface FoodItemCardProps {
  item: FoodItem;
  handleCart: (id: string, action: CartActions, option?: ItemOptions) => void;
  searchQuery?: string;
}

const normalizeSearchText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const getHighlightedSegments = (text: string, searchQuery?: string) => {
  const normalizedQuery = normalizeSearchText(searchQuery ?? '');

  if (!normalizedQuery) {
    return [{ text, highlighted: false }];
  }

  const queryTokens = normalizedQuery.split(' ').filter(Boolean);
  const matches: Array<{ start: number; end: number }> = [];
  const lowerText = text.toLowerCase();

  queryTokens.forEach((token) => {
    let startIndex = 0;

    while (startIndex < lowerText.length) {
      const index = lowerText.indexOf(token, startIndex);

      if (index === -1) {
        break;
      }

      matches.push({ start: index, end: index + token.length });
      startIndex = index + token.length;
    }
  });

  if (matches.length === 0) {
    return [{ text, highlighted: false }];
  }

  matches.sort((left, right) => left.start - right.start);

  const mergedMatches = matches.reduce<Array<{ start: number; end: number }>>(
    (accumulator, match) => {
      const previousMatch = accumulator[accumulator.length - 1];

      if (!previousMatch || match.start > previousMatch.end) {
        accumulator.push({ ...match });
        return accumulator;
      }

      previousMatch.end = Math.max(previousMatch.end, match.end);
      return accumulator;
    },
    []
  );

  const segments: Array<{ text: string; highlighted: boolean }> = [];
  let currentIndex = 0;

  mergedMatches.forEach((match) => {
    if (currentIndex < match.start) {
      segments.push({
        text: text.slice(currentIndex, match.start),
        highlighted: false,
      });
    }

    segments.push({
      text: text.slice(match.start, match.end),
      highlighted: true,
    });
    currentIndex = match.end;
  });

  if (currentIndex < text.length) {
    segments.push({ text: text.slice(currentIndex), highlighted: false });
  }

  return segments;
};

const FoodItemCard = ({ item, handleCart, searchQuery }: FoodItemCardProps) => {
  const totalQuantity = useSelector(selectProductTotalQuantity(item.id));
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const lowestNowPrice = getLowestNowPrice(item);
  const lowestWasPrice = getLowestWasPrice(item);
  const highlightedNameSegments = getHighlightedSegments(
    item.name,
    searchQuery
  );

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'stretch',
        gap: 2,
        width: 360,
        padding: 2,
        borderRadius: 2,
        boxShadow: 3,
        backgroundColor: 'white',
        flexShrink: 0,
      }}
    >
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: 28 }}
        >
          {item.veg ? (
            <CircleSharp sx={{ color: 'green', fontSize: 14, flexShrink: 0 }} />
          ) : (
            <CircleSharp sx={{ color: 'red', fontSize: 14, flexShrink: 0 }} />
          )}
          <Typography
            variant="body1"
            fontWeight="bold"
            sx={{ wordBreak: 'break-word' }}
          >
            {highlightedNameSegments.map((segment, index) => (
              <Box
                key={`${item.id}-name-${index}`}
                component="span"
                sx={
                  segment.highlighted
                    ? {
                        backgroundColor: '#fff1a8',
                        color: 'inherit',
                        px: 0.2,
                        borderRadius: 0.5,
                      }
                    : undefined
                }
              >
                {segment.text}
              </Box>
            ))}
          </Typography>
        </Box>

        {/* <Rating value={item.rating} precision={0.5} readOnly sx={{ my: 1 }} /> */}

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 1, flex: 1 }}
        >
          {item.description}
        </Typography>

        {/* Was Now Price */}
        <PriceDisplay nowPrice={lowestNowPrice} wasPrice={lowestWasPrice} />

        {totalQuantity > 0 ? (
          <Badge
            badgeContent={totalQuantity}
            color="primary"
            sx={{
              '& .MuiBadge-badge': {
                right: 43,
                top: 12,
                fontSize: '12px',
              },
            }}
          >
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 1, textTransform: 'none', alignSelf: 'flex-start' }}
              onClick={() => handleCart(item.id, 'Add')}
            >
              View Cart Items
            </Button>
          </Badge>
        ) : (
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 1, alignSelf: 'flex-start' }}
            onClick={() => handleCart(item.id, 'Add')}
          >
            Add to Cart
          </Button>
        )}
      </Box>

      {imageError ? (
        <Box
          sx={{
            width: 110,
            height: 110,
            borderRadius: 1,
            backgroundColor: '#f5f5f5',
            border: '2px dashed #ccc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <ImageNotSupported sx={{ color: '#999', fontSize: 40 }} />
        </Box>
      ) : (
        <Box
          component="img"
          src={item.image}
          alt={item.name}
          onError={handleImageError}
          sx={{
            width: 110,
            height: 110,
            borderRadius: 1,
            objectFit: 'cover',
            flexShrink: 0,
          }}
        />
      )}
    </Box>
  );
};

export default FoodItemCard;
