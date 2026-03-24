import classNames from "classnames";
import React from "react";

import styles from "./TextInput.module.css";

export default React.forwardRef<
  HTMLInputElement,
  Omit<React.HTMLProps<HTMLInputElement>, "type" | "className"> & {
    textSize?: "base" | "lg" | "2xl";
    center?: boolean;
    className?: string;
  }
>(function TextInput(props, ref) {
  const { textSize, center, className, ...otherProps } = props;

  let textSizeClass = "text-sm";

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

  return <input {...otherProps} ref={ref} type="text" className={inputClass} />;
});
