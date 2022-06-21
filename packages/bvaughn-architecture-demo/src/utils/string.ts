export function compareNumericStrings(a: string, b: string): number {
  return a.length < b.length ? -1 : a.length > b.length ? 1 : a < b ? -1 : a > b ? 1 : 0;
}

// Convenience function to JSON-stringify values that may contain circular references.
export function stringify(value: any, space?: string | number): string {
  const cache: any[] = [];

  return JSON.stringify(
    value,
    (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (cache.includes(value)) {
          return "[Circular]";
        }

        cache.push(value);
      }

      return value;
    },
    space
  );
}
