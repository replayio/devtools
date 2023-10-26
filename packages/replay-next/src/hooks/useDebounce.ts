import { startTransition, useEffect, useState } from "react";

export function useDebounce<Value>(value: Value, delay: number = 100) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      startTransition(() => {
        setDebouncedValue(value);
      });
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
