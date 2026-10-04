import { describe, expect, it } from 'vitest';
import {
  ASPECT_PRESETS,
  MAX_IMAGE_BYTES,
  computeDrawPlacement,
  computeOutputSize,
  fitZoom,
  decodeErrorMessage,
  exportImageDataUrl,
  isDataUrlOfType,
  isHeicFile,
  validateImageFile,
} from './imageCrop';

const MB = 1024 * 1024;

describe('validateImageFile', () => {
  it('accepts images under the size limit', () => {
    expect(
      validateImageFile({ type: 'image/jpeg', name: 'a.jpg', size: 2 * MB })
    ).toBeNull();
    expect(
      validateImageFile({ type: 'image/heic', name: 'IMG_1.HEIC', size: MB })
    ).toBeNull();
  });

  it('accepts an image extension when the type is missing (HEIC on some browsers)', () => {
    expect(
      validateImageFile({ type: '', name: 'IMG_1.HEIC', size: MB })
    ).toBeNull();
    expect(
      validateImageFile({ type: '', name: 'notes.txt', size: 10 })
    ).toMatch(/image file/);
  });

  it('rejects non-images', () => {
    expect(
      validateImageFile({ type: 'application/pdf', name: 'menu.pdf', size: 10 })
    ).toMatch(/image file/);
  });

  it('rejects files over 15 MB with the size in the message', () => {
    expect(
      validateImageFile({
        type: 'image/png',
        name: 'big.png',
        size: MAX_IMAGE_BYTES + 1,
      })
    ).toBe('This photo is 15.0 MB. Please choose one under 15 MB.');
    expect(
      validateImageFile({ type: 'image/png', name: 'b.png', size: 18.2 * MB })
    ).toMatch(/18\.2 MB/);
    expect(
      validateImageFile({
        type: 'image/png',
        name: 'ok.png',
        size: MAX_IMAGE_BYTES,
      })
    ).toBeNull();
  });

  it('rejects empty files', () => {
    expect(
      validateImageFile({ type: 'image/png', name: 'e.png', size: 0 })
    ).toMatch(/empty/);
  });
});

describe('HEIC handling', () => {
  it('detects HEIC by type or extension', () => {
    expect(isHeicFile({ type: 'image/heic', name: 'x' })).toBe(true);
    expect(isHeicFile({ type: 'image/heif-sequence', name: 'x' })).toBe(true);
    expect(isHeicFile({ type: '', name: 'photo.heif' })).toBe(true);
    expect(isHeicFile({ type: 'image/jpeg', name: 'photo.jpg' })).toBe(false);
  });

  it('gives a HEIC-specific decode error', () => {
    expect(decodeErrorMessage({ type: 'image/heic', name: 'a.heic' })).toMatch(
      /HEIC/
    );
    expect(decodeErrorMessage({ type: 'image/png', name: 'a.png' })).toMatch(
      /couldn't be opened/
    );
  });
});

describe('computeOutputSize', () => {
  it('caps the longest side at 1200 and keeps the ratio', () => {
    expect(computeOutputSize({ width: 3000, height: 3000 })).toEqual({
      width: 1200,
      height: 1200,
    });
    expect(computeOutputSize({ width: 4032, height: 3024 })).toEqual({
      width: 1200,
      height: 900,
    });
    expect(computeOutputSize({ width: 1080, height: 1920 })).toEqual({
      width: 675,
      height: 1200,
    });
  });

  it('never upscales and rounds to whole pixels', () => {
    expect(computeOutputSize({ width: 800.4, height: 450.6 })).toEqual({
      width: 800,
      height: 451,
    });
    expect(computeOutputSize({ width: 0.2, height: 0 })).toEqual({
      width: 1,
      height: 1,
    });
  });

  it('accepts a custom max side', () => {
    expect(computeOutputSize({ width: 1600, height: 900 }, 800)).toEqual({
      width: 800,
      height: 450,
    });
  });
});

