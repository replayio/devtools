import { DragEventHandler, ReactNode, useContext, useLayoutEffect } from "react";

import styles from "./styles.module.css";

export default function PanelResizeHandle({
  className = "",
  panel,
  onDrag,
}: {
  className?: string;
  panel: string;
  onDrag?: DragEventHandler<HTMLDivElement> | null;
}) {
  if (onDrag == null) {
    return null;
  }

  // TODO [panels]
  return null;
}
