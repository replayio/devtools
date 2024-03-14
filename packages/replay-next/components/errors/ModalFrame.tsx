import { ReactNode, useRef } from "react";

import Icon from "replay-next/components/Icon";
import useModalDismissSignal from "replay-next/src/hooks/useModalDismissSignal";

import styles from "./ModalFrame.module.css";
import HeaderImage from "./UnexpectedErrorFormImage.png";

export function ModalFrame({
  children,
  dataTestId,
  onDismiss,
  showCloseButton = true,
  title,
}: {
  children: ReactNode;
  dataTestId?: string;
  onDismiss: () => void;
  showCloseButton?: boolean;
  title: ReactNode;
}) {
  const modalRef = useRef<HTMLDivElement>(null);

  useModalDismissSignal(modalRef, onDismiss, true);

  return (
    <div className={styles.Background}>
      <div className={styles.Modal} ref={modalRef} data-test-id={dataTestId}>
        <div className={styles.Header}>
          <img
            className={styles.HeaderImage}
            height={HeaderImage.height}
            src={HeaderImage.src}
            width={HeaderImage.width}
          />
          {showCloseButton && (
            <button className={styles.CloseButton} onClick={onDismiss}>
              <Icon className={styles.CloseButtonIcon} type="close" />
            </button>
          )}
        </div>
        <div className={styles.Header}>{title}</div>
        {children}
      </div>
    </div>
  );
}