describe('fitZoom', () => {
  it('is 1 when the photo already has the frame shape', () => {
    expect(fitZoom(1, { width: 800, height: 800 })).toBe(1);
    expect(fitZoom(16 / 9, { width: 1600, height: 900 })).toBeCloseTo(1);
  });

  it('zooms out enough to show a tall photo whole in a square frame', () => {
    // 600×1200 in 1:1: at zoom 1 the frame is 600×600 of the photo; the whole
    // photo needs a 1200 px frame, so half the zoom.
    expect(fitZoom(1, { width: 600, height: 1200 })).toBe(0.5);
  });

  it('zooms out enough to show a wide photo whole in a square frame', () => {
    expect(fitZoom(1, { width: 1600, height: 900 })).toBeCloseTo(900 / 1600);
  });

  it('handles a square photo in a 16:9 frame', () => {
    expect(fitZoom(16 / 9, { width: 1000, height: 1000 })).toBeCloseTo(9 / 16);
  });

  it('falls back to 1 for an empty image', () => {
    expect(fitZoom(1, { width: 0, height: 100 })).toBe(1);
  });
});

describe('computeDrawPlacement', () => {
  it('draws a crop inside the photo shifted and scaled to the canvas', () => {
    expect(
      computeDrawPlacement(
        { x: 100, y: 50, width: 400, height: 400 },
        { width: 1000, height: 600 },
        { width: 200, height: 200 }
      )
    ).toEqual({ dx: -50, dy: -25, dWidth: 500, dHeight: 300 });
  });

  it('centres a zoomed-out photo, leaving white bands', () => {
    // 600×1200 photo fitted in a 1200×1200 square: 300 px bands each side.
    expect(
      computeDrawPlacement(
        { x: -300, y: 0, width: 1200, height: 1200 },
        { width: 600, height: 1200 },
        { width: 1200, height: 1200 }
      )
    ).toEqual({ dx: 300, dy: 0, dWidth: 600, dHeight: 1200 });
  });

  it('scales the bands with the output size', () => {
    expect(
      computeDrawPlacement(
        { x: -300, y: 0, width: 1200, height: 1200 },
        { width: 600, height: 1200 },
        { width: 600, height: 600 }
      )
    ).toEqual({ dx: 150, dy: 0, dWidth: 300, dHeight: 600 });
  });
});

describe('output format', () => {
  it('has 1:1 as the default preset', () => {
    expect(ASPECT_PRESETS[0]).toEqual({ label: '1:1', value: 1 });
    expect(ASPECT_PRESETS.map((p) => p.label)).toEqual(['1:1', '4:3', '16:9']);
  });

  it('checks data URL types', () => {
    expect(isDataUrlOfType('data:image/webp;base64,AAA', 'image/webp')).toBe(
      true
    );
    expect(isDataUrlOfType('data:image/png;base64,AAA', 'image/webp')).toBe(
      false
    );
  });

  it('exports WebP at 0.8 when supported', () => {
    const calls: [string, number][] = [];
    const result = exportImageDataUrl((mime, quality) => {
      calls.push([mime, quality]);
      return `data:${mime};base64,AAA`;
    });
    expect(result).toEqual({
      dataUrl: 'data:image/webp;base64,AAA',
      mime: 'image/webp',
    });
    expect(calls).toEqual([['image/webp', 0.8]]);
  });

  it('falls back to JPEG at 0.85 when WebP comes back as PNG', () => {
    const calls: [string, number][] = [];
    const result = exportImageDataUrl((mime, quality) => {
      calls.push([mime, quality]);
      return mime === 'image/webp'
        ? 'data:image/png;base64,PNG'
        : `data:${mime};base64,JPG`;
    });
    expect(result).toEqual({
      dataUrl: 'data:image/jpeg;base64,JPG',
      mime: 'image/jpeg',
    });
    expect(calls).toEqual([
      ['image/webp', 0.8],
      ['image/jpeg', 0.85],
    ]);
  });
});
