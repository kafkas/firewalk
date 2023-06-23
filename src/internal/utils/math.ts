export function isNonNegativeInteger(num: unknown): boolean {
  return isPositiveInteger(num) || num === 0;
}

export function isUnboundedPositiveInteger(num: unknown): boolean {
  return isPositiveInteger(num) || num === Infinity;
}

export function isPositiveInteger(num: unknown): boolean {
  return typeof num === 'number' && Number.isInteger(num) && num > 0;
}
