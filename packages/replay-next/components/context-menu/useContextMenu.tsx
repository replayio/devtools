import { MouseEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

import ContextMenu from "./ContextMenu";
import { ContextMenuContext, ContextMenuContextType } from "./ContextMenuContext";

export default function useContextMenu(
  contextMenuItems: ReactNode,
  options: {
    dataTestId?: string;
    dataTestName?: string;
    onHide?: () => void | Promise<void>;
    onShow?: (event: MouseEvent) => void | Promise<void>;
  } = {}
): {
  contextMenu: ReactNode | null;
  onContextMenu: (event: MouseEvent) => void;
} {
  const { dataTestId, dataTestName, onHide, onShow } = options;

  const committedValuesRef = useRef<{
    onHide?: () => void | Promise<void>;
    onShow?: (event: MouseEvent) => void | Promise<void>;
  }>({ onHide, onShow });

  const [contextMenuEvent, setContextMenuEvent] = useState<MouseEvent | null>(null);

  useEffect(() => {
    committedValuesRef.current.onHide = onHide;
    committedValuesRef.current.onShow = onShow;
  });

  const context = useMemo<ContextMenuContextType>(() => ({ contextMenuEvent }), [contextMenuEvent]);

  const onContextMenu = (event: MouseEvent) => {
    if (event.defaultPrevented) {
      // Support nested context menus
      return;
    }

    event.preventDefault();

    if (typeof onShow === "function") {
      onShow(event);
    }

    setContextMenuEvent(event);
  };

  const hideContextMenu = useCallback(() => {
    const { onHide } = committedValuesRef.current;

    setContextMenuEvent(null);

    if (typeof onHide === "function") {
      onHide();
    }
  }, []);

  let contextMenu = null;
  if (contextMenuEvent) {
    contextMenu = (
      <ContextMenuContext.Provider value={context}>
        <ContextMenu
          dataTestId={dataTestId}
          dataTestName={dataTestName}
          hide={hideContextMenu}
          pageX={contextMenuEvent.pageX}
          pageY={contextMenuEvent.pageY}
        >
          {contextMenuItems}
        </ContextMenu>
      </ContextMenuContext.Provider>
    );
  }

  return {
    contextMenu,
    onContextMenu,
  };
}
