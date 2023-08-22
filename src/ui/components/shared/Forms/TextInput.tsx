import classNames from "classnames";
import React from "react";

import styles from "./TextInput.module.css";

export default React.forwardRef<
  HTMLInputElement,
  Omit<React.HTMLProps<HTMLInputElement>, "type" | "className"> & {
    textSize?: "base" | "lg" | "2xl";
    center?: boolean;
    theme?: "light" | "dark";
    className?: string;
  }
>(function TextInput(props, ref) {
  const { textSize, center, theme, className, ...otherProps } = props;

  const themeClass = theme || "default";
  let textSizeClass = "text-sm"; // Default Tailwind class for textSize

  // Explicitly map textSize prop to Tailwind classes
  switch (textSize) {
    case "base":
      textSizeClass = "text-base";
      break;
    case "lg":
      textSizeClass = "text-lg";
      break;
    case "2xl":
      textSizeClass = "text-2xl";
      break;
  }

  const inputClass = classNames(
    styles.textInput,
    textSizeClass,
    center ? styles.textCenter : "",
    className
  );

  return (
    <div className={styles[themeClass]}>
      <input {...otherProps} ref={ref} type="text" className={inputClass} />
    </div>
  );
});
