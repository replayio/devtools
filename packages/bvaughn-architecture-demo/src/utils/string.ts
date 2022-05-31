export function compareNumericStrings(a: string, b: string): number {
  return a.length < b.length ? -1 : a.length > b.length ? 1 : a < b ? -1 : a > b ? 1 : 0;
}
