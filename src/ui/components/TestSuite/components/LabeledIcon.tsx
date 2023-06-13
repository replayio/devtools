import MaterialIcon from "ui/components/shared/MaterialIcon";

import styles from "./LabeledIcon.module.css";

export default function LabeledIcon({
  className = "",
  icon,
  label,
  dataTestName,
}: {
  className?: string;
  icon: string;
  label: string;
  dataTestName?: string;
}) {
  return (
    <div
      className={`${className} ${styles.LabeledIcon}`}
      data-test-name={dataTestName}
      title={label}
    >
      <MaterialIcon className={styles.Icon}>{icon}</MaterialIcon>
      <label className={styles.Label}>{label}</label>
    </div>
  );
}
