import { RefObject, useLayoutEffect, useRef } from "react";

export function useScrollSelectedRequestIntoView(
  divRef: RefObject<HTMLDivElement | null>,
  isSelected: boolean
) {
  const prevIsSelectedRef = useRef<boolean>(false);

  useLayoutEffect(() => {
    if (isSelected && prevIsSelectedRef.current !== isSelected) {
      const div = divRef.current;
      if (div) {
        div.scrollIntoView({ block: "nearest", behavior: "auto" });
      }
    }

    prevIsSelectedRef.current = isSelected;
  }, [divRef, isSelected]);
}
