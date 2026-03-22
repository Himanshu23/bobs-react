import { Box, SxProps, Theme } from '@mui/material';
import { ImageNotSupported } from '@mui/icons-material';
import { useState } from 'react';

interface FoodImageProps {
  src: string;
  alt: string;
  size?: number; // width and height in px
  sx?: SxProps<Theme>;
  showPlaceholder?: boolean;
}

const FoodImage = ({
  src,
  alt,
  size = 110,
  sx = {},
  showPlaceholder = true,
}: FoodImageProps) => {
  const [imageError, setImageError] = useState(false);

  if (imageError && showPlaceholder) {
    return (
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: 1,
          backgroundColor: '#f5f5f5',
          border: '2px dashed #ccc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          ...sx,
        }}
      >
        <ImageNotSupported sx={{ color: '#999', fontSize: size * 0.35 }} />
      </Box>
    );
  }

  if (imageError) {
    return null; // Return nothing if placeholder is disabled
  }

  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      onError={() => setImageError(true)}
      sx={{
        width: size,
        height: size,
        borderRadius: 1,
        objectFit: 'cover',
        flexShrink: 0,
        ...sx,
      }}
    />
  );
};

export default FoodImage;
