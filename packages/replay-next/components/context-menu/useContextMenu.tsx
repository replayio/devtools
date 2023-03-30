import { MouseEvent, ReactNode, useCallback, useMemo, useState } from "react";

import ContextMenu from "./ContextMenu";
import { ContextMenuContext, ContextMenuContextType } from "./ContextMenuContext";

export default function useContextMenu(
  contextMenuItems: ReactNode,
  options: {
    dataTestId?: string;
    dataTestName?: string;
    onContextMenuEvent?: (event: MouseEvent) => void;
  } = {}
): {
  contextMenu: ReactNode | null;
  onContextMenu: (event: MouseEvent) => void;
} {
  const { dataTestId, dataTestName, onContextMenuEvent } = options;

  const [contextMenuEvent, setContextMenuEvent] = useState<MouseEvent | null>(null);

  const context = useMemo<ContextMenuContextType>(() => ({ contextMenuEvent }), [contextMenuEvent]);

  const onContextMenu = (event: MouseEvent) => {
    if (event.defaultPrevented) {
      // Support nested context menus
      return;
    }

    event.preventDefault();

    if (typeof onContextMenuEvent === "function") {
      onContextMenuEvent(event);
    }

    setContextMenuEvent(event);
  };

  const hideContextMenu = useCallback(() => setContextMenuEvent(null), []);

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
