export function sleep(duration: number): Promise<void> {
  return new Promise((r) => setTimeout(r, duration));
}

export function isPositiveInteger(num: number): boolean {
  return Number.isInteger(num) && num > 0;
}
