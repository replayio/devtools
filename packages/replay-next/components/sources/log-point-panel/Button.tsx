import { TimeStampedPoint } from "@replayio/protocol";
import { useContext, useEffect, useMemo, useState } from "react";

import { TimelineContext } from "replay-next/src/contexts/TimelineContext";

import Icon, { IconType } from "../../Icon";
import styles from "./Button.module.css";

// Three states prevents close animation from being shown on mount.
type State = "initial" | "open" | "closed";

export default function Button({
  disabled,
  hitPoints,
  onClick,
  children,
  testName,
  iconType,
  loading,
}: {
  disabled: boolean;
  hitPoints: TimeStampedPoint[];
  onClick: () => void;
  children: string;
  testName?: string;
  loading?: boolean;
  iconType: IconType;
}) {
  const { executionPoint } = useContext(TimelineContext);

  const [state, setState] = useState<State>("initial");

  const isPausedAtPoint = useMemo(() => {
    return hitPoints.find(point => point.point === executionPoint) != null;
  }, [executionPoint, hitPoints]);

  useEffect(() => {
    if (loading) {
      setState("closed");
    }
  }, [loading]);

  return (
    <div
      className={styles.Container}
      onMouseEnter={() => !loading && setState("open")}
      onMouseLeave={() => !loading && setState("closed")}
    >
      <button
        className={[
          styles.Button,
          state === "closed" && styles.Closed,
          isPausedAtPoint ? styles.PausedStyle : styles.NotPausedStyle,
          loading && state === "closed" && styles.spinning,
        ].join(" ")}
        disabled={loading || disabled}
        data-test-name={testName || "PointPanel-Button"}
        onClick={onClick}
      >
        <div className={styles.ButtonIconWrapper}>
          <Icon className={styles.ButtonIcon} type={iconType} />
        </div>
        <div className={styles.ButtonLabel}>{children}</div>
      </button>
    </div>
  );
}
