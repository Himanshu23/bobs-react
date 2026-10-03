import { describe, expect, it } from 'vitest';
import {
  ASPECT_PRESETS,
  MAX_IMAGE_BYTES,
  clampCropArea,
  computeOutputSize,
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

describe('clampCropArea', () => {
  it('keeps the area inside the image', () => {
    expect(
      clampCropArea(
        { x: -1.4, y: 10.6, width: 1001.2, height: 600 },
        { width: 1000, height: 600 }
      )
    ).toEqual({ x: 0, y: 11, width: 1000, height: 589 });
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
