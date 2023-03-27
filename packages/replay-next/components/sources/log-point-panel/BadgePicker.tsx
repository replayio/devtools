import { MouseEvent, useContext, useState } from "react";

import { PointsContext } from "replay-next/src/contexts/points/PointsContext";
import { useNag } from "replay-next/src/hooks/useNag";
import { Badge, Point } from "shared/client/types";
import { Nag } from "shared/graphql/types";

import Icon from "../../Icon";
import { getBadgeStyleVars } from "../utils/getBadgeStyleVars";
import styles from "./BadgePicker.module.css";

// Three states prevents close animation from being shown on mount.
type State = "initial" | "open" | "closed";

export default function BadgePicker({
  disabled,
  invalid,
  point,
}: {
  disabled: boolean;
  invalid: boolean;
  point: Point;
}) {
  const { editPointBadge } = useContext(PointsContext);

  const [state, setState] = useState<State>("initial");
  const [addUnicornBadgeState, dismissAddUnicornBadgeNag] = useNag(Nag.ADD_UNICORN_BADGE);
  const toggle = (badge: Badge | null) => {
    if (badge === "unicorn") {
      dismissAddUnicornBadgeNag();
    }
    editPointBadge(point.key, badge);
    setState("closed");
  };

  const isInitial = state === "initial";
  const isOpen = state === "open";

  const onClick = (event: MouseEvent) => {
    event.stopPropagation();

    if (isOpen) {
      toggle(null);
    } else {
      setState("open");
    }
  };

  return (
    <div className={styles.BadgePicker} data-invalid={invalid || undefined}>
      <button
        className={styles.BadgePickerButton}
        data-test-name={isOpen ? "BadgeButtonButton-default" : "BadgePickerButton"}
        data-test-state={point.badge || "default"}
        disabled={disabled}
        onClick={onClick}
      >
        {isOpen ? (
          <Icon className={styles.BadgePickerButtonToggleIcon} type="remove" />
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
    onClick = (event: MouseEvent) => {
      event.stopPropagation();
      toggle(targetBadge);
    };
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
