import { useRef } from "react";

export default function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  duration: number = 250
): T & { cancel: () => void } {
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  // @ts-ignore I don't know how to make TypeScript happy with the inner function signature.
  const debouncedCallback = useRef<T & { cancel: () => void }>(null);
  if (debouncedCallback.current === null) {
    const cancel = () => {
      if (timeoutIdRef.current !== null) {
        clearTimeout(timeoutIdRef.current);
      }
    };

    // @ts-ignore Ref initialization pattern is supported.
    debouncedCallback.current = (...args: any[]) => {
      cancel();

      timeoutIdRef.current = setTimeout(() => {
        timeoutIdRef.current = null;

        callback(...args);
      }, duration);
    };
    debouncedCallback.current!.cancel = cancel;
  }

  return debouncedCallback.current!;
}
