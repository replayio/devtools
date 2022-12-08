import { MouseEvent, ReactNode, useState } from "react";

import ContextMenu from "./ContextMenu";

type Coordinates = {
  pageX: number;
  pageY: number;
};

export default function useContextMenu(
  contextMenuItems: ReactNode,
  options: {
    dataTestId?: string;
    dataTestName?: string;
  } = {}
): {
  contextMenu: ReactNode | null;
  onContextMenu: (event: MouseEvent) => void;
} {
  const { dataTestId, dataTestName } = options;

  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);

  const onContextMenu = (event: MouseEvent) => {
    event.preventDefault();

    setCoordinates({ pageX: event.pageX, pageY: event.pageY });
  };

  const hideContextMenu = () => setCoordinates(null);

  let contextMenu = null;
  if (coordinates) {
    contextMenu = (
      <ContextMenu
        dataTestId={dataTestId}
        dataTestName={dataTestName}
        hide={hideContextMenu}
        pageX={coordinates.pageX}
        pageY={coordinates.pageY}
      >
        {contextMenuItems}
      </ContextMenu>
    );
  }

  return {
    contextMenu,
    onContextMenu,
  };
}
