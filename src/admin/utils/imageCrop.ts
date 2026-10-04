/**
 * Pure helpers for the food-item image cropper (EditItemDrawer). The canvas
 * drawing lives in ImageCropDialog; everything decidable without a browser is
 * here so it can be unit tested.
 */

/** Files above this are rejected before cropping. */
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

/** Longest side of the exported image, in px. */
export const MAX_OUTPUT_SIDE = 1200;

export const WEBP_QUALITY = 0.8;
export const JPEG_QUALITY = 0.85;

export interface AspectPreset {
  label: string;
  value: number;
}

/** Crop aspect presets; the first one is the default. */
export const ASPECT_PRESETS: AspectPreset[] = [
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
];

/** Most zoom the cropper allows. */
export const MAX_CROP_ZOOM = 4;

const IMAGE_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
  'avif',
  'bmp',
  'heic',
  'heif',
];

const extensionOf = (name: string): string => {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
};

/** HEIC/HEIF (iPhone photos), by MIME type or extension. */
export const isHeicFile = (file: { type: string; name: string }): boolean =>
  /^image\/hei[cf](-sequence)?$/i.test(file.type) ||
  ['heic', 'heif'].includes(extensionOf(file.name));

const formatMb = (bytes: number): string =>
  `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

/**
 * Checks a chosen file before cropping. Returns an error message, or null when
 * it can be opened. Some browsers give HEIC files an empty type, so an image
 * extension is accepted when the type is missing.
 */
export const validateImageFile = (file: {
  type: string;
  name: string;
  size: number;
}): string | null => {
  const type = (file.type || '').toLowerCase();
  const isImage = type
    ? type.startsWith('image/')
    : IMAGE_EXTENSIONS.includes(extensionOf(file.name));
  if (!isImage) {
    return 'Please choose an image file (JPG, PNG, WebP, HEIC…).';
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `This photo is ${formatMb(file.size)}. Please choose one under ${formatMb(MAX_IMAGE_BYTES).replace('.0', '')}.`;
  }
  if (file.size === 0) {
    return 'This file is empty.';
  }
  return null;
};

/** Message when the browser can't decode the chosen file. */
export const decodeErrorMessage = (file: {
  type: string;
  name: string;
}): string =>
  isHeicFile(file)
    ? "This browser can't open HEIC photos. Set the iPhone camera to 'Most Compatible', or export the photo as JPG/PNG and try again."
    : "This image couldn't be opened. Try a JPG or PNG file.";

export interface Size {
  width: number;
  height: number;
}

/**
 * Output size for a crop of `width × height` source px, scaled down so the
 * longest side is at most `maxSide` (never scaled up). At least 1 px each.
 */
export const computeOutputSize = (
  crop: Size,
  maxSide: number = MAX_OUTPUT_SIDE
): Size => {
  const width = Math.max(1, Math.round(crop.width));
  const height = Math.max(1, Math.round(crop.height));
  const longest = Math.max(width, height);
  if (longest <= maxSide) return { width, height };
  const scale = maxSide / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
};

export interface PixelArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Cropper zoom at which the whole photo fits inside a crop frame of `aspect`
 * (zoom 1 = the photo fills the frame). Never above 1.
 */
export const fitZoom = (aspect: number, image: Size): number => {
  if (image.width <= 0 || image.height <= 0 || aspect <= 0) return 1;
  const ratio = image.width / image.height;
  return Math.min(1, ratio / aspect, aspect / ratio);
};

export interface DrawPlacement {
  dx: number;
  dy: number;
  dWidth: number;
  dHeight: number;
}

/**
 * Where to draw the whole photo on an `out`-sized canvas so that it shows
 * `area` (source px). The area may reach past the photo when zoomed out; that
 * part of the canvas stays as the background (white).
 */
export const computeDrawPlacement = (
  area: PixelArea,
  image: Size,
  out: Size
): DrawPlacement => {
  const scaleX = out.width / Math.max(1, area.width);
  const scaleY = out.height / Math.max(1, area.height);
  return {
    dx: (0 - area.x) * scaleX, // 0 - x, not -x: avoids -0
    dy: (0 - area.y) * scaleY,
    dWidth: image.width * scaleX,
    dHeight: image.height * scaleY,
  };
};

/** True when `dataUrl` really is of `mime` (unsupported types fall back to PNG). */
export const isDataUrlOfType = (dataUrl: string, mime: string): boolean =>
  dataUrl.startsWith(`data:${mime};`) || dataUrl.startsWith(`data:${mime},`);

/**
 * Exports via `toDataURL` (a canvas's, in the app) as WebP at 0.8, or JPEG at
 * 0.85 when the browser can't encode WebP (it returns PNG instead).
 */
export const exportImageDataUrl = (
  toDataURL: (mime: string, quality: number) => string
): { dataUrl: string; mime: string } => {
  const webp = toDataURL('image/webp', WEBP_QUALITY);
  if (isDataUrlOfType(webp, 'image/webp')) {
    return { dataUrl: webp, mime: 'image/webp' };
  }
  return {
    dataUrl: toDataURL('image/jpeg', JPEG_QUALITY),
    mime: 'image/jpeg',
  };
};
