import { useRef, useEffect } from "react";

export default function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  duration: number
): T {
  useEffect(() => {
    return () => {
      clearTimeout(timeoutIdRef.current);
    };
  }, []);

  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  // @ts-ignore I don't know how to make TypeScript happy with the inner function signature.
  const debouncedCallback = useRef<T>((...args: any[]) => {
    if (timeoutIdRef.current !== null) {
      clearTimeout(timeoutIdRef.current);
    }

    timeoutIdRef.current = setTimeout(() => {
      timeoutIdRef.current = null;

      callback(...args);
    }, duration);
  });

  return debouncedCallback.current;
}
