import { PointsContext } from "@bvaughn/src/contexts/PointsContext";
import { useContext, useState } from "react";
import { Badge, Point } from "shared/client/types";
import Icon from "../Icon";

import styles from "./BadgePicker.module.css";
import { getBadgeStyleVars } from "./utils/getBadgeStyleVars";

export default function BadgePicker({ point }: { point: Point }) {
  const { editPoint } = useContext(PointsContext);

  const [isOpen, setIsOpen] = useState(false);

  const toggle = (badge: Badge | null) => {
    editPoint(point.id, { badge });
    setIsOpen(false);
  };

  return isOpen ? (
    <div className={styles.BadgePickerOpen}>
      <div className={styles.BadgePickerPopOut} data-test-name="BadgePickerPopout">
        <button
          className={styles.BadgePickerButton}
          data-test-name="BadgeButtonButton-default"
          onClick={() => toggle(null)}
        >
          <Icon className={styles.BadgePickerButtonIcon} type="remove" />
        </button>
        <BadgePickerButton badge="unicorn" toggle={toggle} />
        <BadgePickerButton badge="green" toggle={toggle} />
        <BadgePickerButton badge="yellow" toggle={toggle} />
        <BadgePickerButton badge="orange" toggle={toggle} />
        <BadgePickerButton badge="purple" toggle={toggle} />
      </div>
    </div>
  ) : (
    <button
      className={styles.BadgePickerButton}
      data-test-name="BadgePickerButton"
      data-test-state={point.badge || "default"}
      onClick={() => setIsOpen(true)}
    >
      <BadgePickerButtonIcon badge={point.badge} />
    </button>
  );
}

function BadgePickerButton({
  badge,
  toggle,
}: {
  badge: Badge | null;
  toggle: (badge: Badge) => void;
}) {
  let onClick;
  if (badge && toggle) {
    onClick = () => toggle(badge);
  }

  return (
    <button
      className={styles.BadgePickerButton}
      data-test-name={`BadgeButtonButton-${badge || "default"}`}
      onClick={onClick}
    >
      <BadgePickerButtonIcon badge={badge} />
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
