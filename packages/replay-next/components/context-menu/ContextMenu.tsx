import { MouseEvent, ReactNode, useRef } from "react";
import { createPortal } from "react-dom";

import useModalDismissSignal from "replay-next/src/hooks/useModalDismissSignal";

import styles from "./ContextMenu.module.css";

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

  useModalDismissSignal(ref, hide, true);

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
          left: pageX,
          top: pageY,
        }}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
