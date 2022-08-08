import classNames from "classnames";
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

import styles from "./Row.module.css";

export type RowProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  gap?: "small" | "medium" | "large";
};

/** Position children in a horizontal layout. */
export function Row<T extends ElementType = "div">({
  as,
  children,
  gap,
  ...props
}: RowProps<T> & ComponentPropsWithoutRef<T>) {
  const Element = as || "div";

  return (
    <Element {...props} className={classNames(styles.Root, styles[`gap-${gap}`], props.className)}>
      {children}
    </Element>
  );
}
