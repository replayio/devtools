import { DragEventHandler, ReactNode, useContext, useEffect, useState } from "react";

import { PanelContext } from "./PanelContext";
import { PanelId } from "./types";
import styles from "./styles.module.css";

export default function PanelResizeHandle({
  children = null,
  className = "",
  disabled = false,
  panelAfter,
  panelBefore,
}: {
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  panelAfter: PanelId;
  panelBefore: PanelId;
}) {
  const context = useContext(PanelContext);
  if (context === null) {
    throw Error(`PanelResizeHandle components must be rendered within a PanelGroup container`);
  }

  const { registerResizeHandle, unregisterResizeHandle } = context;

  const [onDrag, setOnDrag] = useState<DragEventHandler<HTMLDivElement> | null>(null);

  useEffect(() => {
    if (disabled) {
      setOnDrag(null);

      unregisterResizeHandle(panelBefore, panelAfter);
    } else {
      setOnDrag(() => registerResizeHandle(panelBefore, panelAfter));

      return () => {
        unregisterResizeHandle(panelBefore, panelAfter);
      };
    }
  }, [disabled, panelAfter, panelBefore, registerResizeHandle, unregisterResizeHandle]);

  return (
    <div
      className={[className, styles.Handle, disabled ? "" : styles.HandleEnabled].join(" ")}
      draggable={onDrag !== null}
      onDrag={onDrag || undefined}
    >
      {children}
    </div>
  );
}
