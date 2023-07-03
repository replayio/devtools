import MaterialIcon from "ui/components/shared/MaterialIcon";

import styles from "./LabeledIcon.module.css";

export default function LabeledIcon({
  className = "",
  icon,
  label,
  dataTestName,
  title,
  iconClassname = "",
}: {
  className?: string;
  icon: string;
  label: string;
  dataTestName?: string;
  title?: string;
  iconClassname?: string;
}) {
  return (
    <div
      className={`${className} ${styles.LabeledIcon}`}
      data-test-name={dataTestName}
      title={title ?? label}
    >
      <MaterialIcon className={`${iconClassname} ${styles.Icon}`}>{icon}</MaterialIcon>
      <label className={styles.Label}>{label}</label>
    </div>
  );
}
