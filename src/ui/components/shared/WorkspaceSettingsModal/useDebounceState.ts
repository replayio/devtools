import { useEffect, useRef, useState } from "react";

export default function useDebounceState(
  original: string | undefined,
  callback: (value: string) => void,
  timeout = 500
): [string | undefined, (value: string) => void] {
  const [value, updateValue] = useState(original);
  const ref = useRef<NodeJS.Timeout | undefined>();

  useEffect(() => {
    if (original !== undefined) {
      updateValue(original);
    }
  }, [original]);

  const setValue = (updated: string) => {
    updateValue(updated);

    if (ref.current) {
      clearTimeout(ref.current);
    }

    ref.current = setTimeout(() => callback(updated), timeout);
  };

  return [value, setValue];
}
