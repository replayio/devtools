import MaterialIcon from "ui/components/shared/MaterialIcon";

import styles from "./LabeledIcon.module.css";

export default function LabeledIcon({
  className = "",
  icon,
  label,
}: {
  className?: string;
  icon: string;
  label: string;
}) {
  return (
    <div className={`${className} ${styles.LabeledIcon}`} title={label}>
      <MaterialIcon className={styles.Icon}>{icon}</MaterialIcon>
      <label className={styles.Label}>{label}</label>
    </div>
  );
}
