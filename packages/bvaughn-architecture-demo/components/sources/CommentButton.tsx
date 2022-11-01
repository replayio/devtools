import { TimeStampedPoint } from "@replayio/protocol";
import { useContext, useMemo, useState } from "react";

import { TimelineContext } from "bvaughn-architecture-demo/src/contexts/TimelineContext";

import Icon from "../Icon";
import styles from "./CommentButton.module.css";

// Three states prevents close animation from being shown on mount.
type State = "initial" | "open" | "closed";

export default function CommentButton({
  disabled,
  hitPoints,
  onClick,
}: {
  disabled: boolean;
  hitPoints: TimeStampedPoint[];
  onClick: () => void;
}) {
  const { executionPoint } = useContext(TimelineContext);

  const [state, setState] = useState<State>("initial");

  const isPausedAtPoint = useMemo(() => {
    return hitPoints.find(point => point.point === executionPoint) != null;
  }, [executionPoint, hitPoints]);

  return (
    <div
      className={styles.Container}
      onMouseEnter={() => setState("open")}
      onMouseLeave={() => setState("closed")}
    >
      <button
        className={[
          styles.Button,
          state === "closed" && styles.Closed,
          isPausedAtPoint ? styles.PausedStyle : styles.NotPausedStyle,
        ].join(" ")}
        disabled={disabled}
        data-test-name="PointPanel-AddCommentButton"
        onClick={onClick}
      >
        <Icon className={styles.ButtonIcon} type="comment" />
        <div className={styles.ButtonLabel}>Add comment</div>
      </button>
    </div>
  );
}
