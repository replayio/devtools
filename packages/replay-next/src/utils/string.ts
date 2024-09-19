export const NEW_LINE_REGEX = /\r\n?|\n|\u2028|\u2029/;

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

export function truncateMiddle(value: string, maxLength = 250, separator = "...") {
  if (value.length > maxLength) {
    const charIndex = (maxLength - separator.length) / 2;
    return value.slice(0, Math.ceil(charIndex)) + separator + value.slice(0 - Math.ceil(charIndex));
  }

  return value;
}
