import React, { MutableRefObject, ReactNode, useRef } from "react";
import ReactDOM from "react-dom";
import useModalDismissSignal from "ui/hooks/useModalDismissSignal";

export interface ContextMenuProps {
  children: ReactNode;
  close: () => void;
  x: number;
  y: number;
}

export function ContextMenu({ close, children, x, y }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Close the context menu if the user clicks outside of it or types "Escape"
  useModalDismissSignal(ref as MutableRefObject<HTMLDivElement>, close);

  return ReactDOM.createPortal(
    <div className="portal-dropdown-container">
      <div className="absolute" ref={ref} style={{ left: x, top: y, zIndex: 1001 }}>
        {children}
      </div>
    </div>,
    document.body
  );
}
