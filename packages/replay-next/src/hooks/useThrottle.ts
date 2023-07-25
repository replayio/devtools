import { useEffect, useRef, useState } from "react";

export function useThrottle<Value>(value: Value, interval: number = 100): Value {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastUpdatedAtRef = useRef<number>(0);

  useEffect(() => {
    const now = Date.now();
    const lastUpdatedAt = lastUpdatedAtRef.current;
    const elapsed = lastUpdatedAt === 0 ? 0 : now - lastUpdatedAt;
    const delta = interval - elapsed;

    if (delta <= 0) {
      lastUpdatedAtRef.current = now;

      setThrottledValue(value);
    } else {
      const id = setTimeout(() => {
        lastUpdatedAtRef.current = now;

        setThrottledValue(value);
      }, delta);

      return () => {
        clearTimeout(id);
      };
    }
  }, [value, interval]);

  return throttledValue;
}
