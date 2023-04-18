import { useEffect, useRef } from "react";

export function useDebugDependenciesArray(
  dependencies: { [key: string]: any },
  callback: (changedKeys: string[], changedValues: any[]) => void
) {
  const committedValuesRef = useRef<typeof dependencies>(dependencies);

  useEffect(() => {
    const changedKeys: string[] = [];
    const changedValues: any[] = [];

    for (let key in dependencies) {
      const prevValue = committedValuesRef.current[key];
      const nextValue = dependencies[key];
      if (prevValue !== nextValue) {
        changedKeys.push(key);
        changedValues.push(nextValue);

        committedValuesRef.current[key] = nextValue;
      }
    }

    if (changedKeys.length > 0) {
      callback(changedKeys, changedValues);
    }
  });
}
