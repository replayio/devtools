import { MouseEvent, ReactNode, useState } from "react";

import { ContextMenu } from "ui/components/ContextMenu";
import { Dropdown, DropdownItem } from "ui/components/Library/LibraryDropdown";
import MaterialIcon from "ui/components/shared/MaterialIcon";

function MenuIcon({ onContextMenu }: { onContextMenu: (e: MouseEvent) => void }) {
  return (
    <button
      className="grid h-6 w-6 items-center justify-center opacity-0 group-hover:opacity-100"
      onContextMenu={onContextMenu}
      onClick={onContextMenu}
    >
      <MaterialIcon>more_vert</MaterialIcon>
    </button>
  );
}

export function Menu({
  x,
  y,
  close,
  children,
}: {
  x: number;
  y: number;
  close: () => void;
  children: ReactNode;
}) {
  return (
    <ContextMenu x={x} y={y} close={close}>
      {children}
    </ContextMenu>
  );
}

type ContextMenuType = {
  pageX: number;
  pageY: number;
};

export function MainContextMenu({ runUrl }: { runUrl: string }) {
  const [contextMenu, setContextMenu] = useState<ContextMenuType | null>(null);

  const onContextMenu = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    setContextMenu({ pageX: e.pageX - 200, pageY: e.pageY });
  };
  const onViewRun = () => {
    setContextMenu(null);
    window.open(runUrl);
  };

  return (
    <>
      <MenuIcon onContextMenu={onContextMenu} />
      {contextMenu ? (
        <Menu x={contextMenu.pageX} y={contextMenu.pageY} close={() => setContextMenu(null)}>
          <Dropdown>
            <DropdownItem onClick={onViewRun}>
              <>View GitHub Action</>
            </DropdownItem>
          </Dropdown>
        </Menu>
      ) : null}
    </>
  );
}
