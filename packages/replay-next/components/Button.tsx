import { ButtonHTMLAttributes } from "react";

import styles from "./Button.module.css";

export function Button({
  className = "",
  color = "primary",
  size = "normal",
  variant = "solid",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  color?: "primary" | "secondary";
  size?: "normal" | "large" | "small";
  variant?: "outline" | "solid";
}) {
  return (
    <button
      className={`${className} ${styles.Button}`}
      data-color={color}
      data-size={size}
      data-variant={variant}
      {...rest}
    />
  );
}
