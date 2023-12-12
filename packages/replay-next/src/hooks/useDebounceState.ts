import { useCallback, useEffect, useRef, useState } from "react";

export type DebounceState<Type> = {
  debouncedValue: Type | undefined;
  value: Type | undefined;
  setValue: (value: Type) => void;
  setValueDebounced: (value: Type) => void;
};

export default function useDebounceState<Type>(
  defaultValue: Type | undefined,
  interval: number = 500
): DebounceState<Type> {
  const [state, setState] = useState<{
    debouncedValue: Type | undefined;
    value: Type | undefined;
  }>({
    debouncedValue: defaultValue,
    value: defaultValue,
  });

  const ref = useRef<{
    interval: number;
    pendingValue: Type | undefined;
    timeout: NodeJS.Timeout | null;
  }>({
    interval,
    pendingValue: undefined,
    timeout: null,
  });

  useEffect(() => {
    ref.current.interval = interval;
  });

  const setValueHighPriority = useCallback((value: Type) => {
    const { timeout } = ref.current;

    if (timeout) {
      clearTimeout(timeout);
    }

    ref.current.pendingValue = value;
    ref.current.timeout = null;

    setState({
      debouncedValue: value,
      value: value,
    });
  }, []);

  const setValueDebounced = useCallback((value: Type) => {
    const { interval, pendingValue, timeout } = ref.current;

    if (value === pendingValue) {
      return;
    }

    if (timeout) {
      clearTimeout(timeout);
    }

    setState(prevState => ({
      ...prevState,
      value: value,
    }));

    ref.current.pendingValue = value;
    ref.current.timeout = setTimeout(() => {
      setState(prevState => ({
        ...prevState,
        debouncedValue: value,
      }));
    }, interval);
  }, []);

  return {
    ...state,
    setValue: setValueHighPriority,
    setValueDebounced,
  };
}
