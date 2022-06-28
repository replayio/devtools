import Icon from "@bvaughn/components/Icon";
import { PauseContext } from "@bvaughn/src/contexts/PauseContext";
import { PauseId } from "@replayio/protocol";
import { RefObject, useContext, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import styles from "./GoToPauseButton.module.css";

export default function GoToPauseButton({
  messageRendererRef,
  pauseId,
}: {
  messageRendererRef: RefObject<HTMLDivElement | null>;
  pauseId: PauseId | null;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const { pauseId: currentPauseId, update } = useContext(PauseContext);

  useLayoutEffect(() => {
    const button = ref.current;
    const target = messageRendererRef.current;
    if (button && target) {
      const buttonRect = button.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      button.style.left = `${targetRect.left - buttonRect.width / 2}px`;
      button.style.top = `${targetRect.top}px`;
    }
  }, [messageRendererRef]);

  if (pauseId === null) {
    return null;
  } else if (currentPauseId === pauseId) {
    // TODO Show "add comment" button for current pause
    return null;
  }

  return createPortal(
    <button
      className={styles.FastForwardButton}
      onClick={() => update(pauseId)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      ref={ref}
    >
      <Icon className={styles.FastForwardButtonIcon} type="fast-forward" />
      {isHovered && <span className={styles.Label}>Fast-forward</span>}
    </button>,
    document.body
  );
}
