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
  const textSizeClass = textSize ? `text-${textSize}` : "text-sm"; // Tailwind class for textSize
  const centerClass = center ? styles.textCenter : ""; // CSS module class for center

  const inputClass = classNames(styles.textInput, textSizeClass, centerClass, className);

  return (
    <div className={styles[themeClass]}>
      <input {...otherProps} ref={ref} type="text" className={inputClass} />
    </div>
  );
});
