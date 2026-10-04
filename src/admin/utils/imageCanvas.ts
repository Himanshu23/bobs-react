/**
 * Browser-only image helpers for the cropper (not unit tested: they need a
 * real canvas). The pure rules live in imageCrop.ts.
 */
import {
  PixelArea,
  computeDrawPlacement,
  computeOutputSize,
  decodeErrorMessage,
  exportImageDataUrl,
} from './imageCrop';

/** DOM types via functions (eslint's no-undef doesn't know these names). */
type DrawableImage = Parameters<CanvasRenderingContext2D['drawImage']>[0];
// no-undef doesn't know TS DOM type names (a known false positive).
// eslint-disable-next-line no-undef
type BitmapOptions = ImageBitmapOptions;

export interface DecodedImage {
  /** Object URL for the cropper preview (revoke via `release`). */
  url: string;
  source: DrawableImage;
  /** Size after EXIF orientation, the same space as the cropper's pixels. */
  width: number;
  height: number;
  release: () => void;
}

const loadImgElement = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    // Upright pixels, matching the cropper's <img> (CSS default since 2020).
    img.style.imageOrientation = 'from-image';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('decode failed'));
    img.src = url;
  });

/**
 * Decodes a chosen file with EXIF orientation applied. It throws a readable
 * error when the browser can't decode it (e.g. HEIC outside Safari).
 */
export const decodeImageFile = async (file: File): Promise<DecodedImage> => {
  const url = URL.createObjectURL(file);
  try {
    if (typeof createImageBitmap === 'function') {
      try {
        // 'from-image' (apply EXIF rotation) isn't in TS 4.9's DOM types.
        const bitmap = await createImageBitmap(file, {
          imageOrientation: 'from-image',
        } as unknown as BitmapOptions);
        return {
          url,
          source: bitmap,
          width: bitmap.width,
          height: bitmap.height,
          release: () => {
            bitmap.close();
            URL.revokeObjectURL(url);
          },
        };
      } catch {
        // Some browsers reject the options or the format: try an <img>.
      }
    }
    const img = await loadImgElement(url);
    return {
      url,
      source: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      release: () => URL.revokeObjectURL(url),
    };
  } catch {
    URL.revokeObjectURL(url);
    throw new Error(decodeErrorMessage(file));
  }
};

/**
 * Draws `area` (source px) to a canvas, scaled so the longest side is at most
 * 1200 px, and returns a WebP (or JPEG fallback) data URL. When zoomed out the
 * area is bigger than the photo, and the gaps are filled with white.
 */
export const cropToDataUrl = (image: DecodedImage, area: PixelArea): string => {
  const out = computeOutputSize(area);
  const canvas = document.createElement('canvas');
  canvas.width = out.width;
  canvas.height = out.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not prepare the image. Please try again.');
  // White behind PNG cut-outs (JPEG has no transparency) and zoomed-out gaps.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  const place = computeDrawPlacement(area, image, out);
  ctx.drawImage(image.source, place.dx, place.dy, place.dWidth, place.dHeight);
  return exportImageDataUrl((mime, quality) => canvas.toDataURL(mime, quality))
    .dataUrl;
};
