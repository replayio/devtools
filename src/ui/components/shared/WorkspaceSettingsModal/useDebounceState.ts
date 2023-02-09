import { useEffect, useRef, useState } from "react";

export default function useDebounceState<T>(
  original: T | undefined,
  callback: (value: T) => void,
  timeout = 500
): [T | undefined, (value: T) => void, (value: T) => void] {
  useEffect(() => {
    return () => {
      clearTimeout(ref.current);
    };
  }, []);

  const [value, updateValue] = useState(original); // nosemgrep typescript.react.best-practice.react-props-in-state.react-props-in-state
  const ref = useRef<NodeJS.Timeout | undefined>();

  const setValue = (updated: T) => {
    updateValue(updated);

    if (ref.current) {
      clearTimeout(ref.current);
    }

    ref.current = setTimeout(() => callback(updated), timeout);
  };

  return [value, setValue, updateValue];
}
