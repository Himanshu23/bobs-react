import { describe, expect, it } from 'vitest';
import { getSizeLabel } from './sizeLabels';

describe('getSizeLabel', () => {
  it('shows Large/Medium/Small for Coffee and Shakes', () => {
    expect(getSizeLabel('Full', 'Coffee')).toBe('Large');
    expect(getSizeLabel('Half', 'Shakes')).toBe('Medium');
    expect(getSizeLabel('Quarter', 'Coffee')).toBe('Small');
  });

  it('keeps Full/Half/Quarter for every other category', () => {
    expect(getSizeLabel('Full', 'Starters')).toBe('Full');
    expect(getSizeLabel('Half', 'Drinks')).toBe('Half');
  });

  it('keeps the stored value when the category is unknown (older orders)', () => {
    expect(getSizeLabel('Full', undefined)).toBe('Full');
    expect(getSizeLabel('Half', null)).toBe('Half');
  });

  it('is empty without a size', () => {
    expect(getSizeLabel(undefined, 'Coffee')).toBe('');
    expect(getSizeLabel('', 'Coffee')).toBe('');
  });
});
