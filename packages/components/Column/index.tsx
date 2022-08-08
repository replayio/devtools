import classNames from "classnames";
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

import styles from "./Column.module.css";

export type ColumnProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  gap?: "small" | "medium" | "large";
};

/** Position children in a vertical layout. */
export function Column<T extends ElementType = "div">({
  as,
  children,
  gap,
  ...props
}: ColumnProps<T> & ComponentPropsWithoutRef<T>) {
  const Element = as || "div";

  return (
    <Element {...props} className={classNames(styles.Root, styles[`gap-${gap}`], props.className)}>
      {children}
    </Element>
  );
}
