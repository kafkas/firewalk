import { isPositiveInteger } from '..';

describe('isPositiveInteger', () => {
  test('respects math', () => {
    expect(isPositiveInteger(-Infinity)).toBe(false);
    expect(isPositiveInteger(-1.2)).toBe(false);
    expect(isPositiveInteger(-1)).toBe(false);
    expect(isPositiveInteger(0)).toBe(false);
    expect(isPositiveInteger(0.5)).toBe(false);
    expect(isPositiveInteger(1)).toBe(true);
    expect(isPositiveInteger(2)).toBe(true);
    expect(isPositiveInteger(Infinity)).toBe(false);
  });
});
