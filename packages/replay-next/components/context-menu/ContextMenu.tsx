import { MouseEvent, ReactNode, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import useModalDismissSignal from "replay-next/src/hooks/useModalDismissSignal";

import styles from "./ContextMenu.module.css";

// TODO Should we be using clientX/clientY instead?
// I guess it doesn't matter since Replay doesn't scroll.

export default function ContextMenu({
  children,
  dataTestId,
  dataTestName = "ContextMenu",
  hide,
  pageX,
  pageY,
}: {
  children: ReactNode;
  dataTestId?: string;
  dataTestName?: string;
  hide: () => void;
  pageX: number;
  pageY: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const [offsets, setOffsets] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useModalDismissSignal(ref, hide, true);

  useLayoutEffect(() => {
    const contextMenu = ref.current;
    if (contextMenu) {
      const rect = contextMenu.getBoundingClientRect();

      let newOffsets = { ...offsets };
      if (pageX + rect.width > window.innerWidth) {
        newOffsets.x = 0 - rect.width;
      }
      if (pageY + rect.height > window.innerHeight) {
        newOffsets.y = 0 - rect.height;
      }

      if (newOffsets.x !== offsets.x || newOffsets.y !== offsets.y) {
        setOffsets(newOffsets);
      }
    }
  });

  const onClick = () => {
    hide();
  };

  const onMouseMove = (event: MouseEvent) => {
    event.stopPropagation();
  };

  return createPortal(
    <div className={styles.Backdrop} onClick={onClick} onMouseMove={onMouseMove}>
      <div
        className={styles.ContextMenu}
        data-test-id={dataTestId}
        data-test-name={dataTestName}
        ref={ref}
        style={{
          left: pageX + offsets.x,
          top: pageY + offsets.y,
        }}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
