import { useEffect, useState } from "react";

export function useDebouncedState<Value>(value: Value, delay: number = 100) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return [debouncedValue, setDebouncedValue] as const;
}

export function useDebounce<Value>(value: Value, delay: number = 100) {
  const [debouncedValue] = useDebouncedState(value, delay);
  return debouncedValue;
}
