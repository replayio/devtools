import classNames from "classnames";
import React from "react";

import styles from "./Checkbox.module.css";

export type CheckboxProps = { label?: React.ReactNode; secondaryLabel?: React.ReactNode } & Pick<
  React.HTMLProps<HTMLInputElement>,
  "id" | "checked" | "className" | "disabled" | "onChange" | "title"
>;

export function Checkbox({
  id,
  checked,
  className,
  disabled,
  label,
  secondaryLabel,
  onChange,
  title,
  ...props
}: CheckboxProps) {
  const checkboxProps = {
    disabled,
    id,
    checked,
    onChange,
    type: "checkbox",
  };

  return label ? (
    <label className={classNames(styles.Label, className)} {...props}>
      <input {...checkboxProps} className={styles.Input} />
      <span>{label}</span>
      {secondaryLabel ? <span className={styles.SecondaryLabel}>{secondaryLabel}</span> : null}
    </label>
  ) : (
    <input {...checkboxProps} {...props} className={classNames(styles.Input, className)} />
  );
}
