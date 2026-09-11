import { Box, SxProps, Theme } from '@mui/material';
import { ImageNotSupported } from '@mui/icons-material';
import { useEffect, useState } from 'react';

interface FoodImageProps {
  src: string;
  alt: string;
  size?: number;
  sx?: SxProps<Theme>;
  showPlaceholder?: boolean;
}

const FALLBACK_IMAGE = '/imgs/no-image.jpeg';

const FoodImage = ({
  src,
  alt,
  size = 110,
  sx = {},
  showPlaceholder = true,
}: FoodImageProps) => {
  const [imageSrc, setImageSrc] = useState(src || FALLBACK_IMAGE);
  const [fallbackFailed, setFallbackFailed] = useState(false);

  useEffect(() => {
    setImageSrc(src || FALLBACK_IMAGE);
    setFallbackFailed(false);
  }, [src]);

  const imageError = fallbackFailed && imageSrc === FALLBACK_IMAGE;

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
    return null;
  }

  return (
    <Box
      component="img"
      src={imageSrc}
      alt={alt}
      onError={() => {
        if (imageSrc !== FALLBACK_IMAGE) {
          setImageSrc(FALLBACK_IMAGE);
        } else {
          setFallbackFailed(true);
        }
      }}
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
