import React, { useEffect, useMemo, useState } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Slider,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import {
  ASPECT_PRESETS,
  MAX_CROP_ZOOM,
  fitZoom,
} from '../../admin/utils/imageCrop';
import { DecodedImage, cropToDataUrl } from '../../admin/utils/imageCanvas';

interface ImageCropDialogProps {
  /** The decoded photo; the dialog is open while this is set. */
  image: DecodedImage | null;
  onCancel: () => void;
  /** Cropped, downscaled `data:image/...;base64,` string. */
  onConfirm: (dataUrl: string) => void;
  /** Starting aspect ratio; defaults to the first preset (1:1). */
  defaultAspect?: number;
}

/**
 * Crop step for food-item and restaurant photos: drag, pinch/scroll or slider
 * zoom, aspect presets (1:1 default, 4:3, 16:9). Zooming out below "fill"
 * fits the whole photo, padded with white. Full screen on phones.
 */
const ImageCropDialog: React.FC<ImageCropDialogProps> = ({
  image,
  onCancel,
  onConfirm,
  defaultAspect = ASPECT_PRESETS[0].value,
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(defaultAspect);
  const [areaPixels, setAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Lowest zoom = the whole photo inside the frame (1 = photo fills the frame).
  const minZoom = useMemo(
    () => (image ? fitZoom(aspect, image) : 1),
    [aspect, image]
  );

  // A new shape can raise the minimum; keep the zoom in range.
  useEffect(() => {
    setZoom((current) => Math.max(current, minZoom));
  }, [minZoom]);

  const showWholePhoto = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(minZoom);
  };

  const fillFrame = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  // Fresh state for every new photo.
  useEffect(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setAspect(defaultAspect);
    setAreaPixels(null);
    setBusy(false);
    setError(null);
  }, [image, defaultAspect]);

  const handleConfirm = () => {
    if (!image || !areaPixels) return;
    setBusy(true);
    setError(null);
    // Let the spinner paint before the (synchronous) canvas work.
    window.setTimeout(() => {
      try {
        onConfirm(cropToDataUrl(image, areaPixels));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Could not crop the photo.'
        );
        setBusy(false);
      }
    }, 0);
  };

  return (
    <Dialog
      open={!!image}
      onClose={busy ? undefined : onCancel}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle sx={{ fontWeight: 800 }}>Crop photo</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: fullScreen ? 'auto' : 360,
            flex: fullScreen ? 1 : undefined,
            minHeight: 280,
            // White, like the padding the exported photo gets when zoomed out.
            bgcolor: '#fff',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            overflow: 'hidden',
          }}
        >
          {image && (
            <Cropper
              image={image.url}
              crop={crop}
              zoom={zoom}
              minZoom={minZoom}
              maxZoom={MAX_CROP_ZOOM}
              aspect={aspect}
              // Below "fill" the photo is smaller than the frame and must be
              // free to sit inside it.
              restrictPosition={zoom >= 1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setAreaPixels(pixels)}
              zoomWithScroll
            />
          )}
        </Box>

        <Stack direction="row" spacing={2} alignItems="center">
          <ZoomOutIcon color="action" />
          <Slider
            value={zoom}
            min={minZoom}
            max={MAX_CROP_ZOOM}
            step={0.01}
            onChange={(_, value) => setZoom(value as number)}
            aria-label="Zoom"
          />
          <ZoomInIcon color="action" />
        </Stack>

        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant={zoom <= minZoom + 0.001 ? 'contained' : 'outlined'}
            onClick={showWholePhoto}
            disabled={minZoom >= 1}
            fullWidth
          >
            Fit whole photo
          </Button>
          <Button
            size="small"
            variant={Math.abs(zoom - 1) < 0.001 ? 'contained' : 'outlined'}
            onClick={fillFrame}
            fullWidth
          >
            Fill frame
          </Button>
        </Stack>

        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="body2" color="text.secondary">
            Shape
          </Typography>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={aspect}
            onChange={(_, value: number | null) => value && setAspect(value)}
          >
            {ASPECT_PRESETS.map((preset) => (
              <ToggleButton key={preset.label} value={preset.value}>
                {preset.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>

        <Typography variant="caption" color="text.secondary">
          Drag to position. Pinch, scroll or use the slider to zoom; zoom out to
          keep the whole photo (the edges are filled with white).
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={busy || !areaPixels}
          startIcon={busy ? <CircularProgress size={18} /> : undefined}
        >
          Use photo
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImageCropDialog;
