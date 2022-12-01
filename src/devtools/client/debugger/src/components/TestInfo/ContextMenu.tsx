import { useContext, useRef } from "react";
import useModalDismissSignal from "bvaughn-architecture-demo/src/hooks/useModalDismissSignal";
import { TestInfoContextMenuContext, Coordinates } from "./TestInfoContextMenuContext";
import styles from "./ContextMenu.module.css";

function ContextMenu({
  hide,
  mouseCoordinates,
}: {
  hide: () => void;
  mouseCoordinates: Coordinates;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useModalDismissSignal(ref, hide, true);

  const onClick = () => {
    hide();
  };
  
  return (
    <div
      className={styles.ContextMenu}
      data-test-id="ConsoleContextMenu"
      ref={ref}
      style={{
        left: mouseCoordinates.x,
        top: mouseCoordinates.y,
      }}
    >
      <div
        className={styles.ContextMenuItem}
        data-test-id="ConsoleContextMenu-SetFocusStartButton"
        onClick={onClick}
      >
        Play from here
      </div>
      <div
        className={styles.ContextMenuItem}
        data-test-id="ConsoleContextMenu-SetFocusStartButton"
        onClick={onClick}
      >
        Show before
      </div>
      <div
        className={styles.ContextMenuItem}
        data-test-id="ConsoleContextMenu-SetFocusStartButton"
        onClick={onClick}
      >
        Show after
      </div>
      <div
        className={styles.ContextMenuItem}
        data-test-id="ConsoleContextMenu-SetFocusStartButton"
        onClick={onClick}
      >
        Jump to source code
      </div>
    </div>
  );
}

export default function ContextMenuWrapper() {
  const { hide, mouseCoordinates } = useContext(TestInfoContextMenuContext);

  if (mouseCoordinates === null) {
    return null;
  } else {
    return <ContextMenu hide={hide} mouseCoordinates={mouseCoordinates} />;
  }
}
