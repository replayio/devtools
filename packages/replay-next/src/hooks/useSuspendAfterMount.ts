import { startTransition, useEffect, useState } from "react";

type AnyFunction<ReturnType> = (...args: any[]) => ReturnType;

export default function useSuspendAfterMount<ReturnType>(
  callback: AnyFunction<ReturnType>
): ReturnType | undefined {
  const [didMount, setDidMount] = useState(false);

  useEffect(() => {
    startTransition(() => {
      setDidMount(true);
    });
  }, []);

  return didMount ? callback() : undefined;
}
