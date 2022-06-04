import classNames from "classnames";
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

import { SpacingProps } from "../types";
import { getSpacingClassNamesFromProps } from "../utils";

type ColumnProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
} & SpacingProps;

/** Position children in a vertical layout. */
export function Column<T extends ElementType = "div">({
  as,
  children,
  ...props
}: ColumnProps<T> & ComponentPropsWithoutRef<T>) {
  const Element = as || "div";
  const parsedProps = getSpacingClassNamesFromProps(props);

  return (
    <Element {...parsedProps} className={classNames("flex flex-col", parsedProps.className)}>
      {children}
    </Element>
  );
}
