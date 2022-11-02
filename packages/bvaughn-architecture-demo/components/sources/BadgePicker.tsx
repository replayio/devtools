import { useContext, useState } from "react";

import { PointsContext } from "bvaughn-architecture-demo/src/contexts/PointsContext";
import { Badge, Point } from "shared/client/types";

import Icon from "../Icon";
import { getBadgeStyleVars } from "./utils/getBadgeStyleVars";
import styles from "./BadgePicker.module.css";

// Three states prevents close animation from being shown on mount.
type State = "initial" | "open" | "closed";

export default function BadgePicker({ point }: { point: Point }) {
  const { editPoint } = useContext(PointsContext);

  const [state, setState] = useState<State>("initial");

  const toggle = (badge: Badge | null) => {
    editPoint(point.id, { badge });
    setState("closed");
  };

  const isInitial = state === "initial";
  const isOpen = state === "open";

  return (
    <div className={styles.BadgePicker}>
      <button
        className={`${styles.BadgePickerButton} ${styles.BadgePickerButtonToggle}`}
        data-test-name={isOpen ? "BadgeButtonButton-default" : "BadgePickerButton"}
        data-test-state={point.badge || "default"}
        onClick={() => (isOpen ? toggle(null) : setState("open"))}
      >
        {isOpen ? (
          <Icon className={styles.BadgePickerButtonIcon} type="remove" />
        ) : (
          <BadgePickerButtonIcon badge={point.badge} />
        )}
      </button>
      {isInitial || (
        <div className={isOpen ? styles.BadgePickerOpen : styles.BadgePickerClosed} key={state}>
          <div className={styles.BadgePickerPopOut} data-test-name="BadgePickerPopout">
            <BadgePickerButton currentBadge={point.badge} targetBadge="unicorn" toggle={toggle} />
            <BadgePickerButton currentBadge={point.badge} targetBadge="green" toggle={toggle} />
            <BadgePickerButton currentBadge={point.badge} targetBadge="yellow" toggle={toggle} />
            <BadgePickerButton currentBadge={point.badge} targetBadge="orange" toggle={toggle} />
            <BadgePickerButton currentBadge={point.badge} targetBadge="purple" toggle={toggle} />
          </div>
        </div>
      )}
    </div>
  );
}

function BadgePickerButton({
  currentBadge,
  targetBadge,
  toggle,
}: {
  currentBadge: Badge | null;
  targetBadge: Badge | null;
  toggle: (badge: Badge) => void;
}) {
  let onClick;
  if (targetBadge && toggle) {
    onClick = () => toggle(targetBadge);
  }

  return (
    <button
      className={`${styles.BadgePickerButton} ${
        currentBadge === targetBadge ? styles.BadgePickerButtonCurrent : ""
      }`}
      data-test-name={`BadgeButtonButton-${targetBadge || "default"}`}
      onClick={onClick}
    >
      <BadgePickerButtonIcon badge={targetBadge} />
    </button>
  );
}

function BadgePickerButtonIcon({ badge, onClick }: { badge: Badge | null; onClick?: () => void }) {
  const badgeStyle = getBadgeStyleVars(badge);

  if (badge === "unicorn") {
    return (
      <span className={styles.UnicornBadge} onClick={onClick}>
        <span className={styles.Unicorn} />
      </span>
    );
  } else {
    return <div className={styles.BadgePickerButtonIcon} onClick={onClick} style={badgeStyle} />;
  }
}
