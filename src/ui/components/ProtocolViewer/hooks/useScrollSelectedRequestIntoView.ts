import { MutableRefObject, useContext, useLayoutEffect, useRef } from "react";

import { ProtocolViewerContext } from "ui/components/ProtocolViewer/components/ProtocolViewerContext";

export function useScrollSelectedRequestIntoView(
  divRef: MutableRefObject<HTMLDivElement>,
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
