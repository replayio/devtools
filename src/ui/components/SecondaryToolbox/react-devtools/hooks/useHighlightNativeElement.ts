import { useCallback, useEffect, useRef } from "react";

import { ReactDevToolsListData } from "ui/components/SecondaryToolbox/react-devtools/ReactDevToolsListData";
import {
  ReplayWall,
  StoreWithInternals,
} from "ui/components/SecondaryToolbox/react-devtools/ReplayWall";

export function useHighlightNativeElement(
  store: StoreWithInternals,
  wall: ReplayWall,
  listData: ReactDevToolsListData
) {
  const currentIdRef = useRef<number>(-1);

  const highlightNativeElement = useCallback(
    (id: number) => {
      if (id !== currentIdRef.current) {
        currentIdRef.current = id;

        const rendererID = store.getRendererIDForElement(id);

        wall.send("highlightNativeElement", {
          displayName: "",
          hideAfterTimeout: true,
          id,
          openNativeElementsPanel: false,
          rendererID,
          scrollIntoView: true,
        });
      }
    },
    [store, wall]
  );

  useEffect(() => {
    return listData.addListener("selectedIndex", (index: number | null) => {
      const id = index != null ? listData.getItemAtIndex(index).id : null;
      if (id) {
        highlightNativeElement(id);
      }
    });
  }, [highlightNativeElement, listData]);

  const onMouseMove = (event: MouseEvent) => {
    if (!wall || !store) {
      return;
    }

    let currentTarget: HTMLElement | null = event.target as HTMLElement;
    while (currentTarget) {
      if (currentTarget.getAttribute("data-test-name") === "ReactDevToolsListItem") {
        const id = parseInt(currentTarget.getAttribute("data-element-id") ?? "");
        if (!isNaN(id)) {
          highlightNativeElement(id);
        }

        break;
      }

      currentTarget = currentTarget.parentElement;
    }
  };

  return onMouseMove;
}
