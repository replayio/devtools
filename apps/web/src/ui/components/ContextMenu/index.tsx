import React, { ReactNode } from "react";
import ReactDOM from "react-dom";

export interface ContextMenuProps {
  children: ReactNode;
  close: () => void;
  x: number;
  y: number;
}

export function ContextMenu({ close, children, x, y }: ContextMenuProps) {
  return ReactDOM.createPortal(
    <div className="portal-dropdown-container">
      <div className="mask" onClick={close} />
      <div className="absolute" style={{ left: x, top: y, zIndex: 1001 }}>
        {children}
      </div>
    </div>,
    document.body
  );
}
