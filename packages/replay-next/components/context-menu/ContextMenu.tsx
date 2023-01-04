import { ReactNode, useRef } from "react";
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

  return createPortal(
    <div
      className={styles.ContextMenu}
      data-test-id={dataTestId}
      data-test-name={dataTestName}
      onClick={() => hide()}
      ref={ref}
      style={{
        left: pageX,
        top: pageY,
      }}
    >
      {children}
    </div>,
    document.body
  );
}
