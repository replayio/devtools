import { Point } from "shared/client/types";

import styles from "./BadgePicker.module.css";
import { getBadgeStyleVars } from "./utils/getBadgeStyleVars";

// TODO [source viewer]
// Badge picker UI
export default function BadgePicker({ point }: { point: Point }) {
  const badgeStyle = getBadgeStyleVars(point.badge);

  return (
    <button className={styles.BadgePickerButton}>
      <div className={styles.BadgePicker} style={badgeStyle} />
    </button>
  );
}
